const { validationResult } = require('express-validator');
const sanPhamService = require('../services/sanpham.service');

// Get all products with pagination
async function getAllSanPham(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      madanhmuc, 
      maloaisanpham, 
      mathuonghieu,
      noibat,
      trangthai
    } = req.query;
    
    const filters = {
      madanhmuc,
      maloaisanpham,
      mathuonghieu,
      noibat,
      trangthai
    };
    
    const result = await sanPhamService.getAllSanPham(page, limit, search, filters);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get product by ID
async function getSanPhamById(req, res, next) {
  try {
    const { id } = req.params;
    const sanPham = await sanPhamService.getSanPhamById(id);
    return res.status(200).json(sanPham);
  } catch (error) {
    next(error);
  }
}

// Create new product
async function createSanPham(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sanPham = await sanPhamService.createSanPham(req.body);
    
    return res.status(201).json({
      message: 'Tạo sản phẩm thành công',
      sanPham
    });
  } catch (error) {
    next(error);
  }
}

// Update product
async function updateSanPham(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updatedSanPham = await sanPhamService.updateSanPham(id, req.body);
    
    return res.status(200).json({
      message: 'Cập nhật sản phẩm thành công',
      sanPham: updatedSanPham
    });
  } catch (error) {
    next(error);
  }
}

// Delete product
async function deleteSanPham(req, res, next) {
  try {
    const { id } = req.params;
    const result = await sanPhamService.deleteSanPham(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSanPham,
  getSanPhamById,
  createSanPham,
  updateSanPham,
  deleteSanPham
};