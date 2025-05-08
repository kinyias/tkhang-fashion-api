const { validationResult } = require('express-validator');
const mauSacService = require('../services/mausac.service');

// Get all colors with pagination
async function getAllMauSac(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await mauSacService.getAllMauSac(page, limit, search);
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
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ten, ma_mau } = req.body;
    const mauSac = await mauSacService.createMauSac({ ten, ma_mau });
    
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
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { ten, ma_mau } = req.body;
    
    const updatedMauSac = await mauSacService.updateMauSac(id, { ten, ma_mau });
    
    return res.status(200).json({
      message: 'Cập nhật màu sắc thành công',
      mauSac: updatedMauSac
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

module.exports = {
  getAllMauSac,
  getMauSacById,
  createMauSac,
  updateMauSac,
  deleteMauSac
};