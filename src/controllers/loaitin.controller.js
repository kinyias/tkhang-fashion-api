const { validationResult } = require('express-validator');
const loaiTinService = require('../services/loaitin.service');

// Get all news categories with pagination
async function getAllLoaiTin(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      trangthai,
      sortBy = 'ma',
      sortOrder = 'asc',
    } = req.query;

    const filters = {
      trangthai,
    };

    const result = await loaiTinService.getAllLoaiTin(
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

// Get news category by ID
async function getLoaiTinById(req, res, next) {
  try {
    const { id } = req.params;
    const loaiTin = await loaiTinService.getLoaiTinById(id);
    return res.status(200).json(loaiTin);
  } catch (error) {
    next(error);
  }
}

// Create new news category
async function createLoaiTin(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tenloaitin, trangthai } = req.body;

    const loaiTin = await loaiTinService.createLoaiTin({
      tenloaitin,
      trangthai,
    });

    return res.status(201).json({
      message: 'Tạo loại tin thành công',
      loaiTin,
    });
  } catch (error) {
    next(error);
  }
}

// Update news category
async function updateLoaiTin(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { tenloaitin, trangthai } = req.body;

    const updatedLoaiTin = await loaiTinService.updateLoaiTin(id, {
      tenloaitin,
      trangthai,
    });

    return res.status(200).json({
      message: 'Cập nhật loại tin thành công',
      loaiTin: updatedLoaiTin,
    });
  } catch (error) {
    next(error);
  }
}

// Delete news category
async function deleteLoaiTin(req, res, next) {
  try {
    const { id } = req.params;
    const result = await loaiTinService.deleteLoaiTin(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Delete multiple news categories
async function deleteManyLoaiTin(req, res, next) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp danh sách ID hợp lệ',
      });
    }

    const result = await loaiTinService.deleteManyLoaiTin(ids);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get news categories by status
async function getLoaiTinByTrangThai(req, res, next) {
  try {
    const { trangthai } = req.params;
    const result = await loaiTinService.getLoaiTinByTrangThai(trangthai);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllLoaiTin,
  getLoaiTinById,
  createLoaiTin,
  updateLoaiTin,
  deleteLoaiTin,
  deleteManyLoaiTin,
  getLoaiTinByTrangThai,
};
