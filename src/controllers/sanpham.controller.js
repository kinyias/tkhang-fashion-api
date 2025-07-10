const { validationResult, check } = require('express-validator');
const sanPhamService = require('../services/sanpham.service');
const ElasticsearchService = require('../services/elasticsearch.service');
const client = require('../config/elasticsearch');
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
      sortOrder = 'desc',
    } = req.query;

    const filters = {
      madanhmuc,
      maloaisanpham,
      mathuonghieu,
      noibat,
      trangthai,
    };

    const result = await sanPhamService.getAllSanPham(
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
      sanPham,
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
      sanPham: updatedSanPham,
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
        message: 'Vui lòng cung cấp danh sách ID hợp lệ',
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
      sortOrder = 'desc',
    } = req.query;

    const filters = {
      madanhmuc,
      maloaisanpham,
      mathuonghieu,
      noibat,
      trangthai,
    };

    const result = await sanPhamService.getAllSanPhamWithVariants(
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

// Get cart products with variants
async function getCartProducts(req, res, next) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        message: 'Invalid request body. Expected array of cart items.',
      });
    }

    const result = await sanPhamService.getCartProducts(items);
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
      sortOrder = 'desc',
    } = req.query;

    // Extract filter parameters
    const filters = {
      search,
      // Convert comma-separated values to arrays for multi-select filters
      madanhmuc: req.query.madanhmuc
        ? req.query.madanhmuc.split(',')
        : undefined,
      maloaisanpham: req.query.maloaisanpham
        ? req.query.maloaisanpham.split(',')
        : undefined,
      mathuonghieu: req.query.mathuonghieu
        ? req.query.mathuonghieu.split(',')
        : undefined,
      mamausac: req.query.mamausac ? req.query.mamausac.split(',') : undefined,
      makichco: req.query.makichco ? req.query.makichco.split(',') : undefined,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      noibat: req.query.noibat,
      trangthai: req.query.trangthai,
    };

    const result = await sanPhamService.advancedSearchSanPham(
      page,
      limit,
      filters,
      sortBy,
      sortOrder
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
// Additional controller methods for Elasticsearch management
async function syncProductToES(req, res, next) {
  try {
    const { productId } = req.params;
    const success = await sanPhamService.syncProductToElasticsearch(
      Number(productId)
    );

    if (success) {
      return res.status(200).json({
        message: 'Product synced to Elasticsearch successfully',
      });
    } else {
      return res.status(404).json({
        message: 'Product not found',
      });
    }
  } catch (error) {
    next(error);
  }
}

async function syncAllProductsToES(req, res, next) {
  try {
    const success = await sanPhamService.syncAllProductsToElasticsearch();

    if (success) {
      return res.status(200).json({
        message: 'All products synced to Elasticsearch successfully',
      });
    } else {
      return res.status(500).json({
        message: 'Failed to sync products to Elasticsearch',
      });
    }
  } catch (error) {
    next(error);
  }
}

async function createIndexES(req, res, next) {
  try {
    await ElasticsearchService.createIndex();
    return res.status(200).json({
      message: 'Elasticsearch index created successfully',
    });
  } catch (error) {
    next(error);
  }
}
async function recreateIndexES(req, res, next) {
  try {
    await ElasticsearchService.recreateIndex();
    return res.status(200).json({
      message: 'Elasticsearch index recreated successfully',
    });
  } catch (error) {
    next(error);
  }
}
// Health check for Elasticsearch
async function checkElasticsearchHealth(req, res, next) {
  try {
    const health = await client.cluster.health();
    return res.status(200).json({
      status: 'healthy',
      cluster: health.body,
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
}

// Toggle product status or featured state
async function toggleProductField(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { field, value } = req.body;

    // Create update data object
    const updateData = {
      [field]: value,
    };

    const updatedProduct = await sanPhamService.updateSanPham(id, updateData);

    return res.status(200).json({
      message: 'Cập nhật sản phẩm thành công',
      sanPham: updatedProduct,
    });
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
  advancedSearchSanPham,
  syncProductToES,
  syncAllProductsToES,
  createIndexES,
  checkElasticsearchHealth,
  recreateIndexES,
  getCartProducts,
  toggleProductField,
};
