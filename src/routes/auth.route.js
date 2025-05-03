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
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('phoneNumber').optional().isString(),
    body('address').optional().isString(),
    body('role')
      .optional()
      .isIn(['customer', 'admin', 'technician'])
      .withMessage('Invalid role')
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/callback/google',
  authController.googleCallback
);

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
      .withMessage('Password must be at least 8 characters')
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