const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all product types with pagination
async function getAllLoaiSanPham(page = 1, limit = 10, search = '', filters = {}, sortBy = 'ma', sortOrder = 'asc') {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  if (search) {
    where.ten = {
      contains: search,
      mode: 'insensitive'
    };
  }
  
  // Apply additional filters
  if (filters.madanhmuc) {
    where.madanhmuc = Number(filters.madanhmuc);
  }
  
  if (filters.noibat !== undefined) {
    where.noibat = filters.noibat === 'true';
  }
  
  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'ten', 'mota', 'noibat'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';
  
  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;
  
  // Get product types with pagination
  const [loaiSanPhams, totalCount] = await Promise.all([
    prisma.loaiSanPham.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        danhMuc: {
          select: {
            ma: true,
            ten: true
          }
        },
        _count: {
          select: {
            sanPhams: true
          }
        }
      }
    }),
    prisma.loaiSanPham.count({ where })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: loaiSanPhams,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Get product type by ID
async function getLoaiSanPhamById(id) {
  const loaiSanPham = await prisma.loaiSanPham.findUnique({
    where: { ma: Number(id) },
    include: {
      danhMuc: {
        select: {
          ma: true,
          ten: true
        }
      },
      _count: {
        select: {
          sanPhams: true
        }
      }
    }
  });
  
  if (!loaiSanPham) {
    throw new ApiError(404, 'Không tìm thấy loại sản phẩm');
  }
  
  return loaiSanPham;
}

// Create new product type
async function createLoaiSanPham(data) {
  const { ten, mota, hinhanh, noibat, madanhmuc } = data;
  
  // Check if category exists
  const danhMuc = await prisma.danhMuc.findUnique({
    where: { ma: Number(madanhmuc) }
  });
  
  if (!danhMuc) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }
  
  // Check if product type with the same name exists in the same category
  const existingLoaiSanPham = await prisma.loaiSanPham.findFirst({
    where: { 
      ten,
      madanhmuc: Number(madanhmuc)
    }
  });
  
  if (existingLoaiSanPham) {
    throw new ApiError(409, 'Loại sản phẩm với tên này đã tồn tại trong danh mục này');
  }
  
  // Create new product type
  const loaiSanPham = await prisma.loaiSanPham.create({
    data: {
      ten,
      mota,
      hinhanh,
      noibat: Boolean(noibat),
      madanhmuc: Number(madanhmuc)
    },
    include: {
      danhMuc: {
        select: {
          ma: true,
          ten: true
        }
      }
    }
  });
  
  return loaiSanPham;
}

// Update product type
async function updateLoaiSanPham(id, data) {
  const { ten, mota, hinhanh, noibat, madanhmuc } = data;
  
  // Check if product type exists
  const existingLoaiSanPham = await prisma.loaiSanPham.findUnique({
    where: { ma: Number(id) }
  });
  
  if (!existingLoaiSanPham) {
    throw new ApiError(404, 'Không tìm thấy loại sản phẩm');
  }
  
  // If changing category, check if category exists
  if (madanhmuc && madanhmuc !== existingLoaiSanPham.madanhmuc) {
    const danhMuc = await prisma.danhMuc.findUnique({
      where: { ma: Number(madanhmuc) }
    });
    
    if (!danhMuc) {
      throw new ApiError(404, 'Không tìm thấy danh mục');
    }
  }
  
  // Check if another product type with the same name exists in the same category
  if (ten && ten !== existingLoaiSanPham.ten) {
    const duplicateName = await prisma.loaiSanPham.findFirst({
      where: {
        ten,
        madanhmuc: madanhmuc ? Number(madanhmuc) : existingLoaiSanPham.madanhmuc,
        ma: { not: Number(id) }
      }
    });
    
    if (duplicateName) {
      throw new ApiError(409, 'Loại sản phẩm với tên này đã tồn tại trong danh mục này');
    }
  }
  
  // Update product type
  const updatedLoaiSanPham = await prisma.loaiSanPham.update({
    where: { ma: Number(id) },
    data: {
      ten,
      mota,
      hinhanh,
      noibat: noibat !== undefined ? Boolean(noibat) : undefined,
      madanhmuc: madanhmuc ? Number(madanhmuc) : undefined
    },
    include: {
      danhMuc: {
        select: {
          ma: true,
          ten: true
        }
      }
    }
  });
  
  return updatedLoaiSanPham;
}

// Delete product type
async function deleteLoaiSanPham(id) {
  // Check if product type exists
  const existingLoaiSanPham = await prisma.loaiSanPham.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          sanPhams: true
        }
      }
    }
  });
  
  if (!existingLoaiSanPham) {
    throw new ApiError(404, 'Không tìm thấy loại sản phẩm');
  }
  
  // Check if product type has related products
  if (existingLoaiSanPham._count.sanPhams > 0) {
    throw new ApiError(400, 'Không thể xóa loại sản phẩm đang có sản phẩm liên kết');
  }
  
  // Delete product type
  await prisma.loaiSanPham.delete({
    where: { ma: Number(id) }
  });
  
  return { message: 'Xóa loại sản phẩm thành công' };
}

// Delete multiple product types
async function deleteManyLoaiSanPham(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }
  
  // Convert all ids to numbers
  const loaiSanPhamIds = ids.map(id => Number(id));
  
  // Check if all product types exist
  const loaiSanPham = await prisma.loaiSanPham.findMany({
    where: {
      ma: {
        in: loaiSanPhamIds
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
  
  // Check if we found all requested product types
  if (loaiSanPham.length !== loaiSanPhamIds.length) {
    const foundIds = loaiSanPham.map(pt => pt.ma);
    const missingIds = loaiSanPhamIds.filter(id => !foundIds.includes(id));
    throw new ApiError(404, `Không tìm thấy loại sản phẩm với ID: ${missingIds.join(', ')}`);
  }
  
  // Check if any product type has related products
  const withProducts = loaiSanPham.filter(pt => pt._count.sanPhams > 0);
  if (withProducts.length > 0) {
    const typeNames = withProducts.map(pt => pt.ten).join(', ');
    throw new ApiError(400, `Không thể xóa loại sản phẩm đang có sản phẩm liên kết: ${typeNames}`);
  }
  
  // Delete product types
  await prisma.loaiSanPham.deleteMany({
    where: {
      ma: {
        in: loaiSanPhamIds
      }
    }
  });
  
  return { 
    message: `Đã xóa ${loaiSanPhamIds.length} loại sản phẩm thành công`,
    deletedIds: loaiSanPhamIds
  };
}

module.exports = {
  getAllLoaiSanPham,
  getLoaiSanPhamById,
  createLoaiSanPham,
  updateLoaiSanPham,
  deleteLoaiSanPham,
  deleteManyLoaiSanPham
};