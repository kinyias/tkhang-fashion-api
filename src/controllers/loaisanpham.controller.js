const { validationResult } = require('express-validator');
const loaiSanPhamService = require('../services/loaisanpham.service');

// Get all product types with pagination
async function getAllLoaiSanPham(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      madanhmuc,
      sortBy = 'ma',
      sortOrder = 'asc'
    } = req.query;
    
    const result = await loaiSanPhamService.getAllLoaiSanPham(
      page, 
      limit, 
      search, 
      madanhmuc,
      sortBy,
      sortOrder
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get product type by ID
async function getLoaiSanPhamById(req, res, next) {
  try {
    const { id } = req.params;
    const loaiSanPham = await loaiSanPhamService.getLoaiSanPhamById(id);
    return res.status(200).json(loaiSanPham);
  } catch (error) {
    next(error);
  }
}

// Create new product type
async function createLoaiSanPham(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ten, mota, hinhanh, noibat, madanhmuc } = req.body;
    const loaiSanPham = await loaiSanPhamService.createLoaiSanPham({ 
      ten, 
      mota, 
      hinhanh, 
      noibat, 
      madanhmuc 
    });
    
    return res.status(201).json({
      message: 'Tạo loại sản phẩm thành công',
      loaiSanPham
    });
  } catch (error) {
    next(error);
  }
}

// Update product type
async function updateLoaiSanPham(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { ten, mota, hinhanh, noibat, madanhmuc } = req.body;
    
    const updatedLoaiSanPham = await loaiSanPhamService.updateLoaiSanPham(id, { 
      ten, 
      mota, 
      hinhanh, 
      noibat, 
      madanhmuc 
    });
    
    return res.status(200).json({
      message: 'Cập nhật loại sản phẩm thành công',
      loaiSanPham: updatedLoaiSanPham
    });
  } catch (error) {
    next(error);
  }
}

// Delete product type
async function deleteLoaiSanPham(req, res, next) {
  try {
    const { id } = req.params;
    const result = await loaiSanPhamService.deleteLoaiSanPham(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Delete multiple product types
async function deleteManyLoaiSanPham(req, res, next) {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp danh sách ID hợp lệ' 
      });
    }
    
    const result = await loaiSanPhamService.deleteManyLoaiSanPham(ids);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllLoaiSanPham,
  getLoaiSanPhamById,
  createLoaiSanPham,
  updateLoaiSanPham,
  deleteLoaiSanPham,
  deleteManyLoaiSanPham
};