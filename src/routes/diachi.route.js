const express = require('express');
const { body } = require('express-validator');
const diaChiController = require('../controllers/diachi.controller');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all addresses with pagination (public)
router.get('/',authenticate, diaChiController.getAllDiaChi);

// Get addresses by user ID (public)
router.get('/by-user/:userId', authenticate, diaChiController.getDiaChiByUserId);

// Get address by ID (public)
router.get('/:id', diaChiController.getDiaChiById);

// Create new address (authenticated users only)
router.post(
  '/',
  authenticate,
  [
    body('tennguoinhan')
      .notEmpty()
      .withMessage('Tên người nhận không được để trống')
      .isString()
      .withMessage('Tên người nhận phải là chuỗi'),
    body('email').optional().isEmail().withMessage('Email không hợp lệ'),
    body('sodienthoai')
      .notEmpty()
      .withMessage('Số điện thoại không được để trống')
      .matches(/^[0-9]{10,11}$/)
      .withMessage('Số điện thoại không hợp lệ'),
    body('diachi')
      .notEmpty()
      .withMessage('Địa chỉ không được để trống')
      .isString()
      .withMessage('Địa chỉ phải là chuỗi'),
    body('phuongxa')
      .notEmpty()
      .withMessage('Phường/Xã không được để trống')
      .isString()
      .withMessage('Phường/Xã phải là chuỗi'),
    body('quanhuyen')
      .notEmpty()
      .withMessage('Quận/Huyện không được để trống')
      .isString()
      .withMessage('Quận/Huyện phải là chuỗi'),
    body('tinhthanh')
      .notEmpty()
      .withMessage('Tỉnh/Thành không được để trống')
      .isString()
      .withMessage('Tỉnh/Thành phải là chuỗi'),
    body('macdinh')
      .optional()
      .isBoolean()
      .withMessage('Mặc định phải là boolean'),
    body('loaidiachi')
      .notEmpty()
      .withMessage('Loại địa chỉ không được để trống')
      .isIn(['NHA', 'VAN_PHONG', 'KHAC'])
      .withMessage('Loại địa chỉ không hợp lệ'),
  ],
  diaChiController.createDiaChi
);

// Update address (authenticated users only)
router.put(
  '/:id',
  authenticate,
  [
    body('tennguoinhan')
      .optional()
      .isString()
      .withMessage('Tên người nhận phải là chuỗi'),
    body('email').optional().isEmail().withMessage('Email không hợp lệ'),
    body('sodienthoai')
      .optional()
      .matches(/^[0-9]{10,11}$/)
      .withMessage('Số điện thoại không hợp lệ'),
    body('diachi').optional().isString().withMessage('Địa chỉ phải là chuỗi'),
    body('phuongxa')
      .optional()
      .isString()
      .withMessage('Phường/Xã phải là chuỗi'),
    body('quanhuyen')
      .optional()
      .isString()
      .withMessage('Quận/Huyện phải là chuỗi'),
    body('tinhthanh')
      .optional()
      .isString()
      .withMessage('Tỉnh/Thành phải là chuỗi'),
    body('macdinh')
      .optional()
      .isBoolean()
      .withMessage('Mặc định phải là boolean'),
    body('loaidiachi')
      .optional()
      .isIn(['NHA', 'VAN_PHONG', 'KHAC'])
      .withMessage('Loại địa chỉ không hợp lệ'),
  ],
  diaChiController.updateDiaChi
);

// Delete multiple addresses (authenticated users only)
router.delete('/bulk', authenticate, diaChiController.deleteManyDiaChi);

// Delete address (authenticated users only)
router.delete('/:id', authenticate, diaChiController.deleteDiaChi);

module.exports = router;
