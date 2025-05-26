const express = require('express');
const { body } = require('express-validator');
const loaiSanPhamController = require('../controllers/loaisanpham.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all product types with pagination (public)
router.get('/', loaiSanPhamController.getAllLoaiSanPham);

// Get product types by category ID (public)
router.get('/by-danhmuc/:danhMucId', loaiSanPhamController.getLoaiSanPhamByDanhMucId);

// Get product type by ID (public)
router.get('/:id', loaiSanPhamController.getLoaiSanPhamById);


// Create new product type (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .notEmpty()
      .withMessage('Tên loại sản phẩm không được để trống')
      .isString()
      .withMessage('Tên loại sản phẩm phải là chuỗi'),
    body('mota')
      .optional()
      .isString()
      .withMessage('Mô tả phải là chuỗi'),
    body('hinhanh')
      .optional()
      .isString()
      .withMessage('Hình ảnh phải là chuỗi'),
    body('noibat')
      .optional()
      .isBoolean()
      .withMessage('Nổi bật phải là boolean'),
    body('madanhmuc')
      .notEmpty()
      .withMessage('Mã danh mục không được để trống')
      .isInt()
      .withMessage('Mã danh mục phải là số nguyên')
  ],
  loaiSanPhamController.createLoaiSanPham
);

// Update product type (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .optional()
      .isString()
      .withMessage('Tên loại sản phẩm phải là chuỗi'),
    body('mota')
      .optional()
      .isString()
      .withMessage('Mô tả phải là chuỗi'),
    body('hinhanh')
      .optional()
      .isString()
      .withMessage('Hình ảnh phải là chuỗi'),
    body('noibat')
      .optional()
      .isBoolean()
      .withMessage('Nổi bật phải là boolean'),
    body('madanhmuc')
      .optional()
      .isInt()
      .withMessage('Mã danh mục phải là số nguyên')
  ],
  loaiSanPhamController.updateLoaiSanPham
);

// Delete multiple product types (admin only)
router.delete(
  '/bulk',
  authenticate,
  authorize(['admin']),
  loaiSanPhamController.deleteManyLoaiSanPham
);
// Delete product type (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  loaiSanPhamController.deleteLoaiSanPham
);


module.exports = router;