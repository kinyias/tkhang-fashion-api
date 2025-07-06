const express = require('express');
const { body, param, query } = require('express-validator');
const donHangController = require('../controllers/donhang.controller');
const {
  authenticate,
  authorize,
  authenticateUser,
} = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all orders with pagination and filtering (admin only)
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Giới hạn phải là số nguyên dương'),
    query('trangthai').optional().isIn(['da_dat', 'dang_xu_ly', 'dang_giao_hang', 'da_giao_hang', 'da_huy']).withMessage('Trạng thái không hợp lệ'),
    query('startDate').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('endDate').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ')
  ],
  donHangController.getAllDonHang
);

// Get order by with chi tiet don hang ID (admin or order owner)
router.get(
  '/:id',
  authenticate,
  [
    param('id').isInt().withMessage('ID đơn hàng phải là số nguyên')
  ],
  donHangController.getDonHangWithChiTietById
);
// Get order by ID
router.get(
  '/:id/xac-nhan',
  [
    param('id').isInt().withMessage('ID đơn hàng phải là số nguyên')
  ],
  donHangController.getDonHangById
);

// Get orders by user ID (for user profile)
router.get(
  '/user/me',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Giới hạn phải là số nguyên dương'),
    query('trangthai').optional().isIn(['da_dat', 'dang_xu_ly', 'dang_giao_hang', 'da_giao_hang', 'da_huy']).withMessage('Trạng thái không hợp lệ')
  ],
  donHangController.getDonHangByUserId
);

// Create new order (authenticated users)
router.post(
  '/',
  authenticateUser,
  [
    body('ten').notEmpty().withMessage('Tên không được để trống'),
    body('email').optional().isEmail().withMessage('Nhập email hợp lệ'),
    body('diachi').notEmpty().withMessage('Địa chỉ không được để trống'),
    body('thanhpho').notEmpty().withMessage('Thành phố không được để trống'),
    body('quan').notEmpty().withMessage('Quận không được để trống'),
    body('phuong').notEmpty().withMessage('Phường không được để trống'),
    body('sdt').notEmpty().withMessage('Số điện thoại không được để trống')
      .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
    body('tonggia').isFloat({ min: 0 }).withMessage('Tổng tiền phải là số dương'),
    body('tamtinh').isFloat({ min: 0 }).withMessage('Tạm tính phải là số dương'),
    body('tamtinh').isFloat({ min: 0 }).withMessage('Tạm tính phải là số dương'),
    body('phuongthucgiaohang').notEmpty().withMessage('Quận không được để trống'),
    body('phigiaohang').isFloat({ min: 0 }).withMessage('Phí giao hàng phải là số dương'),
    body('chiTietDonHangs').isArray({ min: 1 }).withMessage('Đơn hàng phải có ít nhất một sản phẩm'),
    body('chiTietDonHangs.*.masp').isInt().withMessage('Mã sản phẩm phải là số nguyên'),
    body('chiTietDonHangs.*.mabienthe').isInt().withMessage('Mã biến thể phải là số nguyên'),
    body('chiTietDonHangs.*.soluong').isInt({ min: 1 }).withMessage('Số lượng phải là số nguyên dương'),
    body('chiTietDonHangs.*.dongia').isFloat({ min: 0 }).withMessage('Đơn giá phải là số dương'),
    body('thanhToan.phuongthuc').optional().isString().withMessage('Phương thức thanh toán phải là chuỗi')
  ],
  donHangController.createDonHang
);

// Update order status (admin only)
router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin']),
  [
    param('id').notEmpty().withMessage('ID đơn hàng không được để trống'),
    body('trangthai').isIn(['da_dat', 'dang_xu_ly', 'dang_giao_hang', 'da_giao_hang', 'da_huy']).withMessage('Trạng thái không hợp lệ')
  ],
  donHangController.updateDonHangStatus
);

// Update payment status (admin only)
// router.patch(
//   '/thanhtoan/:id',
//   authenticate,
//   authorize(['admin']),
//   [
//     param('id').isInt().withMessage('ID thanh toán phải là số nguyên'),
//     body('trangthai').isBoolean().withMessage('Trạng thái thanh toán phải là boolean')
//   ],
//   donHangController.updateThanhToanStatus
// );

// Cancel order (admin or order owner)
router.post(
  '/:id/cancel',
  authenticate,
  [
    param('id').isInt().withMessage('ID đơn hàng phải là số nguyên'),
    body('lydo').optional().isString().withMessage('Lý do hủy phải là chuỗi')
  ],
  donHangController.cancelDonHang
);
// MoMo callback URLs
router.get('/payment/momo/return', donHangController.momoReturnHandler);
router.post('/payment/momo/ipn', express.json(), donHangController.momoIPNHandler);
router.post('/payment/momo/refund', donHangController.momoRefundHandler);
// VNPay callback URLs
router.get('/payment/vnpay/return', donHangController.vnpayReturnHandler);
router.post(
  '/payment/vnpay/ipn',
  express.json(),
  donHangController.vnpayIPNHandler
);

// Repayment route
router.post(
  '/:id/repayment',
  authenticate,
  [
    param('id').notEmpty().withMessage('ID đơn hàng không được để trống'),
    body('phuongthuc')
      .isIn(['momo', 'vnpay'])
      .withMessage('Phương thức thanh toán không hợp lệ'),
  ],
  donHangController.repaymentDonHang
);

module.exports = router;
