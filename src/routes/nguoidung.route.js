// User routes
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/nguoidung.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, userController.getProfile);

// Update user profile
router.put(
  '/profile',
  authenticate,
  [
    body('ho').optional().isString(),
    body('ten').optional().isString(),
    body('so_dien_thoai').optional().isString(),
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
      .withMessage('Mât khẩu hiện tại không được để trống'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Mât khẩu mới phải có ít nhất 8 ký tự'),
  ],
  userController.changePassword
);

// Admin routes
router.get(
  '/admin/users',
  authenticate,
  authorize(['admin']),
  userController.getAllUsers
);

router.post(
  '/admin/users',
  authenticate,
  authorize(['admin']),
  [
    body('email')
      .isEmail()
      .withMessage('Email không hợp lệ')
      .notEmpty()
      .withMessage('Email không được để trống'),
    body('ho').optional().isString().withMessage('Họ phải là chuỗi'),
    body('ten').optional().isString().withMessage('Tên phải là chuỗi'),
    body('so_dien_thoai')
      .optional()
      .isString()
      .withMessage('Số điện thoại phải là chuỗi'),
    body('vai_tro').notEmpty().withMessage('Vai trò không được để trống'),
    body('mat_khau')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
      .notEmpty()
      .withMessage('Mật khẩu không được để trống'),
  ],
  userController.createUser
);

router.put(
  '/admin/users/:id/role',
  authenticate,
  authorize(['admin']),
  [body('vai_tro').notEmpty().withMessage('Vai trò không được để trống')],
  userController.updateUserRole
);

router.put(
  '/admin/users/:id',
  authenticate,
  authorize(['admin']),
  [
    body('ho').optional().isString().withMessage('Họ phải là chuỗi'),
    body('ten').optional().isString().withMessage('Tên phải là chuỗi'),
    body('so_dien_thoai')
      .optional()
      .isString()
      .withMessage('Số điện thoại phải là chuỗi'),
  ],
  userController.updateUser
);

module.exports = router;
