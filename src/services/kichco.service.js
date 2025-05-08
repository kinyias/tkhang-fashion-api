const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all sizes with pagination
async function getAllKichCo(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  if (search) {
    where.ten = {
      contains: search,
      mode: 'insensitive'
    };
  }
  
  // Get sizes with pagination
  const [kichCos, totalCount] = await Promise.all([
    prisma.kichCo.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        ma: 'asc'
      },
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
  });
  
  if (!existingKichCo) {
    throw new ApiError(404, 'Không tìm thấy kích cỡ');
  }
  
  
  // Delete size
  await prisma.kichCo.delete({
    where: { ma: Number(id) }
  });
  
  return { message: 'Xóa kích cỡ thành công' };
}

module.exports = {
  getAllKichCo,
  getKichCoById,
  createKichCo,
  updateKichCo,
  deleteKichCo
};