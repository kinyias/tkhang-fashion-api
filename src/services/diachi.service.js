const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all addresses with pagination
async function getAllDiaChi(
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
    where.OR = [
      { tennguoinhan: { contains: search, mode: 'insensitive' } },
      { diachi: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Apply additional filters
  if (filters.manguoidung) {
    where.manguoidung = Number(filters.manguoidung);
  }

  if (filters.loaidiachi) {
    where.loaidiachi = filters.loaidiachi;
  }

  if (filters.macdinh !== undefined) {
    where.macdinh = filters.macdinh === 'true';
  }

  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'tennguoinhan', 'diachi'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';

  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;

  // Get addresses with pagination
  const [diaChis, totalCount] = await Promise.all([
    prisma.diaChi.findMany({
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
      },
    }),
    prisma.diaChi.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: diaChis,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Get address by ID
async function getDiaChiById(id) {
  const diaChi = await prisma.diaChi.findUnique({
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
    },
  });

  if (!diaChi) {
    throw new ApiError(404, 'Không tìm thấy địa chỉ');
  }

  return diaChi;
}

// Create new address
async function createDiaChi(data) {
  const {
    tennguoinhan,
    email,
    sodienthoai,
    diachi,
    phuongxa,
    quanhuyen,
    tinhthanh,
    macdinh,
    loaidiachi,
    manguoidung,
  } = data;

  // Check if user exists
  const nguoiDung = await prisma.nguoiDung.findUnique({
    where: { ma: Number(manguoidung) },
  });

  if (!nguoiDung) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  // If this is set as default, unset any existing default address
  if (macdinh) {
    await prisma.diaChi.updateMany({
      where: {
        manguoidung: Number(manguoidung),
        macdinh: true,
      },
      data: {
        macdinh: false,
      },
    });
  }

  // Create new address
  const newDiaChi = await prisma.diaChi.create({
    data: {
      tennguoinhan,
      email,
      sodienthoai,
      diachi,
      phuongxa,
      quanhuyen,
      tinhthanh,
      macdinh: Boolean(macdinh),
      loaidiachi,
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
    },
  });

  return newDiaChi;
}

// Update address
async function updateDiaChi(id, data) {
  const {
    tennguoinhan,
    email,
    sodienthoai,
    diachi,
    phuongxa,
    quanhuyen,
    tinhthanh,
    macdinh,
    loaidiachi,
  } = data;

  // Check if address exists
  const existingDiaChi = await prisma.diaChi.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingDiaChi) {
    throw new ApiError(404, 'Không tìm thấy địa chỉ');
  }

  // If this is set as default, unset any existing default address
  if (macdinh) {
    await prisma.diaChi.updateMany({
      where: {
        manguoidung: existingDiaChi.manguoidung,
        macdinh: true,
        ma: {
          not: Number(id),
        },
      },
      data: {
        macdinh: false,
      },
    });
  }

  // Update address
  const updatedDiaChi = await prisma.diaChi.update({
    where: { ma: Number(id) },
    data: {
      tennguoinhan,
      email,
      sodienthoai,
      diachi,
      phuongxa,
      quanhuyen,
      tinhthanh,
      macdinh: macdinh !== undefined ? Boolean(macdinh) : undefined,
      loaidiachi,
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
    },
  });

  return updatedDiaChi;
}

// Delete address
async function deleteDiaChi(id) {
  // Check if address exists
  const existingDiaChi = await prisma.diaChi.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingDiaChi) {
    throw new ApiError(404, 'Không tìm thấy địa chỉ');
  }

  // Delete address
  await prisma.diaChi.delete({
    where: { ma: Number(id) },
  });

  return { message: 'Xóa địa chỉ thành công' };
}

// Delete multiple addresses
async function deleteManyDiaChi(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }

  // Convert all ids to numbers
  const diaChiIds = ids.map((id) => Number(id));

  // Check if all addresses exist
  const diaChis = await prisma.diaChi.findMany({
    where: {
      ma: {
        in: diaChiIds,
      },
    },
  });

  // Check if we found all requested addresses
  if (diaChis.length !== diaChiIds.length) {
    const foundIds = diaChis.map((dc) => dc.ma);
    const missingIds = diaChiIds.filter((id) => !foundIds.includes(id));
    throw new ApiError(
      404,
      `Không tìm thấy địa chỉ với ID: ${missingIds.join(', ')}`
    );
  }

  // Delete addresses
  await prisma.diaChi.deleteMany({
    where: {
      ma: {
        in: diaChiIds,
      },
    },
  });

  return {
    message: `Đã xóa ${diaChiIds.length} địa chỉ thành công`,
    deletedIds: diaChiIds,
  };
}

// Get addresses by user ID
async function getDiaChiByUserId(userId) {
  const diaChis = await prisma.diaChi.findMany({
    where: {
      manguoidung: Number(userId),
    },
    orderBy: {
      macdinh: 'desc',
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
    },
  });

  return {
    data: diaChis,
  };
}

module.exports = {
  getAllDiaChi,
  getDiaChiById,
  createDiaChi,
  updateDiaChi,
  deleteDiaChi,
  deleteManyDiaChi,
  getDiaChiByUserId,
};
