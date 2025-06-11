const express = require('express');
const { body } = require('express-validator');
const loaiTinController = require('../controllers/loaitin.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all news categories with pagination (public)
router.get('/', loaiTinController.getAllLoaiTin);

// Get news categories by status (public)
router.get('/by-trangthai/:trangthai', loaiTinController.getLoaiTinByTrangThai);

// Get news category by ID (public)
router.get('/:id', loaiTinController.getLoaiTinById);

// Create new news category (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('tenloaitin')
      .notEmpty()
      .withMessage('Tên loại tin không được để trống')
      .isString()
      .withMessage('Tên loại tin phải là chuỗi'),
    body('trangthai')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái phải là boolean'),
  ],
  loaiTinController.createLoaiTin
);

// Update news category (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('tenloaitin')
      .optional()
      .isString()
      .withMessage('Tên loại tin phải là chuỗi'),
    body('trangthai')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái phải là boolean'),
  ],
  loaiTinController.updateLoaiTin
);

// Delete multiple news categories (admin only)
router.delete(
  '/bulk',
  authenticate,
  authorize(['admin']),
  loaiTinController.deleteManyLoaiTin
);

// Delete news category (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  loaiTinController.deleteLoaiTin
);

module.exports = router;
