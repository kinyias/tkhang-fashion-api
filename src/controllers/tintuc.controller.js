const { validationResult } = require('express-validator');
const tinTucService = require('../services/tintuc.service');

// Get all news with pagination
async function getAllTinTuc(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await tinTucService.getAllTinTuc(page, limit, search);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get news by ID
async function getTinTucById(req, res, next) {
  try {
    const { id } = req.params;
    const tinTuc = await tinTucService.getTinTucById(id);
    return res.status(200).json(tinTuc);
  } catch (error) {
    next(error);
  }
}

// Create new news
async function createTinTuc(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tieude, noidung, hinhanh } = req.body;
    const userId = req.user.ma; // Get user ID from authenticated user
    
    const tinTuc = await tinTucService.createTinTuc({ tieude, noidung, hinhanh }, userId);
    
    return res.status(201).json({
      message: 'Tạo tin tức thành công',
      tinTuc
    });
  } catch (error) {
    next(error);
  }
}

// Update news
async function updateTinTuc(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { tieude, noidung, hinhanh } = req.body;
    
    const updatedTinTuc = await tinTucService.updateTinTuc(id, { tieude, noidung, hinhanh });
    
    return res.status(200).json({
      message: 'Cập nhật tin tức thành công',
      tinTuc: updatedTinTuc
    });
  } catch (error) {
    next(error);
  }
}

// Delete news
async function deleteTinTuc(req, res, next) {
  try {
    const { id } = req.params;
    const result = await tinTucService.deleteTinTuc(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTinTuc,
  getTinTucById,
  createTinTuc,
  updateTinTuc,
  deleteTinTuc
};