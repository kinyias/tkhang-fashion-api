// Size routes
const express = require('express');
const { body } = require('express-validator');
const kichCoController = require('../controllers/kichco.controller');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all sizes with pagination (public)
router.get('/', kichCoController.getAllKichCo);

// Get size by ID (public)
router.get('/:id', kichCoController.getKichCoById);

// Create new size (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .notEmpty()
      .withMessage('Tên kích cỡ không được để trống')
      .isString()
      .withMessage('Tên kích cỡ phải là chuỗi')
  ],
  kichCoController.createKichCo
);

// Update size (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('ten')
      .optional()
      .isString()
      .withMessage('Tên kích cỡ phải là chuỗi')
  ],
  kichCoController.updateKichCo
);
// Delete size (admin only)
router.delete(
  '/bulk',
  authenticate,
  authorize(['admin']),
  kichCoController.deleteManyKichCo
);
// Delete size (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  kichCoController.deleteKichCo
);

module.exports = router;