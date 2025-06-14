const express = require('express');
const { body } = require('express-validator');
const tinTucController = require('../controllers/tintuc.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all news with pagination (public)
router.get('/', tinTucController.getAllTinTuc);

// Get news by category ID (public)
router.get('/by-loaitin/:loaiTinId', tinTucController.getTinTucByLoaiTinId);
router.patch('/:id/views', tinTucController.increaseViewCount);
// Get news by ID (public)
router.get('/:id', tinTucController.getTinTucById);

// Create new news (admin and staff only)
router.post(
  '/',
  authenticate,
  authorize(['admin', 'staff']),
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
    body('hinhdaidien')
      .notEmpty()
      .withMessage('Hình đại diện không được để trống')
      .isString()
      .withMessage('Hình đại diện phải là chuỗi'),
    body('tinhot')
      .optional()
      .isBoolean()
      .withMessage('Tin hot phải là boolean'),
    body('trangthai')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái phải là boolean'),
    body('maloaitin')
      .notEmpty()
      .withMessage('Mã loại tin không được để trống')
      .isInt()
      .withMessage('Mã loại tin phải là số nguyên'),
  ],
  tinTucController.createTinTuc
);

// Update news (admin and staff only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'staff']),
  [
    body('tieude').optional().isString().withMessage('Tiêu đề phải là chuỗi'),
    body('noidung').optional().isString().withMessage('Nội dung phải là chuỗi'),
    body('hinhdaidien')
      .optional()
      .isString()
      .withMessage('Hình đại diện phải là chuỗi'),
    body('tinhot')
      .optional()
      .isBoolean()
      .withMessage('Tin hot phải là boolean'),
    body('trangthai')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái phải là boolean'),
    body('maloaitin')
      .optional()
      .isInt()
      .withMessage('Mã loại tin phải là số nguyên'),
  ],
  tinTucController.updateTinTuc
);

// Delete multiple news (admin only)
router.delete(
  '/bulk',
  authenticate,
  authorize(['admin']),
  tinTucController.deleteManyTinTuc
);

// Delete news (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  tinTucController.deleteTinTuc
);

router.get('/:id/related', tinTucController.getRelatedTinTuc);

module.exports = router;
