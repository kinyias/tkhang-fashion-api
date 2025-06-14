const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all news with pagination
async function getAllTinTuc(
  page = 1,
  limit = 10,
  search = '',
  filters = {},
  sortBy = 'ma',
  sortOrder = 'asc'
) {
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where = {};
  if (search) {
    where.tieude = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Apply additional filters
  if (filters.maloaitin) {
    where.maloaitin = Number(filters.maloaitin);
  }

  if (filters.tinhot !== undefined) {
    where.tinhot = filters.tinhot === 'true';
  }

  if (filters.trangthai !== undefined) {
    where.trangthai = filters.trangthai === 'true';
  }

  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'tieude', 'ngaydang', 'tinhot'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';

  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;

  // Get news with pagination
  const [tinTucs, totalCount] = await Promise.all([
    prisma.tinTuc.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        loaitin: {
          select: {
            ma: true,
            tenloaitin: true,
          },
        },
        nguoiDung: {
          select: {
            ma: true,
            ho: true,
            ten: true,
            email: true,
          },
        },
      },
    }),
    prisma.tinTuc.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: tinTucs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Get news by ID
async function getTinTucById(id) {
  const tinTuc = await prisma.tinTuc.findUnique({
    where: { ma: Number(id) },
    include: {
      loaitin: {
        select: {
          ma: true,
          tenloaitin: true,
        },
      },
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
        },
      },
    },
  });

  if (!tinTuc) {
    throw new ApiError(404, 'Không tìm thấy tin tức');
  }

  return tinTuc;
}

// Create new news
async function createTinTuc(data) {
  const {
    tieude,
    noidung,
    hinhdaidien,
    tinhot,
    trangthai,
    maloaitin,
    manguoidung,
  } = data;

  // Check if news category exists
  const loaiTin = await prisma.loaiTin.findUnique({
    where: { ma: Number(maloaitin) },
  });

  if (!loaiTin) {
    throw new ApiError(404, 'Không tìm thấy loại tin');
  }

  // Create new news
  const tinTuc = await prisma.tinTuc.create({
    data: {
      tieude,
      noidung,
      hinhdaidien,
      tinhot: Boolean(tinhot),
      trangthai: Boolean(trangthai),
      maloaitin: Number(maloaitin),
      manguoidung: Number(manguoidung),
    },
    include: {
      loaitin: {
        select: {
          ma: true,
          tenloaitin: true,
        },
      },
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
        },
      },
    },
  });

  return tinTuc;
}

// Update news
async function updateTinTuc(id, data) {
  const { tieude, noidung, hinhdaidien, tinhot, trangthai, maloaitin } = data;

  // Check if news exists
  const existingTinTuc = await prisma.tinTuc.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingTinTuc) {
    throw new ApiError(404, 'Không tìm thấy tin tức');
  }

  // If changing category, check if category exists
  if (maloaitin && maloaitin !== existingTinTuc.maloaitin) {
    const loaiTin = await prisma.loaiTin.findUnique({
      where: { ma: Number(maloaitin) },
    });

    if (!loaiTin) {
      throw new ApiError(404, 'Không tìm thấy loại tin');
    }
  }

  // Update news
  const updatedTinTuc = await prisma.tinTuc.update({
    where: { ma: Number(id) },
    data: {
      tieude,
      noidung,
      hinhdaidien,
      tinhot: tinhot !== undefined ? Boolean(tinhot) : undefined,
      trangthai: trangthai !== undefined ? Boolean(trangthai) : undefined,
      maloaitin: maloaitin ? Number(maloaitin) : undefined,
    },
    include: {
      loaitin: {
        select: {
          ma: true,
          tenloaitin: true,
        },
      },
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
        },
      },
    },
  });

  return updatedTinTuc;
}

// Delete news
async function deleteTinTuc(id) {
  // Check if news exists
  const existingTinTuc = await prisma.tinTuc.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingTinTuc) {
    throw new ApiError(404, 'Không tìm thấy tin tức');
  }

  // Delete news
  await prisma.tinTuc.delete({
    where: { ma: Number(id) },
  });

  return { message: 'Xóa tin tức thành công' };
}

// Delete multiple news
async function deleteManyTinTuc(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }

  // Convert all ids to numbers
  const tinTucIds = ids.map((id) => Number(id));

  // Check if all news exist
  const tinTuc = await prisma.tinTuc.findMany({
    where: {
      ma: {
        in: tinTucIds,
      },
    },
  });

  // Check if we found all requested news
  if (tinTuc.length !== tinTucIds.length) {
    const foundIds = tinTuc.map((tt) => tt.ma);
    const missingIds = tinTucIds.filter((id) => !foundIds.includes(id));
    throw new ApiError(
      404,
      `Không tìm thấy tin tức với ID: ${missingIds.join(', ')}`
    );
  }

  // Delete news
  await prisma.tinTuc.deleteMany({
    where: {
      ma: {
        in: tinTucIds,
      },
    },
  });

  return {
    message: `Đã xóa ${tinTucIds.length} tin tức thành công`,
    deletedIds: tinTucIds,
  };
}

// Get news by category ID
async function getTinTucByLoaiTinId(loaiTinId) {
  // Build filter conditions
  const where = {
    maloaitin: Number(loaiTinId),
  };

  // Get news
  const tinTucs = await prisma.tinTuc.findMany({
    where,
    orderBy: {
      ngaydang: 'desc',
    },
    include: {
      loaitin: {
        select: {
          ma: true,
          tenloaitin: true,
        },
      },
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
        },
      },
    },
  });

  return {
    data: tinTucs,
  };
}

// Get news by status
async function getTinTucByTrangThai(trangthai) {
  const where = {
    trangthai: trangthai === 'true',
  };

  const tinTucs = await prisma.tinTuc.findMany({
    where,
    orderBy: {
      ngaydang: 'desc',
    },
    include: {
      loaitin: {
        select: {
          ma: true,
          tenloaitin: true,
        },
      },
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
        },
      },
    },
  });

  return {
    data: tinTucs,
  };
}

async function increaseViewCount(tinId) {

  // Update view count atomically
  const updatedTin = await prisma.tinTuc.update({
    where: { ma: tinId },
    data: {
      solanxem: {
        increment: 1,
      },
    },
    select: {
      ma: true,
      tieude: true,
      solanxem: true,
    },
  });

  if (!updatedTin) {
    throw new ApiError(404, 'Không tìm thấy tin tức');
  }

  return {data: updatedTin};
}
module.exports = {
  getAllTinTuc,
  getTinTucById,
  createTinTuc,
  updateTinTuc,
  deleteTinTuc,
  deleteManyTinTuc,
  getTinTucByLoaiTinId,
  getTinTucByTrangThai,
  increaseViewCount
};
