const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all colors with pagination
async function getAllMauSac(page = 1, limit = 10, search = '', sortBy = 'ma', sortOrder = 'asc') {
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

  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'ten', 'ma_mau'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';
  
  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;

  // Get colors with pagination
  const [mauSacs, totalCount] = await Promise.all([
    prisma.mauSac.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        _count: {
          select: {
            bienThes: true,
            hinhAnhMauSacs: true
          }
        }
      }
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
    include: {
      _count: {
        select: {
          bienThes: true,
          hinhAnhMauSacs: true
        }
      }
    }
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
    if (existingMauSac.ten === ten) {
      throw new ApiError(409, 'Màu sắc với tên này đã tồn tại');
    } else {
      throw new ApiError(409, 'Mã màu này đã tồn tại');
    }
  }

  // Create new color
  const mauSac = await prisma.mauSac.create({
    data: {
      ten,
      ma_mau,
    },
  });

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
  if ((ten && ten !== existingMauSac.ten) || (ma_mau && ma_mau !== existingMauSac.ma_mau)) {
    const duplicateCheck = await prisma.mauSac.findFirst({
      where: {
        OR: [
          { ten: ten || existingMauSac.ten },
          { ma_mau: ma_mau || existingMauSac.ma_mau },
        ],
        ma: { not: Number(id) },
      },
    });

    if (duplicateCheck) {
      if (duplicateCheck.ten === ten) {
        throw new ApiError(409, 'Màu sắc với tên này đã tồn tại');
      } else {
        throw new ApiError(409, 'Mã màu này đã tồn tại');
      }
    }
  }

  // Update color
  const updatedMauSac = await prisma.mauSac.update({
    where: { ma: Number(id) },
    data: {
      ten,
      ma_mau,
    },
  });

  return updatedMauSac;
}

// Delete color
async function deleteMauSac(id) {
  // Check if color exists
  const existingMauSac = await prisma.mauSac.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          bienThes: true,
          hinhAnhMauSacs: true
        }
      }
    }
  });

  if (!existingMauSac) {
    throw new ApiError(404, 'Không tìm thấy màu sắc');
  }

  // Check if color has related variants or images
  if (existingMauSac._count.bienThes > 0) {
    throw new ApiError(400, 'Không thể xóa màu sắc đang có biến thể sản phẩm liên kết');
  }

  // Delete related color images first
  if (existingMauSac._count.hinhAnhMauSacs > 0) {
    await prisma.hinhAnhMauSac.deleteMany({
      where: { mamausac: Number(id) }
    });
  }

  // Delete color
  await prisma.mauSac.delete({
    where: { ma: Number(id) },
  });

  return { message: 'Xóa màu sắc thành công' };
}

// Delete multiple colors
async function deleteManyMauSac(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }
  
  // Convert all ids to numbers
  const colorIds = ids.map(id => Number(id));
  
  // Check if all colors exist and can be deleted
  const colors = await prisma.mauSac.findMany({
    where: {
      ma: {
        in: colorIds
      }
    },
    include: {
      _count: {
        select: {
          bienThes: true,
          hinhAnhMauSacs: true
        }
      }
    }
  });
  
  // Check if all requested colors were found
  if (colors.length !== colorIds.length) {
    throw new ApiError(404, 'Một hoặc nhiều màu sắc không tồn tại');
  }
  
  // Check if any color has related variants
  const nonDeletableColors = colors.filter(
    color => color._count.bienThes > 0
  );
  
  if (nonDeletableColors.length > 0) {
    const colorNames = nonDeletableColors.map(color => color.ten).join(', ');
    throw new ApiError(
      400, 
      `Không thể xóa các màu sắc đang có biến thể sản phẩm liên kết: ${colorNames}`
    );
  }
  
  // Delete related color images first
  const colorIdsWithImages = colors
    .filter(color => color._count.hinhAnhMauSacs > 0)
    .map(color => color.ma);
  
  if (colorIdsWithImages.length > 0) {
    await prisma.hinhAnhMauSac.deleteMany({
      where: {
        mamausac: {
          in: colorIdsWithImages
        }
      }
    });
  }
  
  // Delete all colors
  await prisma.mauSac.deleteMany({
    where: {
      ma: {
        in: colorIds
      }
    }
  });
  
  return { 
    message: `Đã xóa ${colorIds.length} màu sắc thành công`,
    deletedCount: colorIds.length
  };
}

module.exports = {
  getAllMauSac,
  getMauSacById,
  createMauSac,
  updateMauSac,
  deleteMauSac,
  deleteManyMauSac
};
