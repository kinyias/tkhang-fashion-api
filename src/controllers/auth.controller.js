const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      role: req.body.role || 'khachhang',
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

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    return res.status(200).json({
      message: 'Login successful',
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
        where: { id: user.id },
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
    const { password } = req.body;
    const result = await authService.resetPassword(token, password);
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
    const result = await authService.logout(req.user.id);
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
