const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all sizes with pagination
async function getAllKichCo(page = 1, limit = 10, search = '', sortBy = 'ma', sortOrder = 'asc') {
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
  const validSortFields = ['ma', 'ten'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';
  
  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;
  
  // Get sizes with pagination
  const [kichCos, totalCount] = await Promise.all([
    prisma.kichCo.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        _count: {
          select: {
            bienThes: true
          }
        }
      }
    }),
    prisma.kichCo.count({ where })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: kichCos,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Get size by ID
async function getKichCoById(id) {
  const kichCo = await prisma.kichCo.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          bienThes: true
        }
      }
    }
  });
  
  if (!kichCo) {
    throw new ApiError(404, 'Không tìm thấy kích cỡ');
  }
  
  return kichCo;
}

// Create new size
async function createKichCo(data) {
  const { ten } = data;
  
  // Check if size with the same name exists
  const existingKichCo = await prisma.kichCo.findFirst({
    where: { ten }
  });
  
  if (existingKichCo) {
    throw new ApiError(409, 'Kích cỡ với tên này đã tồn tại');
  }
  
  // Create new size
  const kichCo = await prisma.kichCo.create({
    data: {
      ten
    }
  });
  
  return kichCo;
}

// Update size
async function updateKichCo(id, data) {
  const { ten } = data;
  
  // Check if size exists
  const existingKichCo = await prisma.kichCo.findUnique({
    where: { ma: Number(id) }
  });
  
  if (!existingKichCo) {
    throw new ApiError(404, 'Không tìm thấy kích cỡ');
  }
  
  // Check if another size with the same name exists
  if (ten && ten !== existingKichCo.ten) {
    const duplicateName = await prisma.kichCo.findFirst({
      where: {
        ten,
        ma: { not: Number(id) }
      }
    });
    
    if (duplicateName) {
      throw new ApiError(409, 'Kích cỡ với tên này đã tồn tại');
    }
  }
  
  // Update size
  const updatedKichCo = await prisma.kichCo.update({
    where: { ma: Number(id) },
    data: {
      ten
    }
  });
  
  return updatedKichCo;
}

// Delete size
async function deleteKichCo(id) {
  // Check if size exists
  const existingKichCo = await prisma.kichCo.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          bienThes: true
        }
      }
    }
  });
  
  if (!existingKichCo) {
    throw new ApiError(404, 'Không tìm thấy kích cỡ');
  }
  
  // Check if size has related variants
  if (existingKichCo._count.bienThes > 0) {
    throw new ApiError(400, 'Không thể xóa kích cỡ đang có biến thể sản phẩm liên kết');
  }
  
  // Delete size
  await prisma.kichCo.delete({
    where: { ma: Number(id) }
  });
  
  return { message: 'Xóa kích cỡ thành công' };
}

// Delete multiple sizes
async function deleteManyKichCo(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }
  // Convert all ids to numbers
  const sizeIds = ids.map(id => Number(id));
  
  // Check if all sizes exist and can be deleted
  const sizes = await prisma.kichCo.findMany({
    where: {
      ma: {
        in: sizeIds
      }
    },
    include: {
      _count: {
        select: {
          bienThes: true
        }
      }
    }
  });
  
  // Check if all requested sizes were found
  if (sizes.length !== sizeIds.length) {
    throw new ApiError(404, 'Một hoặc nhiều kích cỡ không tồn tại');
  }
  
  // Check if any size has related variants
  const nonDeletableSizes = sizes.filter(
    size => size._count.bienThes > 0
  );
  
  if (nonDeletableSizes.length > 0) {
    const sizeNames = nonDeletableSizes.map(size => size.ten).join(', ');
    throw new ApiError(
      400, 
      `Không thể xóa các kích cỡ đang có biến thể sản phẩm liên kết: ${sizeNames}`
    );
  }
  
  // Delete all sizes
  await prisma.kichCo.deleteMany({
    where: {
      ma: {
        in: sizeIds
      }
    }
  });
  
  return { 
    message: `Đã xóa ${sizeIds.length} kích cỡ thành công`,
    deletedCount: sizeIds.length
  };
}

module.exports = {
  getAllKichCo,
  getKichCoById,
  createKichCo,
  updateKichCo,
  deleteKichCo,
  deleteManyKichCo
};