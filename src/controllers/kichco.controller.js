const { validationResult } = require('express-validator');
const kichCoService = require('../services/kichco.service');

// Get all sizes with pagination
async function getAllKichCo(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await kichCoService.getAllKichCo(page, limit, search);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get size by ID
async function getKichCoById(req, res, next) {
  try {
    const { id } = req.params;
    const kichCo = await kichCoService.getKichCoById(id);
    return res.status(200).json(kichCo);
  } catch (error) {
    next(error);
  }
}

// Create new size
async function createKichCo(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ten } = req.body;
    const kichCo = await kichCoService.createKichCo({ ten });
    
    return res.status(201).json({
      message: 'Tạo kích cỡ thành công',
      kichCo
    });
  } catch (error) {
    next(error);
  }
}

// Update size
async function updateKichCo(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { ten } = req.body;
    
    const updatedKichCo = await kichCoService.updateKichCo(id, { ten });
    
    return res.status(200).json({
      message: 'Cập nhật kích cỡ thành công',
      kichCo: updatedKichCo
    });
  } catch (error) {
    next(error);
  }
}

// Delete size
async function deleteKichCo(req, res, next) {
  try {
    const { id } = req.params;
    const result = await kichCoService.deleteKichCo(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllKichCo,
  getKichCoById,
  createKichCo,
  updateKichCo,
  deleteKichCo
};