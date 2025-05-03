// User routes
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, userController.getProfile);

// Update user profile
router.put(
  '/profile',
  authenticate,
  [
    body('fristName').optional().isString(),
    body('lastName').optional().isString(),
    body('phoneNumber').optional().isString(),
    body('address').optional().isString(),
  ],
  userController.updateProfile
);

// Change password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  userController.changePassword
);

// Admin routes
router.get('/admin/users', authorize(['admin']), async (req, res) => {
  const users = await prisma.nguoiDung.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  res.json(users);
});

module.exports = router;
