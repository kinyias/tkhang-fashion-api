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
      trangthai,
      sortBy = 'ma',
      sortOrder = 'desc'
    } = req.query;
    
    const filters = {
      madanhmuc,
      maloaisanpham,
      mathuonghieu,
      noibat,
      trangthai
    };
    
    const result = await sanPhamService.getAllSanPham(page, limit, search, filters, sortBy, sortOrder);
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

// Delete multiple products
async function deleteManySanPham(req, res, next) {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp danh sách ID hợp lệ' 
      });
    }
    
    const result = await sanPhamService.deleteManySanPham(ids);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get all products with variants
async function getAllSanPhamWithVariants(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      madanhmuc, 
      maloaisanpham, 
      mathuonghieu,
      noibat,
      trangthai,
      sortBy = 'ma',
      sortOrder = 'desc'
    } = req.query;
    
    const filters = {
      madanhmuc,
      maloaisanpham,
      mathuonghieu,
      noibat,
      trangthai
    };
    
    const result = await sanPhamService.getAllSanPhamWithVariants(page, limit, search, filters, sortBy, sortOrder);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Advanced product search with comprehensive filtering
async function advancedSearchSanPham(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10,
      search = '',
      sortBy = 'ma',
      sortOrder = 'desc'
    } = req.query;
    
    // Extract filter parameters
    const filters = {
      search,
      // Convert comma-separated values to arrays for multi-select filters
      madanhmuc: req.query.madanhmuc ? req.query.madanhmuc.split(',') : undefined,
      maloaisanpham: req.query.maloaisanpham ? req.query.maloaisanpham.split(',') : undefined,
      mathuonghieu: req.query.mathuonghieu ? req.query.mathuonghieu.split(',') : undefined,
      mamausac: req.query.mamausac ? req.query.mamausac.split(',') : undefined,
      makichco: req.query.makichco ? req.query.makichco.split(',') : undefined,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      noibat: req.query.noibat,
      trangthai: req.query.trangthai
    };
    
    const result = await sanPhamService.advancedSearchSanPham(page, limit, filters, sortBy, sortOrder);
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
  deleteSanPham,
  deleteManySanPham,
  getAllSanPhamWithVariants,
  advancedSearchSanPham 
};