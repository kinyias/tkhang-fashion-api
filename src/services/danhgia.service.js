const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all reviews with pagination
async function getAllDanhGia(
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'ma',
  sortOrder = 'asc',
  masp = null
) {
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where = {};
  if (search) {
    where.binhluan = {
      contains: search,
      mode: 'insensitive',
    };
  }
  if (masp) {
    where.masp = Number(masp);
  }

  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'sosao', 'ngaydang'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';

  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;

  // Get reviews with pagination
  const [danhGias, totalCount] = await Promise.all([
    prisma.danhGia.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        nguoiDung: {
          select: {
            ma: true,
            ho: true,
            ten: true,
            email: true,
          },
        },
        sanPham: {
          select: {
            ma: true,
            ten: true,
          },
        },
      },
    }),
    prisma.danhGia.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: danhGias,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Get all reviews for admin with filters
async function getAdminDanhGia(
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'ma',
  sortOrder = 'asc',
  rating = undefined
) {
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where = {};

  // Search in both product name and review comment
  if (search) {
    where.OR = [
      {
        binhluan: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        sanPham: {
          ten: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  // Filter by rating if provided
  if (rating !== undefined) {
    where.sosao = rating;
  }

  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'sosao', 'ngaydang'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';

  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;

  // Get reviews with pagination
  const [danhGias, totalCount] = await Promise.all([
    prisma.danhGia.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        nguoiDung: {
          select: {
            ma: true,
            ho: true,
            ten: true,
            email: true,
          },
        },
        sanPham: {
          select: {
            ma: true,
            ten: true,
          },
        },
      },
    }),
    prisma.danhGia.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: danhGias,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Get review by ID
async function getDanhGiaById(id) {
  const danhGia = await prisma.danhGia.findUnique({
    where: { ma: Number(id) },
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
        },
      },
      sanPham: {
        select: {
          ma: true,
          ten: true,
        },
      },
    },
  });

  if (!danhGia) {
    throw new ApiError(404, 'Không tìm thấy đánh giá');
  }

  return danhGia;
}

// Create new review
async function createDanhGia(data) {
  const { sosao, binhluan, hinhAnh, masp, manguoidung } = data;

  // Validate rating
  if (sosao < 1 || sosao > 5) {
    throw new ApiError(400, 'Số sao phải từ 1 đến 5');
  }

  // Check if product exists
  const product = await prisma.sanPham.findUnique({
    where: { ma: Number(masp) },
  });

  if (!product) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm');
  }

  // Create new review
  const danhGia = await prisma.danhGia.create({
    data: {
      sosao,
      binhluan,
      hinhAnh,
      masp: Number(masp),
      manguoidung: Number(manguoidung),
    },
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
        },
      },
      sanPham: {
        select: {
          ma: true,
          ten: true,
        },
      },
    },
  });

  return danhGia;
}

// Update review
async function updateDanhGia(id, data, manguoidung) {
  const { sosao, binhluan, hinhAnh } = data;

  // Check if review exists and belongs to the user
  const existingDanhGia = await prisma.danhGia.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingDanhGia) {
    throw new ApiError(404, 'Không tìm thấy đánh giá');
  }

  if (existingDanhGia.manguoidung !== manguoidung) {
    throw new ApiError(403, 'Bạn không có quyền cập nhật đánh giá này');
  }

  // Validate rating if provided
  if (sosao !== undefined && (sosao < 1 || sosao > 5)) {
    throw new ApiError(400, 'Số sao phải từ 1 đến 5');
  }

  // Update review
  const updatedDanhGia = await prisma.danhGia.update({
    where: { ma: Number(id) },
    data: {
      sosao,
      binhluan,
      hinhAnh,
    },
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
        },
      },
      sanPham: {
        select: {
          ma: true,
          ten: true,
        },
      },
    },
  });

  return updatedDanhGia;
}

// Delete review
async function deleteDanhGia(id, manguoidung) {
  // Check if review exists and belongs to the user
  const existingDanhGia = await prisma.danhGia.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingDanhGia) {
    throw new ApiError(404, 'Không tìm thấy đánh giá');
  }

  if (existingDanhGia.manguoidung !== manguoidung) {
    throw new ApiError(403, 'Bạn không có quyền xóa đánh giá này');
  }

  // Delete review
  await prisma.danhGia.delete({
    where: { ma: Number(id) },
  });

  return { message: 'Xóa đánh giá thành công' };
}

// Delete multiple reviews (admin only)
async function deleteManyDanhGia(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }

  // Convert all ids to numbers
  const reviewIds = ids.map((id) => Number(id));

  // Check if all reviews exist
  const reviews = await prisma.danhGia.findMany({
    where: {
      ma: {
        in: reviewIds,
      },
    },
  });

  if (reviews.length !== reviewIds.length) {
    throw new ApiError(404, 'Một hoặc nhiều đánh giá không tồn tại');
  }

  // Delete all reviews
  await prisma.danhGia.deleteMany({
    where: {
      ma: {
        in: reviewIds,
      },
    },
  });

  return {
    message: `Đã xóa ${reviewIds.length} đánh giá thành công`,
    deletedCount: reviewIds.length,
  };
}

module.exports = {
  getAllDanhGia,
  getAdminDanhGia,
  getDanhGiaById,
  createDanhGia,
  updateDanhGia,
  deleteDanhGia,
  deleteManyDanhGia,
};
