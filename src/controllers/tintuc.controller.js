const { validationResult } = require('express-validator');
const tinTucService = require('../services/tintuc.service');

// Get all news with pagination
async function getAllTinTuc(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      maloaitin,
      tinhot,
      trangthai,
      sortBy = 'ma',
      sortOrder = 'asc',
    } = req.query;

    const filters = {
      maloaitin,
      tinhot,
      trangthai,
    };

    const result = await tinTucService.getAllTinTuc(
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

    const { tieude, noidung, hinhdaidien, tinhot, trangthai, maloaitin } =
      req.body;
    const manguoidung = req.user.ma; // Get user ID from authenticated request

    const tinTuc = await tinTucService.createTinTuc({
      tieude,
      noidung,
      hinhdaidien,
      tinhot,
      trangthai,
      maloaitin,
      manguoidung,
    });

    return res.status(201).json({
      message: 'Tạo tin tức thành công',
      tinTuc,
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
    const { tieude, noidung, hinhdaidien, tinhot, trangthai, maloaitin } =
      req.body;

    const updatedTinTuc = await tinTucService.updateTinTuc(id, {
      tieude,
      noidung,
      hinhdaidien,
      tinhot,
      trangthai,
      maloaitin,
    });

    return res.status(200).json({
      message: 'Cập nhật tin tức thành công',
      tinTuc: updatedTinTuc,
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

// Delete multiple news
async function deleteManyTinTuc(req, res, next) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp danh sách ID hợp lệ',
      });
    }

    const result = await tinTucService.deleteManyTinTuc(ids);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get news by category ID
async function getTinTucByLoaiTinId(req, res, next) {
  try {
    const { loaiTinId } = req.params;

    const result = await tinTucService.getTinTucByLoaiTinId(loaiTinId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Get news by status
async function getTinTucByTrangThai(req, res, next) {
  try {
    const { trangthai } = req.params;
    const result = await tinTucService.getTinTucByTrangThai(trangthai);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
const increaseViewCount = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Validate ID
    const tinId = Number(id);
    if (isNaN(tinId)) {
      return res.status(400).json({ error: 'Mã không hợp lệ' });
    }
    const result = await tinTucService.increaseViewCount(tinId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRelatedTinTuc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const result = await tinTucService.getRelatedTinTuc(
      id,
      limit ? Number(limit) : undefined
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTinTuc,
  getTinTucById,
  createTinTuc,
  updateTinTuc,
  deleteTinTuc,
  deleteManyTinTuc,
  getTinTucByLoaiTinId,
  getTinTucByTrangThai,
  increaseViewCount,
  getRelatedTinTuc,
};
