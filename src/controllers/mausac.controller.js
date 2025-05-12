const mauSacService = require('../services/mausac.service');

// Get all colors with pagination
async function getAllMauSac(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'ma',
      sortOrder = 'asc'
    } = req.query;
    
    const result = await mauSacService.getAllMauSac(
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

// Get color by ID
async function getMauSacById(req, res, next) {
  try {
    const { id } = req.params;
    const mauSac = await mauSacService.getMauSacById(id);
    return res.status(200).json(mauSac);
  } catch (error) {
    next(error);
  }
}

// Create new color
async function createMauSac(req, res, next) {
  try {
    const mauSac = await mauSacService.createMauSac(req.body);
    return res.status(201).json({ 
      message: 'Tạo màu sắc thành công',
      mauSac
    });
  } catch (error) {
    next(error);
  }
}

// Update color
async function updateMauSac(req, res, next) {
  try {
    const { id } = req.params;
    const mauSac = await mauSacService.updateMauSac(id, req.body);
    return res.status(200).json({ 
      message: 'Cập nhật màu sắc thành công',
      mauSac
    });
  } catch (error) {
    next(error);
  }
}

// Delete color
async function deleteMauSac(req, res, next) {
  try {
    const { id } = req.params;
    const result = await mauSacService.deleteMauSac(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Delete multiple colors
async function deleteManyMauSac(req, res, next) {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp danh sách ID hợp lệ' 
      });
    }
    
    const result = await mauSacService.deleteManyMauSac(ids);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllMauSac,
  getMauSacById,
  createMauSac,
  updateMauSac,
  deleteMauSac,
  deleteManyMauSac
};