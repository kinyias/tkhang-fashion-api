// Promotion routes
const express = require('express');
const { body } = require('express-validator');
const khuyenMaiController = require('../controllers/khuyenmai.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all promotions with pagination (public)
router.get('/', khuyenMaiController.getAllKhuyenMai);

// Get promotion by ID (public)
router.get('/:id', khuyenMaiController.getKhuyenMaiById);

// Create new promotion (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .notEmpty()
      .withMessage('Tên khuyến mãi không được để trống')
      .isString()
      .withMessage('Tên khuyến mãi phải là chuỗi'),
    body('loaikhuyenmai')
      .notEmpty()
      .withMessage('Loại khuyến mãi không được để trống')
      .isIn(['tien_mat', 'phan_tram'])
      .withMessage('Loại khuyến mãi không hợp lệ'),
    body('giatrigiam')
      .notEmpty()
      .withMessage('Giá trị giảm không được để trống')
      .isFloat({ min: 0 })
      .withMessage('Giá trị giảm phải là số dương'),
    body('giatridonhang')
      .notEmpty()
      .withMessage('Giá trị đơn hàng tối thiểu không được để trống')
      .isFloat({ min: 0 })
      .withMessage('Giá trị đơn hàng tối thiểu phải là số dương'),
    body('giamtoida')
      .notEmpty()
      .withMessage('Giá trị giảm tối đa không được để trống')
      .isFloat({ min: 0 })
      .withMessage('Giá trị giảm tối đa phải là số dương'),
    body('ngaybatdat')
      .notEmpty()
      .withMessage('Ngày bắt đầu không được để trống')
      .isISO8601()
      .withMessage('Ngày bắt đầu không hợp lệ'),
    body('ngayketthuc')
      .notEmpty()
      .withMessage('Ngày kết thúc không được để trống')
      .isISO8601()
      .withMessage('Ngày kết thúc không hợp lệ')
  ],
  khuyenMaiController.createKhuyenMai
);

// Update promotion (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .optional()
      .isString()
      .withMessage('Tên khuyến mãi phải là chuỗi'),
    body('loaikhuyenmai')
      .optional()
      .isIn(['tien_mat', 'phan_tram'])
      .withMessage('Loại khuyến mãi không hợp lệ'),
    body('giatrigiam')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Giá trị giảm phải là số dương'),
    body('giatridonhang')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Giá trị đơn hàng tối thiểu phải là số dương'),
    body('giamtoida')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Giá trị giảm tối đa phải là số dương'),
    body('ngaybatdat')
      .optional()
      .isISO8601()
      .withMessage('Ngày bắt đầu không hợp lệ'),
    body('ngayketthuc')
      .optional()
      .isISO8601()
      .withMessage('Ngày kết thúc không hợp lệ')
  ],
  khuyenMaiController.updateKhuyenMai
);

// Delete promotion (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  khuyenMaiController.deleteKhuyenMai
);

module.exports = router;