const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const passport = require('passport');
const prisma = require('../lib/prisma')
// Register
async function register(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userData = {
      email: req.body.email,
      mat_khau: req.body.mat_khau,
      ho: req.body.ho,
      ten: req.body.ten,
      so_dien_thoai: req.body.so_dien_thoai,
      vai_tro: req.body.vai_tro || 'khach_hang',
    };

    const user = await authService.register(userData);
    return res.status(201).json({
      message:
        'Đăng kí thành công! Vui lòng kiểm tra email để xác thực tài khoản!',
      user,
    });
  } catch (error) {
    next(error);
  }
}

// Login
async function login(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, mat_khau } = req.body;
    const result = await authService.login(email, mat_khau);
    
    return res.status(200).json({
      message: 'Đăng nhập thành công',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Google OAuth callback
function googleCallback(req, res, next) {
  passport.authenticate('google', { session: false }, async (err, user) => {
    try {
      if (err || !user) {
        return res.redirect(
          `${process.env.CLIENT_BASE_URL}/auth/login?error=google_auth_failed`
        );
      }

      // Generate tokens
      const { accessToken, refreshToken } = authService.generateTokens(user);

      // Store refresh token
      await prisma.nguoiDung.update({
        where: { ma: user.ma },
        data: { refreshToken },
      });

      // Redirect to frontend with tokens
      return res.redirect(
        `${process.env.CLIENT_BASE_URL}/oauth-callback?token=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      next(error);
    }
  })(req, res, next);
}

// Verify email
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params;
    const result = await authService.verifyEmail(token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Request password reset
async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Reset password
async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { mat_khau } = req.body;
    const result = await authService.resetPassword(token, mat_khau);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Refresh token
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    return res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
}

// Logout
async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.user.ma);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  googleCallback,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  logout,
};
