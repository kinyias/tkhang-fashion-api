// Category routes
const express = require('express');
const { body } = require('express-validator');
const danhMucController = require('../controllers/danhmuc.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all categories with pagination (public)
router.get('/', danhMucController.getAllDanhMuc);

// Get category by ID (public)
router.get('/:id', danhMucController.getDanhMucById);

// Create new category (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .notEmpty()
      .withMessage('Tên danh mục không được để trống')
      .isString()
      .withMessage('Tên danh mục phải là chuỗi'),
    body('mota')
      .optional()
      .isString()
      .withMessage('Mô tả phải là chuỗi')
  ],
  danhMucController.createDanhMuc
);

// Update category (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .optional()
      .isString()
      .withMessage('Tên danh mục phải là chuỗi'),
    body('mota')
      .optional()
      .isString()
      .withMessage('Mô tả phải là chuỗi')
  ],
  danhMucController.updateDanhMuc
);

// Delete multiple categories (admin only)
router.delete(
  '/bulk',
  authenticate,
  authorize(['admin']),
  danhMucController.deleteManyDanhMuc
);

// Delete category (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  danhMucController.deleteDanhMuc
);


module.exports = router;