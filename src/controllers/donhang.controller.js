const { validationResult } = require('express-validator');
const donHangService = require('../services/donhang.service');
const { handleMoMoReturn, handleMoMoIPN } = require('../services/momo.service');
const emailService = require('../services/email.service');
// Get all orders with pagination and filtering
async function getAllDonHang(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '', ...filters } = req.query;
    const result = await donHangService.getAllDonHang(
      page,
      limit,
      search,
      filters
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get order with orderItems by ID
async function getDonHangWithChiTietById(req, res, next) {
  try {
    const { id } = req.params;
    const donHang = await donHangService.getDonHangWithChiTietById(id);
    return res.status(200).json(donHang);
  } catch (error) {
    next(error);
  }
}
// Get order by ID
async function getDonHangById(req, res, next) {
  try {
    const { id } = req.params;
    const donHang = await donHangService.getDonHangById(id);
    return res.status(200).json(donHang);
  } catch (error) {
    next(error);
  }
}

// Get orders by user ID
async function getDonHangByUserId(req, res, next) {
  try {
    const userId = req.user.ma;
    const { page = 1, limit = 10, trangthai } = req.query;
    const result = await donHangService.getDonHangByUserId(
      userId,
      page,
      limit,
      trangthai
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get current user's orders
async function getMyDonHang(req, res, next) {
  try {
    const userId = req.user.ma;
    const { page = 1, limit = 10 } = req.query;
    const result = await donHangService.getDonHangByUserId(userId, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Create new order
async function createDonHang(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If user is logged in, use their ID, otherwise use the one from the request
    const manguoidung = req.user ? req.user.ma : req.body.manguoidung;
    // Create order data
    // Add payment URLs to order data
    const orderData = {
      ...req.body,
      manguoidung,
      returnUrl: `${process.env.API_BASE_URL}/api/donhang/payment/momo/return`, // Dynamic return URL
      ipnUrl: `${process.env.API_BASE_URL}/api/donhang/payment/momo/ipn`, // Dynamic IPN URL
    };

    const donHang = await donHangService.createDonHang(orderData);
    await emailService.sendNewOrderNotificationToAdmin(donHang);
    // If MoMo payment, return payment URL
    if (req.body.paymentMethod === 'momo' && donHang.paymentUrl) {
      if (orderData.email && orderData.email !== '') {
        await emailService.sendNewOrderNotificationToUser(donHang);
      }
      return res.status(201).json({
        message: 'Tạo đơn hàng thành công. Vui lòng thanh toán qua MoMo',
        donHang,
        paymentUrl: donHang.paymentUrl,
        paymentMethod: 'momo',
      });
    }
    if (orderData.email && orderData.email !== '') {
      await emailService.sendNewOrderNotificationToUser(donHang);
    }
    return res.status(201).json({
      message: 'Tạo đơn hàng thành công',
      donHang,
    });
  } catch (error) {
    next(error);
  }
}
// MoMo Return URL Handler
async function momoReturnHandler(req, res, next) {
  try {
    const result = await handleMoMoReturn(req.query);

    // Redirect to frontend with payment status
    return res.redirect(
      `${process.env.CLIENT_BASE_URL}/thanh-toan/xac-nhan/${
        result.orderId
      }?payment_status=${result.success ? 'success' : 'failed'}`
    );
  } catch (error) {
    next(error);
  }
}

// MoMo IPN Handler
async function momoIPNHandler(req, res, next) {
  try {
    console.log('req.body', req.body);
    await handleMoMoIPN(req.body);
    // MoMo expects a 200 status code for successful IPN processing
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('IPN Error:', error);
    // Still return 200 to prevent MoMo from retrying
    return res.status(200).json({ success: false });
  }
}
// Update order status
async function updateDonHangStatus(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { trangthai, ngaygiao } = req.body;

    const updatedDonHang = await donHangService.updateDonHangStatus(
      id,
      trangthai,
      ngaygiao
    );

    return res.status(200).json({
      message: 'Cập nhật trạng thái đơn hàng thành công',
      donHang: updatedDonHang,
    });
  } catch (error) {
    next(error);
  }
}

// Cancel order
async function cancelDonHang(req, res, next) {
  try {
    const { id } = req.params;

    // Check if user is admin or the order belongs to the user
    if (req.user.vai_tro !== 'admin') {
      const donHang = await donHangService.getDonHangById(id);
      if (donHang.manguoidung !== req.user.ma) {
        return res
          .status(403)
          .json({ message: 'Không có quyền hủy đơn hàng này' });
      }
    }

    const result = await donHangService.cancelDonHang(id);

    return res.status(200).json({
      message: 'Hủy đơn hàng thành công',
      donHang: result,
    });
  } catch (error) {
    next(error);
  }
}

// Update payment status
async function updateThanhToan(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { phuongthuc, trangthai } = req.body;

    const updatedThanhToan = await donHangService.updateThanhToan(id, {
      phuongthuc,
      trangthai,
    });

    return res.status(200).json({
      message: 'Cập nhật thông tin thanh toán thành công',
      thanhToan: updatedThanhToan,
    });
  } catch (error) {
    next(error);
  }
}

// Create payment for an order
async function createThanhToan(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { madh, phuongthuc, trangthai } = req.body;

    const thanhToan = await donHangService.createThanhToan({
      madh,
      phuongthuc,
      trangthai,
    });

    return res.status(201).json({
      message: 'Tạo thông tin thanh toán thành công',
      thanhToan,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDonHang,
  getDonHangWithChiTietById,
  getDonHangByUserId,
  getDonHangById,
  getMyDonHang,
  createDonHang,
  updateDonHangStatus,
  cancelDonHang,
  updateThanhToan,
  createThanhToan,
  momoReturnHandler,
  momoIPNHandler,
};
