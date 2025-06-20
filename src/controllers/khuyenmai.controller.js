const { validationResult } = require('express-validator');
const khuyenMaiService = require('../services/khuyenmai.service');

// Get all promotions with pagination
async function getAllKhuyenMai(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      loaikhuyenmai, 
      active,
      sortBy = 'ma',
      sortOrder = 'desc'
    } = req.query;
    
    const filters = { loaikhuyenmai, active };
    const result = await khuyenMaiService.getAllKhuyenMai(
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

// Get promotion by ID
async function getKhuyenMaiById(req, res, next) {
  try {
    const { id } = req.params;
    const khuyenMai = await khuyenMaiService.getKhuyenMaiById(id);
    return res.status(200).json(khuyenMai);
  } catch (error) {
    next(error);
  }
}

// Create new promotion
async function createKhuyenMai(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ten, loaikhuyenmai, giatrigiam, giamtoida, giatridonhang, ngaybatdat, ngayketthuc } = req.body;
    const khuyenMai = await khuyenMaiService.createKhuyenMai({ 
      ten, 
      loaikhuyenmai, 
      giatrigiam, 
      giamtoida,
      giatridonhang, 
      ngaybatdat, 
      ngayketthuc 
    });
    
    return res.status(201).json({
      message: 'Tạo khuyến mãi thành công',
      khuyenMai
    });
  } catch (error) {
    next(error);
  }
}

// Update promotion
async function updateKhuyenMai(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { ten, loaikhuyenmai, giatrigiam, giatridonhang, giamtoida, ngaybatdat, ngayketthuc } = req.body;
    
    const updatedKhuyenMai = await khuyenMaiService.updateKhuyenMai(id, { 
      ten, 
      loaikhuyenmai, 
      giatrigiam, 
      giatridonhang, 
      giamtoida,
      ngaybatdat, 
      ngayketthuc 
    });
    
    return res.status(200).json({
      message: 'Cập nhật khuyến mãi thành công',
      khuyenMai: updatedKhuyenMai
    });
  } catch (error) {
    next(error);
  }
}

// Delete promotion
async function deleteKhuyenMai(req, res, next) {
  try {
    const { id } = req.params;
    const result = await khuyenMaiService.deleteKhuyenMai(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllKhuyenMai,
  getKhuyenMaiById,
  createKhuyenMai,
  updateKhuyenMai,
  deleteKhuyenMai
};