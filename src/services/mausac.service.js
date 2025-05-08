const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all colors with pagination
async function getAllMauSac(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where = {};
  if (search) {
    where.OR = [
      {
        ten: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        ma_mau: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Get colors with pagination
  const [mauSacs, totalCount] = await Promise.all([
    prisma.mauSac.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        ma: 'asc',
      },
    }),
    prisma.mauSac.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: mauSacs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Get color by ID
async function getMauSacById(ma) {
  const mauSac = await prisma.mauSac.findUnique({
    where: { ma: Number(ma) },
  });

  if (!mauSac) {
    throw new ApiError(404, 'Không tìm thấy màu sắc');
  }

  return mauSac;
}

// Create new color
async function createMauSac(data) {
  const { ten, ma_mau } = data;

  // Check if color with the same name or color code exists
  const existingMauSac = await prisma.mauSac.findFirst({
    where: {
      OR: [{ ten }, { ma_mau }],
    },
  });

  if (existingMauSac) {
    throw new ApiError(409, 'Màu sắc với tên hoặc mã màu này đã tồn tại');
  }

  const mauSac = await prisma.mauSac.create({
    data: {
      ten,
      ma_mau,
    },
  });

  // Return created color
  return mauSac;
}

// Update color
async function updateMauSac(id, data) {
  const { ten, ma_mau } = data;

  // Check if color exists
  const existingMauSac = await prisma.mauSac.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingMauSac) {
    throw new ApiError(404, 'Không tìm thấy màu sắc');
  }

  // Check if another color with the same name or color code exists
  if (
    (ten && ten !== existingMauSac.ten) ||
    (ma_mau && ma_mau !== existingMauSac.ma_mau)
  ) {
    const duplicateCheck = await prisma.mauSac.findFirst({
      where: {
        OR: [ten ? { ten } : {}, ma_mau ? { ma_mau } : {}],
        ma: { not: Number(id) },
      },
    });

    if (duplicateCheck) {
      throw new ApiError(409, 'Màu sắc với tên hoặc mã màu này đã tồn tại');
    }
  }

  const updatedMauSac = await prisma.mauSac.update({
    where: { ma: Number(id) },
    data: {
      ten,
      ma_mau,
    },
  });
  // Return updated color
  return updatedMauSac;
}

// Delete color
async function deleteMauSac(id) {
  // Check if color exists
  const existingMauSac = await prisma.mauSac.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingMauSac) {
    throw new ApiError(404, 'Không tìm thấy màu sắc');
  }

  await prisma.mauSac.delete({
    where: { ma: Number(id) },
  });

  return { message: 'Xóa màu sắc thành công' };
}

module.exports = {
  getAllMauSac,
  getMauSacById,
  createMauSac,
  updateMauSac,
  deleteMauSac,
};
