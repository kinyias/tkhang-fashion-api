const { validationResult } = require('express-validator');
const donHangService = require('../services/donhang.service');

// Get all orders with pagination and filtering
async function getAllDonHang(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '', ...filters } = req.query;
    const result = await donHangService.getAllDonHang(page, limit, search, filters);
    return res.status(200).json(result);
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
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const result = await donHangService.getDonHangByUserId(userId, page, limit);
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
    const orderData = {
      ...req.body,
      manguoidung
    };
    
    const donHang = await donHangService.createDonHang(orderData);
    
    return res.status(201).json({
      message: 'Tạo đơn hàng thành công',
      donHang
    });
  } catch (error) {
    next(error);
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
    
    const updatedDonHang = await donHangService.updateDonHangStatus(id, trangthai, ngaygiao);
    
    return res.status(200).json({
      message: 'Cập nhật trạng thái đơn hàng thành công',
      donHang: updatedDonHang
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
        return res.status(403).json({ message: 'Không có quyền hủy đơn hàng này' });
      }
    }
    
    const result = await donHangService.cancelDonHang(id);
    
    return res.status(200).json({
      message: 'Hủy đơn hàng thành công',
      donHang: result
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
    
    const updatedThanhToan = await donHangService.updateThanhToan(id, { phuongthuc, trangthai });
    
    return res.status(200).json({
      message: 'Cập nhật thông tin thanh toán thành công',
      thanhToan: updatedThanhToan
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
    
    const thanhToan = await donHangService.createThanhToan({ madh, phuongthuc, trangthai });
    
    return res.status(201).json({
      message: 'Tạo thông tin thanh toán thành công',
      thanhToan
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDonHang,
  getDonHangById,
  getDonHangByUserId,
  getMyDonHang,
  createDonHang,
  updateDonHangStatus,
  cancelDonHang,
  updateThanhToan,
  createThanhToan
};