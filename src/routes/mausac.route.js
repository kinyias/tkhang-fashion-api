// Color routes
const express = require('express');
const { body } = require('express-validator');
const mauSacController = require('../controllers/mausac.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all colors with pagination (public)
router.get('/', mauSacController.getAllMauSac);

// Get color by ID (public)
router.get('/:id', mauSacController.getMauSacById);

// Create new color (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .notEmpty()
      .withMessage('Tên màu sắc không được để trống')
      .isString()
      .withMessage('Tên màu sắc phải là chuỗi'),
    body('ma_mau')
      .notEmpty()
      .withMessage('Mã màu không được để trống')
      .isString()
      .withMessage('Mã màu phải là chuỗi'),
  ],
  mauSacController.createMauSac
);

// Update color (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .optional()
      .isString()
      .withMessage('Tên màu sắc phải là chuỗi'),
    body('ma_mau')
      .optional()
      .isString()
      .withMessage('Mã màu phải là chuỗi')
  ],
  mauSacController.updateMauSac
);
// Delete color (admin only)
router.delete(
  '/bulk',
  authenticate,
  authorize(['admin']),
  mauSacController.deleteManyMauSac
);
// Delete color (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  mauSacController.deleteMauSac
);

module.exports = router;