const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all brands with pagination
async function getAllThuongHieu(page = 1, limit = 10, search = '', sortBy = 'ma', sortOrder = 'asc') {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  if (search) {
    where.ten = {
      contains: search,
      mode: 'insensitive'
    };
  }
  
  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'ten', 'mota'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';
  
  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;
  
  // Get brands with pagination
  const [thuongHieus, totalCount] = await Promise.all([
    prisma.thuongHieu.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        _count: {
          select: {
            sanPhams: true
          }
        }
      }
    }),
    prisma.thuongHieu.count({ where })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: thuongHieus,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Get brand by ID
async function getThuongHieuById(id) {
  const thuongHieu = await prisma.thuongHieu.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          sanPhams: true
        }
      }
    }
  });
  
  if (!thuongHieu) {
    throw new ApiError(404, 'Không tìm thấy thương hiệu');
  }
  
  return thuongHieu;
}

// Create new brand
async function createThuongHieu(data) {
  const { ten, mota } = data;
  
  // Check if brand with the same name exists
  const existingThuongHieu = await prisma.thuongHieu.findFirst({
    where: { ten }
  });
  
  if (existingThuongHieu) {
    throw new ApiError(409, 'Thương hiệu với tên này đã tồn tại');
  }
  
  // Create new brand
  const thuongHieu = await prisma.thuongHieu.create({
    data: {
      ten,
      mota
    }
  });
  
  return thuongHieu;
}

// Update brand
async function updateThuongHieu(id, data) {
  const { ten, mota } = data;
  
  // Check if brand exists
  const existingThuongHieu = await prisma.thuongHieu.findUnique({
    where: { ma: Number(id) }
  });
  
  if (!existingThuongHieu) {
    throw new ApiError(404, 'Không tìm thấy thương hiệu');
  }
  
  // Check if another brand with the same name exists
  if (ten && ten !== existingThuongHieu.ten) {
    const duplicateName = await prisma.thuongHieu.findFirst({
      where: {
        ten,
        ma: { not: Number(id) }
      }
    });
    
    if (duplicateName) {
      throw new ApiError(409, 'Thương hiệu với tên này đã tồn tại');
    }
  }
  
  // Update brand
  const updatedThuongHieu = await prisma.thuongHieu.update({
    where: { ma: Number(id) },
    data: {
      ten,
      mota
    }
  });
  
  return updatedThuongHieu;
}

// Delete brand
async function deleteThuongHieu(id) {
  // Check if brand exists
  const existingThuongHieu = await prisma.thuongHieu.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          sanPhams: true
        }
      }
    }
  });
  
  if (!existingThuongHieu) {
    throw new ApiError(404, 'Không tìm thấy thương hiệu');
  }
  
  // Check if brand has related products
  if (existingThuongHieu._count.sanPhams > 0) {
    throw new ApiError(400, 'Không thể xóa thương hiệu đang có sản phẩm liên kết');
  }
  
  // Delete brand
  await prisma.thuongHieu.delete({
    where: { ma: Number(id) }
  });
  
  return { message: 'Xóa thương hiệu thành công' };
}

// Delete multiple brands
async function deleteManyThuongHieu(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }
  // Convert all ids to numbers
  const brandIds = ids.map(id => Number(id));
  
  // Check if all brands exist and can be deleted
  const brands = await prisma.thuongHieu.findMany({
    where: {
      ma: {
        in: brandIds
      }
    },
    include: {
      _count: {
        select: {
          sanPhams: true
        }
      }
    }
  });
  
  // Check if all requested brands were found
  if (brands.length !== brandIds.length) {
    throw new ApiError(404, 'Một hoặc nhiều thương hiệu không tồn tại');
  }
  
  // Check if any brand has related products
  const nonDeletableBrands = brands.filter(
    brand => brand._count.sanPhams > 0
  );
  
  if (nonDeletableBrands.length > 0) {
    const brandNames = nonDeletableBrands.map(brand => brand.ten).join(', ');
    throw new ApiError(
      400, 
      `Không thể xóa các thương hiệu đang có sản phẩm liên kết: ${brandNames}`
    );
  }
  
  // Delete all brands
  await prisma.thuongHieu.deleteMany({
    where: {
      ma: {
        in: brandIds
      }
    }
  });
  
  return { 
    message: `Đã xóa ${brandIds.length} thương hiệu thành công`,
    deletedCount: brandIds.length
  };
}

module.exports = {
  getAllThuongHieu,
  getThuongHieuById,
  createThuongHieu,
  updateThuongHieu,
  deleteThuongHieu,
  deleteManyThuongHieu
};