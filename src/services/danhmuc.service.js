const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all categories with pagination
async function getAllDanhMuc(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  if (search) {
    where.ten = {
      contains: search,
      mode: 'insensitive'
    };
  }
  
  // Get categories with pagination
  const [danhMucs, totalCount] = await Promise.all([
    prisma.danhMuc.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        ma: 'asc'
      },
      include: {
        _count: {
          select: {
            sanPhams: true,
            loaiSanPhams: true
          }
        }
      }
    }),
    prisma.danhMuc.count({ where })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: danhMucs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Get category by ID
async function getDanhMucById(id) {
  const danhMuc = await prisma.danhMuc.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          sanPhams: true,
          loaiSanPhams: true
        }
      }
    }
  });
  
  if (!danhMuc) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }
  
  return danhMuc;
}

// Create new category
async function createDanhMuc(data) {
  const { ten, mota } = data;
  
  // Check if category with the same name exists
  const existingDanhMuc = await prisma.danhMuc.findFirst({
    where: { ten }
  });
  
  if (existingDanhMuc) {
    throw new ApiError(409, 'Danh mục với tên này đã tồn tại');
  }
  
  // Create new category
  const danhMuc = await prisma.danhMuc.create({
    data: {
      ten,
      mota
    }
  });
  
  return danhMuc;
}

// Update category
async function updateDanhMuc(id, data) {
  const { ten, mota } = data;
  
  // Check if category exists
  const existingDanhMuc = await prisma.danhMuc.findUnique({
    where: { ma: Number(id) }
  });
  
  if (!existingDanhMuc) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }
  
  // Check if another category with the same name exists
  if (ten && ten !== existingDanhMuc.ten) {
    const duplicateName = await prisma.danhMuc.findFirst({
      where: {
        ten,
        ma: { not: Number(id) }
      }
    });
    
    if (duplicateName) {
      throw new ApiError(409, 'Danh mục với tên này đã tồn tại');
    }
  }
  
  // Update category
  const updatedDanhMuc = await prisma.danhMuc.update({
    where: { ma: Number(id) },
    data: {
      ten,
      mota
    }
  });
  
  return updatedDanhMuc;
}

// Delete category
async function deleteDanhMuc(id) {
  // Check if category exists
  const existingDanhMuc = await prisma.danhMuc.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          sanPhams: true,
          loaiSanPhams: true
        }
      }
    }
  });
  
  if (!existingDanhMuc) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }
  
  // Check if category has related products or product types
  if (existingDanhMuc._count.sanPhams > 0 || existingDanhMuc._count.loaiSanPhams > 0) {
    throw new ApiError(400, 'Không thể xóa danh mục đang có sản phẩm hoặc loại sản phẩm liên kết');
  }
  
  // Delete category
  await prisma.danhMuc.delete({
    where: { ma: Number(id) }
  });
  
  return { message: 'Xóa danh mục thành công' };
}

module.exports = {
  getAllDanhMuc,
  getDanhMucById,
  createDanhMuc,
  updateDanhMuc,
  deleteDanhMuc
};