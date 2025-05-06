const { validationResult } = require('express-validator');
const danhMucService = require('../services/danhmuc.service');

// Get all categories with pagination
async function getAllDanhMuc(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await danhMucService.getAllDanhMuc(page, limit, search);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get category by ID
async function getDanhMucById(req, res, next) {
  try {
    const { id } = req.params;
    const danhMuc = await danhMucService.getDanhMucById(id);
    return res.status(200).json(danhMuc);
  } catch (error) {
    next(error);
  }
}

// Create new category
async function createDanhMuc(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ten, mota } = req.body;
    const danhMuc = await danhMucService.createDanhMuc({ ten, mota });
    
    return res.status(201).json({
      message: 'Tạo danh mục thành công',
      danhMuc
    });
  } catch (error) {
    next(error);
  }
}

// Update category
async function updateDanhMuc(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { ten, mota } = req.body;
    
    const updatedDanhMuc = await danhMucService.updateDanhMuc(id, { ten, mota });
    
    return res.status(200).json({
      message: 'Cập nhật danh mục thành công',
      danhMuc: updatedDanhMuc
    });
  } catch (error) {
    next(error);
  }
}

// Delete category
async function deleteDanhMuc(req, res, next) {
  try {
    const { id } = req.params;
    const result = await danhMucService.deleteDanhMuc(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDanhMuc,
  getDanhMucById,
  createDanhMuc,
  updateDanhMuc,
  deleteDanhMuc
};