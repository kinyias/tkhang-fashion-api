const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all news categories with pagination
async function getAllLoaiTin(
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
    where.tenloaitin = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Apply additional filters
  if (filters.trangthai !== undefined) {
    where.trangthai = filters.trangthai === 'true';
  }

  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'tenloaitin', 'trangthai'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';

  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;

  // Get news categories with pagination
  const [loaiTins, totalCount] = await Promise.all([
    prisma.loaiTin.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        _count: {
          select: {
            tin: true,
          },
        },
      },
    }),
    prisma.loaiTin.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: loaiTins,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Get news category by ID
async function getLoaiTinById(id) {
  const loaiTin = await prisma.loaiTin.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          tin: true,
        },
      },
    },
  });

  if (!loaiTin) {
    throw new ApiError(404, 'Không tìm thấy loại tin');
  }

  return loaiTin;
}

// Create new news category
async function createLoaiTin(data) {
  const { tenloaitin, trangthai } = data;

  // Check if news category with the same name exists
  const existingLoaiTin = await prisma.loaiTin.findFirst({
    where: {
      tenloaitin,
    },
  });

  if (existingLoaiTin) {
    throw new ApiError(409, 'Loại tin với tên này đã tồn tại');
  }

  // Create new news category
  const loaiTin = await prisma.loaiTin.create({
    data: {
      tenloaitin,
      trangthai: trangthai !== undefined ? Boolean(trangthai) : true,
    },
  });

  return loaiTin;
}

// Update news category
async function updateLoaiTin(id, data) {
  const { tenloaitin, trangthai } = data;

  // Check if news category exists
  const existingLoaiTin = await prisma.loaiTin.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingLoaiTin) {
    throw new ApiError(404, 'Không tìm thấy loại tin');
  }

  // Check if another news category with the same name exists
  if (tenloaitin && tenloaitin !== existingLoaiTin.tenloaitin) {
    const duplicateName = await prisma.loaiTin.findFirst({
      where: {
        tenloaitin,
        ma: { not: Number(id) },
      },
    });

    if (duplicateName) {
      throw new ApiError(409, 'Loại tin với tên này đã tồn tại');
    }
  }

  // Update news category
  const updatedLoaiTin = await prisma.loaiTin.update({
    where: { ma: Number(id) },
    data: {
      tenloaitin,
      trangthai: trangthai !== undefined ? Boolean(trangthai) : undefined,
    },
  });

  return updatedLoaiTin;
}

// Delete news category
async function deleteLoaiTin(id) {
  // Check if news category exists
  const existingLoaiTin = await prisma.loaiTin.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          tin: true,
        },
      },
    },
  });

  if (!existingLoaiTin) {
    throw new ApiError(404, 'Không tìm thấy loại tin');
  }

  // Check if news category has related news
  if (existingLoaiTin._count.tin > 0) {
    throw new ApiError(400, 'Không thể xóa loại tin đang có tin tức liên kết');
  }

  // Delete news category
  await prisma.loaiTin.delete({
    where: { ma: Number(id) },
  });

  return { message: 'Xóa loại tin thành công' };
}

// Delete multiple news categories
async function deleteManyLoaiTin(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }

  // Convert all ids to numbers
  const loaiTinIds = ids.map((id) => Number(id));

  // Check if all news categories exist
  const loaiTin = await prisma.loaiTin.findMany({
    where: {
      ma: {
        in: loaiTinIds,
      },
    },
    include: {
      _count: {
        select: {
          tin: true,
        },
      },
    },
  });

  // Check if we found all requested news categories
  if (loaiTin.length !== loaiTinIds.length) {
    const foundIds = loaiTin.map((lt) => lt.ma);
    const missingIds = loaiTinIds.filter((id) => !foundIds.includes(id));
    throw new ApiError(
      404,
      `Không tìm thấy loại tin với ID: ${missingIds.join(', ')}`
    );
  }

  // Check if any news category has related news
  const withNews = loaiTin.filter((lt) => lt._count.tin > 0);
  if (withNews.length > 0) {
    const categoryNames = withNews.map((lt) => lt.tenloaitin).join(', ');
    throw new ApiError(
      400,
      `Không thể xóa loại tin đang có tin tức liên kết: ${categoryNames}`
    );
  }

  // Delete news categories
  await prisma.loaiTin.deleteMany({
    where: {
      ma: {
        in: loaiTinIds,
      },
    },
  });

  return {
    message: `Đã xóa ${loaiTinIds.length} loại tin thành công`,
    deletedIds: loaiTinIds,
  };
}

// Get news categories by status
async function getLoaiTinByTrangThai(trangthai) {
  const where = {
    trangthai: trangthai === 'true',
  };

  const loaiTins = await prisma.loaiTin.findMany({
    where,
    orderBy: {
      ma: 'asc',
    },
    include: {
      _count: {
        select: {
          tin: true,
        },
      },
    },
  });

  return {
    data: loaiTins,
  };
}

module.exports = {
  getAllLoaiTin,
  getLoaiTinById,
  createLoaiTin,
  updateLoaiTin,
  deleteLoaiTin,
  deleteManyLoaiTin,
  getLoaiTinByTrangThai,
};
