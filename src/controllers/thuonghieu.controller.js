const { validationResult } = require('express-validator');
const thuongHieuService = require('../services/thuonghieu.service');

// Get all brands with pagination
async function getAllThuongHieu(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'ma',
      sortOrder = 'asc'
    } = req.query;
    
    const result = await thuongHieuService.getAllThuongHieu(
      page, 
      limit, 
      search,
      sortBy,
      sortOrder
    );
    
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get brand by ID
async function getThuongHieuById(req, res, next) {
  try {
    const { id } = req.params;
    const thuongHieu = await thuongHieuService.getThuongHieuById(id);
    return res.status(200).json(thuongHieu);
  } catch (error) {
    next(error);
  }
}

// Create new brand
async function createThuongHieu(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ten, mota } = req.body;
    const thuongHieu = await thuongHieuService.createThuongHieu({ ten, mota });
    
    return res.status(201).json({
      message: 'Tạo thương hiệu thành công',
      thuongHieu
    });
  } catch (error) {
    next(error);
  }
}

// Update brand
async function updateThuongHieu(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { ten, mota } = req.body;
    
    const updatedThuongHieu = await thuongHieuService.updateThuongHieu(id, { ten, mota });
    
    return res.status(200).json({
      message: 'Cập nhật thương hiệu thành công',
      thuongHieu: updatedThuongHieu
    });
  } catch (error) {
    next(error);
  }
}

// Delete brand
async function deleteThuongHieu(req, res, next) {
  try {
    const { id } = req.params;
    const result = await thuongHieuService.deleteThuongHieu(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Delete multiple brands
async function deleteManyThuongHieu(req, res, next) {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp danh sách ID hợp lệ' 
      });
    }
    
    const result = await thuongHieuService.deleteManyThuongHieu(ids);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllThuongHieu,
  getThuongHieuById,
  createThuongHieu,
  updateThuongHieu,
  deleteThuongHieu,
  deleteManyThuongHieu
};