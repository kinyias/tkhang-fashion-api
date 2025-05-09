// News routes
const express = require('express');
const { body } = require('express-validator');
const tinTucController = require('../controllers/tintuc.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all news with pagination (public)
router.get('/', tinTucController.getAllTinTuc);

// Get news by ID (public)
router.get('/:id', tinTucController.getTinTucById);

// Create new news (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('tieude')
      .notEmpty()
      .withMessage('Tiêu đề không được để trống')
      .isString()
      .withMessage('Tiêu đề phải là chuỗi'),
    body('noidung')
      .notEmpty()
      .withMessage('Nội dung không được để trống')
      .isString()
      .withMessage('Nội dung phải là chuỗi'),
    body('hinhanh')
      .notEmpty()
      .withMessage('Hình ảnh không được để trống')
      .isString()
      .withMessage('Hình ảnh phải là chuỗi')
  ],
  tinTucController.createTinTuc
);

// Update news (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('tieude')
      .optional()
      .isString()
      .withMessage('Tiêu đề phải là chuỗi'),
    body('noidung')
      .optional()
      .isString()
      .withMessage('Nội dung phải là chuỗi'),
    body('hinhanh')
      .optional()
      .isString()
      .withMessage('Hình ảnh phải là chuỗi')
  ],
  tinTucController.updateTinTuc
);

// Delete news (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  tinTucController.deleteTinTuc
);

module.exports = router;