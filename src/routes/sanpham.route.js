const express = require('express');
const { body } = require('express-validator');
const sanPhamController = require('../controllers/sanpham.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all products with pagination (public)
router.get('/', sanPhamController.getAllSanPham);

// Get all products with variants (public)
router.get('/with-variants', sanPhamController.getAllSanPhamWithVariants);
// Advanced product search with comprehensive filtering (public)
router.get('/advanced-search', sanPhamController.advancedSearchSanPham);
router.post('/elasticsearch/create-index', sanPhamController.createIndexES);
router.get('/elasticsearch/sync-all', sanPhamController.syncAllProductsToES);
router.get('/elasticsearch/health', sanPhamController.checkElasticsearchHealth);
router.post('/elasticsearch/sync/:productId', sanPhamController.syncProductToES);
// Get product by ID (public)
router.get('/:id', sanPhamController.getSanPhamById);

// Create new product (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .notEmpty()
      .withMessage('Tên sản phẩm không được để trống')
      .isString()
      .withMessage('Tên sản phẩm phải là chuỗi'),
    body('mota')
      .optional()
      .isString()
      .withMessage('Mô tả phải là chuỗi'),
    body('giaban')
      .notEmpty()
      .withMessage('Giá bán không được để trống')
      .isNumeric()
      .withMessage('Giá bán phải là số'),
    body('giagiam')
      .optional()
      .isNumeric()
      .withMessage('Giá giảm phải là số'),
    body('hinhanh')
      .optional()
      .isString()
      .withMessage('Hình ảnh phải là chuỗi'),
    body('noibat')
      .optional()
      .isBoolean()
      .withMessage('Nổi bật phải là boolean'),
    body('trangthai')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái phải là boolean'),
    body('madanhmuc')
      .notEmpty()
      .withMessage('Mã danh mục không được để trống')
      .isInt()
      .withMessage('Mã danh mục phải là số nguyên'),
    body('maloaisanpham')
      .notEmpty()
      .withMessage('Mã loại sản phẩm không được để trống')
      .isInt()
      .withMessage('Mã loại sản phẩm phải là số nguyên'),
    body('mathuonghieu')
      .notEmpty()
      .withMessage('Mã thương hiệu không được để trống')
      .isInt()
      .withMessage('Mã thương hiệu phải là số nguyên'),
    body('bienThes')
      .optional()
      .isArray()
      .withMessage('Biến thể phải là mảng'),
    body('bienThes.*.gia')
      .optional()
      .isNumeric()
      .withMessage('Giá biến thể phải là số'),
    body('bienThes.*.soluong')
      .optional()
      .isInt()
      .withMessage('Số lượng biến thể phải là số nguyên'),
    body('bienThes.*.mamausac')
      .optional()
      .isInt()
      .withMessage('Mã màu sắc phải là số nguyên'),
    body('bienThes.*.makichco')
      .optional()
      .isInt()
      .withMessage('Mã kích cỡ phải là số nguyên'),
    body('mauSacs')
      .optional()
      .isArray()
      .withMessage('Màu sắc phải là mảng'),
    body('mauSacs.*.ten')
      .optional()
      .isString()
      .withMessage('Tên màu sắc phải là chuỗi'),
    body('mauSacs.*.ma_mau')
      .optional()
      .isString()
      .withMessage('Mã màu phải là chuỗi'),
    body('mauSacs.*.hinhAnhs')
      .optional()
      .isArray()
      .withMessage('Hình ảnh màu sắc phải là mảng'),
    body('mauSacs.*.hinhAnhs.*.url')
      .optional()
      .isString()
      .withMessage('URL hình ảnh phải là chuỗi'),
    body('mauSacs.*.hinhAnhs.*.anhChinh')
      .optional()
      .isBoolean()
      .withMessage('Ảnh chính phải là boolean')
  ],
  sanPhamController.createSanPham
);

// Update product (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .optional()
      .isString()
      .withMessage('Tên sản phẩm phải là chuỗi'),
    body('mota')
      .optional()
      .isString()
      .withMessage('Mô tả phải là chuỗi'),
    body('giaban')
      .optional()
      .isNumeric()
      .withMessage('Giá bán phải là số'),
    body('giagiam')
      .optional()
      .isNumeric()
      .withMessage('Giá giảm phải là số'),
    body('hinhanh')
      .optional()
      .isString()
      .withMessage('Hình ảnh phải là chuỗi'),
    body('noibat')
      .optional()
      .isBoolean()
      .withMessage('Nổi bật phải là boolean'),
    body('trangthai')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái phải là boolean'),
    body('madanhmuc')
      .optional()
      .isInt()
      .withMessage('Mã danh mục phải là số nguyên'),
    body('maloaisanpham')
      .optional()
      .isInt()
      .withMessage('Mã loại sản phẩm phải là số nguyên'),
    body('mathuonghieu')
      .optional()
      .isInt()
      .withMessage('Mã thương hiệu phải là số nguyên')
  ],
  sanPhamController.updateSanPham
);
// Delete multiple products (admin only)
router.delete(
  '/bulk',
  authenticate,
  authorize(['admin']),
  sanPhamController.deleteManySanPham
);

// Delete product (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  sanPhamController.deleteSanPham
);


module.exports = router;