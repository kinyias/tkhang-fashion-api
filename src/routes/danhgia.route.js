const express = require('express');
const { body } = require('express-validator');
const danhGiaController = require('../controllers/danhgia.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all reviews with pagination (public)
router.get('/', danhGiaController.getAllDanhGia);

// Get all reviews for admin with filters (admin only)
router.get(
  '/admin',
  authenticate,
  authorize(['admin']),
  danhGiaController.getAdminDanhGia
);

// Get review by ID (public)
router.get('/:id', danhGiaController.getDanhGiaById);

// Create new review (authenticated users only)
router.post(
  '/',
  authenticate,
  [
    body('sosao')
      .notEmpty()
      .withMessage('Số sao không được để trống')
      .isInt({ min: 1, max: 5 })
      .withMessage('Số sao phải từ 1 đến 5'),
    body('binhluan')
      .notEmpty()
      .withMessage('Bình luận không được để trống')
      .isString()
      .withMessage('Bình luận phải là chuỗi'),
    body('hinhAnh').optional().isString().withMessage('Hình ảnh phải là chuỗi'),
    body('masp')
      .notEmpty()
      .withMessage('Mã sản phẩm không được để trống')
      .isInt()
      .withMessage('Mã sản phẩm phải là số'),
  ],
  danhGiaController.createDanhGia
);

// Update review (owner only)
router.put(
  '/:id',
  authenticate,
  [
    body('sosao')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Số sao phải từ 1 đến 5'),
    body('binhluan')
      .optional()
      .isString()
      .withMessage('Bình luận phải là chuỗi'),
    body('hinhAnh').optional().isString().withMessage('Hình ảnh phải là chuỗi'),
  ],
  danhGiaController.updateDanhGia
);

// Delete multiple reviews (admin only)
router.delete(
  '/bulk',
  authenticate,
  authorize(['admin']),
  danhGiaController.deleteManyDanhGia
);

// Delete review (owner or admin)
router.delete('/:id', authenticate, danhGiaController.deleteDanhGia);

module.exports = router;
