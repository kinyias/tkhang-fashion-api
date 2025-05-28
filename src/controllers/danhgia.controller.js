const { validationResult } = require('express-validator');
const danhGiaService = require('../services/danhgia.service');

// Get all reviews with pagination
async function getAllDanhGia(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'ma',
      sortOrder = 'asc',
      masp,
    } = req.query;

    const result = await danhGiaService.getAllDanhGia(
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      masp
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get review by ID
async function getDanhGiaById(req, res, next) {
  try {
    const { id } = req.params;
    const danhGia = await danhGiaService.getDanhGiaById(id);
    return res.status(200).json(danhGia);
  } catch (error) {
    next(error);
  }
}

// Create new review
async function createDanhGia(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sosao, binhluan, hinhAnh, masp } = req.body;
    const manguoidung = req.user.ma; // Get user ID from authenticated user

    const danhGia = await danhGiaService.createDanhGia({
      sosao,
      binhluan,
      hinhAnh,
      masp,
      manguoidung,
    });

    return res.status(201).json({
      message: 'Tạo đánh giá thành công',
      danhGia,
    });
  } catch (error) {
    next(error);
  }
}

// Update review
async function updateDanhGia(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { sosao, binhluan, hinhAnh } = req.body;
    const manguoidung = req.user.ma; // Get user ID from authenticated user

    const updatedDanhGia = await danhGiaService.updateDanhGia(
      id,
      {
        sosao,
        binhluan,
        hinhAnh,
      },
      manguoidung
    );

    return res.status(200).json({
      message: 'Cập nhật đánh giá thành công',
      danhGia: updatedDanhGia,
    });
  } catch (error) {
    next(error);
  }
}

// Delete review
async function deleteDanhGia(req, res, next) {
  try {
    const { id } = req.params;
    const manguoidung = req.user.ma; // Get user ID from authenticated user
    const result = await danhGiaService.deleteDanhGia(id, manguoidung);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Delete multiple reviews (admin only)
async function deleteManyDanhGia(req, res, next) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp danh sách ID hợp lệ',
      });
    }

    const result = await danhGiaService.deleteManyDanhGia(ids);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDanhGia,
  getDanhGiaById,
  createDanhGia,
  updateDanhGia,
  deleteDanhGia,
  deleteManyDanhGia,
};
