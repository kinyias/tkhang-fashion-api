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
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
  );

  // Refresh token
  const refreshToken = jwt.sign(
    {
      sub: user.id,
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
    password,
    fristName,
    lastName,
    phoneNumber,
    address,
    role = 'customer',
  } = userData;

  // Check if user exists
  const existingUser = await prisma.nguoiDung.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Email đã tồn tại!');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate verification token
  const verifyToken = uuidv4();

  // Create user
  const user = await prisma.nguoiDung.create({
    data: {
      email,
      password: hashedPassword,
      fristName,
      lastName,
      phoneNumber,
      address,
      role,
      verifyToken,
    },
  });

  // Send verification email
  await emailService.sendVerificationEmail(user.email, verifyToken);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

// Login user
async function login(email, password) {
  // Find user
  const user = await prisma.nguoiDung.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    throw new Error('Sai mật khẩu');
  }

  // Check password
  const validPassword = await comparePassword(password, user.password);
  if (!validPassword) {
    throw new Error('Sai mật khẩu');
  }

  // Check if email is verified
  if (!user.emailVerified) {
    throw new Error('Email chưa được xác minh');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token in database
  await prisma.nguoiDung.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.fristName,
      lastName: user.lastName,
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
    where: { verifyToken: token },
  });

  if (!user) {
    throw new Error('Xác thực không hợp lệ hoặc đã được xác thực rồi!');
  }

  // Update user
  await prisma.nguoiDung.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verifyToken: null,
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
    where: { id: user.id },
    data: {
      resetToken,
      resetExpires,
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
      resetToken: token,
      resetExpires: {
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
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
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
        id: decoded.sub,
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
      where: { id: user.id },
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
    where: { id: userId },
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
