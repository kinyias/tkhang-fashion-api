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
router.get('/admin/users', authorize(['admin']), async (req, res) => {
  const users = await prisma.nguoiDung.findMany({
    select: {
      ma: true,
      email: true,
      ho: true,
      ten: true,
      vai_tro: true,
      xac_thuc_email: true,
      ngay_tao: true,
    },
  });
  res.json(users);
});

module.exports = router;
