// Authentication routes
const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Nhập email hợp lệ'),
    body('mat_khau')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu phải có ít nhất 8 ký tự'),
    body('ho').optional().isString(),
    body('ten').optional().isString(),
    body('so_dien_thoai').optional().isString(),
    body('vai_tro')
      .optional()
      .isIn(['khach_hang', 'admin'])
      .withMessage('Vai trò không hợp lệ'),
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Nhập email hợp lệ'),
    body('mat_khau').notEmpty().withMessage('Mật khẩu không được để trống'),
  ],
  authController.login
);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/callback/google', authController.googleCallback);

// Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// Request password reset
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Enter a valid email')],
  authController.requestPasswordReset
);

// Reset password
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu phải có ít nhất 8 ký tự'),
  ],
  authController.resetPassword
);

// Refresh token
router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  authController.refreshToken
);

// Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
