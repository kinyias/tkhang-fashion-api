const { validationResult } = require('express-validator');
const diaChiService = require('../services/diachi.service');

// Get all addresses with pagination
async function getAllDiaChi(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      loaidiachi,
      macdinh,
      sortBy = 'ma',
      sortOrder = 'asc',
    } = req.query;
    const manguoidung = req.user.ma;
    const filters = {
      manguoidung,
      loaidiachi,
      macdinh,
    };

    const result = await diaChiService.getAllDiaChi(
      page,
      limit,
      search,
      filters,
      sortBy,
      sortOrder
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get address by ID
async function getDiaChiById(req, res, next) {
  try {
    const { id } = req.params;
    const diaChi = await diaChiService.getDiaChiById(id);
    return res.status(200).json(diaChi);
  } catch (error) {
    next(error);
  }
}

// Create new address
async function createDiaChi(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      tennguoinhan,
      email,
      sodienthoai,
      diachi,
      phuongxa,
      quanhuyen,
      tinhthanh,
      macdinh,
      loaidiachi,
    } = req.body;
    const manguoidung = req.user.ma; // Get user ID from authenticated request

    const newDiaChi = await diaChiService.createDiaChi({
      tennguoinhan,
      email,
      sodienthoai,
      diachi,
      phuongxa,
      quanhuyen,
      tinhthanh,
      macdinh,
      loaidiachi,
      manguoidung,
    });

    return res.status(201).json({
      message: 'Tạo địa chỉ thành công',
      diaChi: newDiaChi,
    });
  } catch (error) {
    next(error);
  }
}

// Update address
async function updateDiaChi(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      tennguoinhan,
      email,
      sodienthoai,
      diachi,
      phuongxa,
      quanhuyen,
      tinhthanh,
      macdinh,
      loaidiachi,
    } = req.body;

    const updatedDiaChi = await diaChiService.updateDiaChi(id, {
      tennguoinhan,
      email,
      sodienthoai,
      diachi,
      phuongxa,
      quanhuyen,
      tinhthanh,
      macdinh,
      loaidiachi,
    });

    return res.status(200).json({
      message: 'Cập nhật địa chỉ thành công',
      diaChi: updatedDiaChi,
    });
  } catch (error) {
    next(error);
  }
}

// Delete address
async function deleteDiaChi(req, res, next) {
  try {
    const { id } = req.params;
    const result = await diaChiService.deleteDiaChi(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Delete multiple addresses
async function deleteManyDiaChi(req, res, next) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp danh sách ID hợp lệ',
      });
    }

    const result = await diaChiService.deleteManyDiaChi(ids);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get addresses by user ID
async function getDiaChiByUserId(req, res, next) {
  try {
    const { userId } = req.params;
    const result = await diaChiService.getDiaChiByUserId(userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDiaChi,
  getDiaChiById,
  createDiaChi,
  updateDiaChi,
  deleteDiaChi,
  deleteManyDiaChi,
  getDiaChiByUserId,
};
