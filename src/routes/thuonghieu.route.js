const express = require('express');
const { body } = require('express-validator');
const thuongHieuController = require('../controllers/thuonghieu.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all brands with pagination (public)
router.get('/', thuongHieuController.getAllThuongHieu);

// Get brand by ID (public)
router.get('/:id', thuongHieuController.getThuongHieuById);

// Create new brand (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .notEmpty()
      .withMessage('Tên thương hiệu không được để trống')
      .isString()
      .withMessage('Tên thương hiệu phải là chuỗi'),
    body('mota')
      .optional()
      .isString()
      .withMessage('Mô tả phải là chuỗi')
  ],
  thuongHieuController.createThuongHieu
);

// Update brand (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .optional()
      .isString()
      .withMessage('Tên thương hiệu phải là chuỗi'),
    body('mota')
      .optional()
      .isString()
      .withMessage('Mô tả phải là chuỗi')
  ],
  thuongHieuController.updateThuongHieu
);

// Delete brand (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  thuongHieuController.deleteThuongHieu
);

module.exports = router;