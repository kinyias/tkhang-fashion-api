const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all news with pagination
async function getAllTinTuc(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  if (search) {
    where.tieude = {
      contains: search,
      mode: 'insensitive'
    };
  }
  
  // Get news with pagination
  const [tinTucs, totalCount] = await Promise.all([
    prisma.tinTuc.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        ngaydang: 'desc'
      },
      include: {
        nguoiDung: {
          select: {
            ma: true,
            ho: true,
            ten: true,
            email: true
          }
        }
      }
    }),
    prisma.tinTuc.count({ where })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: tinTucs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Get news by ID
async function getTinTucById(id) {
  const tinTuc = await prisma.tinTuc.findUnique({
    where: { ma: Number(id) },
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true
        }
      }
    }
  });
  
  if (!tinTuc) {
    throw new ApiError(404, 'Không tìm thấy tin tức');
  }
  
  return tinTuc;
}

// Create new news
async function createTinTuc(data, userId) {
  const { tieude, noidung, hinhanh } = data;
  
  // Create new news
  const tinTuc = await prisma.tinTuc.create({
    data: {
      tieude,
      noidung,
      hinhanh,
      ngaydang: new Date(),
      manguoidung: userId
    },
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true
        }
      }
    }
  });
  
  return tinTuc;
}

// Update news
async function updateTinTuc(id, data) {
  const { tieude, noidung, hinhanh } = data;
  
  // Check if news exists
  const existingTinTuc = await prisma.tinTuc.findUnique({
    where: { ma: Number(id) }
  });
  
  if (!existingTinTuc) {
    throw new ApiError(404, 'Không tìm thấy tin tức');
  }
  
  // Update news
  const updatedTinTuc = await prisma.tinTuc.update({
    where: { ma: Number(id) },
    data: {
      tieude,
      noidung,
      hinhanh
    },
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true
        }
      }
    }
  });
  
  return updatedTinTuc;
}

// Delete news
async function deleteTinTuc(id) {
  // Check if news exists
  const existingTinTuc = await prisma.tinTuc.findUnique({
    where: { ma: Number(id) }
  });
  
  if (!existingTinTuc) {
    throw new ApiError(404, 'Không tìm thấy tin tức');
  }
  
  // Delete news
  await prisma.tinTuc.delete({
    where: { ma: Number(id) }
  });
  
  return { message: 'Xóa tin tức thành công' };
}

module.exports = {
  getAllTinTuc,
  getTinTucById,
  createTinTuc,
  updateTinTuc,
  deleteTinTuc
};