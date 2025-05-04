const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./email.service');

// Hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT tokens
function generateTokens(user) {
  // Access token
  const accessToken = jwt.sign(
    {
      sub: user.ma,
      email: user.email,
      vai_tro: user.vai_tro,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
  );

  // Refresh token
  const refreshToken = jwt.sign(
    {
      sub: user.ma,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
  );

  return { accessToken, refreshToken };
}

// Register user
async function register(userData) {
  const {
    email,
    mat_khau,
    ho,
    ten,
    so_dien_thoai,
    vai_tro = 'khach_hang',
  } = userData;

  // Check if user exists
  const existingUser = await prisma.nguoiDung.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Email đã tồn tại!');
  }

  // Hash password
  const hashedPassword = await hashPassword(mat_khau);

  // Generate verification token
  const verifyToken = uuidv4();

  // Create user
  const user = await prisma.nguoiDung.create({
    data: {
      email,
      mat_khau: hashedPassword,
      ho,
      ten,
      so_dien_thoai,
      vai_tro,
      ma_xac_nhan: verifyToken,
    },
  });

  // Send verification email
  await emailService.sendVerificationEmail(user.email, verifyToken);

  return {
    ma: user.ma,
    email: user.email,
    ho: user.ho,
    ten: user.ten,
    vai_tro: user.role,
  };
}

// Login user
async function login(email, mat_khau) {
  // Find user
  const user = await prisma.nguoiDung.findUnique({
    where: { email },
  });

  if (!user || !user.mat_khau) {
    throw new Error('Sai mật khẩu');
  }

  // Check password
  const validPassword = await comparePassword(mat_khau, user.mat_khau);
  if (!validPassword) {
    throw new Error('Sai mật khẩu');
  }

  // Check if email is verified
  if (!user.xac_thuc_email) {
    throw new Error('Email chưa được xác minh');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token in database
  await prisma.nguoiDung.update({
    where: { ma: user.ma },
    data: { refreshToken },
  });

  return {
    user: {
      ma: user.ma,
      email: user.email,
      ho: user.ho,
      ten: user.ten,
      role: user.role,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

// Verify email
async function verifyEmail(token) {
  const user = await prisma.nguoiDung.findFirst({
    where: { ma_xac_nhan: token },
  });

  if (!user) {
    throw new Error('Xác thực không hợp lệ hoặc đã được xác thực rồi!');
  }

  // Update user
  await prisma.nguoiDung.update({
    where: { ma: user.ma },
    data: {
      xac_thuc_email: true,
      ma_xac_nhan: null,
    },
  });

  return {
    message: 'Xác thực email thành công!',
  };
}

// Request password reset
async function requestPasswordReset(email) {
  const user = await prisma.nguoiDung.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Không tìm thấy người dùng với email này!');
  }

  // Generate reset token
  const resetToken = uuidv4();
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour

  // Update user
  await prisma.nguoiDung.update({
    where: { ma: user.ma },
    data: {
      ma_dat_lai:resetToken,
      han_ma_dat_lai:resetExpires,
    },
  });

  // Send reset email
  await emailService.sendPasswordResetEmail(user.email, resetToken);

  return {
    message: 'Cài lại email xác thực đã được gửi!',
  };
}

// Reset password
async function resetPassword(token, newPassword) {
  const user = await prisma.nguoiDung.findFirst({
    where: {
      ma_dat_lai: token,
      han_ma_dat_lai: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Xác thực không hợp lệ hoặc đã hết hạn!');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user
  await prisma.nguoiDung.update({
    where: { ma: user.ma },
    data: {
      mat_khau: hashedPassword,
      ma_dat_lai: null,
      han_ma_dat_lai: null,
    },
  });

  return {
    message: 'Cài lại mật khẩu thành công!',
  };
}

// Refresh token
async function refreshAccessToken(token) {
  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user with the token
    const user = await prisma.nguoiDung.findFirst({
      where: {
        ma: decoded.sub,
        refreshToken: token,
      },
    });

    if (!user) {
      throw new Error('Xác thực không hợp lệ!');
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update refresh token in database
    await prisma.nguoiDung.update({
      where: { ma: user.ma },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new Error('Xác thực không hợp lệ!');
  }
}

// Logout
async function logout(userId) {
  await prisma.nguoiDung.update({
    where: { ma: userId },
    data: { refreshToken: null },
  });

  return {
    message: 'Đăng xuất thành công!',
  };
}

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logout,
  generateTokens,
};
