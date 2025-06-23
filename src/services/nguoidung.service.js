const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const ApiError = require('../lib/ApiError');

// ... existing code ...

// Get all users with pagination and filters (Admin)
async function getAllUsers(
  page = 1,
  limit = 10,
  search = '',
  vai_tro = '',
  xac_thuc_email = null,
  sortBy = 'ma',
  sortOrder = 'asc'
) {
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where = {};
  if (search) {
    where.OR = [
      { ho: { contains: search, mode: 'insensitive' } },
      { ten: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (vai_tro) {
    where.vai_tro = vai_tro;
  }
  if (xac_thuc_email !== null) {
    where.xac_thuc_email = xac_thuc_email;
  }

  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = [
    'ma',
    'ho',
    'ten',
    'email',
    'vai_tro',
    'xac_thuc_email',
    'ngay_tao',
  ];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';

  // Validate sortOrder
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  orderBy[validSortField] = validSortOrder;

  // Get users with pagination
  const [users, totalCount] = await Promise.all([
    prisma.nguoiDung.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      select: {
        ma: true,
        email: true,
        ho: true,
        ten: true,
        so_dien_thoai: true,
        vai_tro: true,
        xac_thuc_email: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
      },
    }),
    prisma.nguoiDung.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Create new user (Admin)
async function createUser(data) {
  const { email, ho, ten, so_dien_thoai, vai_tro, mat_khau } = data;

  // Check if user with the same email exists
  const existingUser = await prisma.nguoiDung.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, 'Email đã tồn tại');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(mat_khau, salt);

  // Create new user
  const user = await prisma.nguoiDung.create({
    data: {
      email,
      ho,
      ten,
      so_dien_thoai,
      vai_tro,
      mat_khau: hashedPassword,
      xac_thuc_email: true,
    },
    select: {
      ma: true,
      email: true,
      ho: true,
      ten: true,
      so_dien_thoai: true,
      vai_tro: true,
      xac_thuc_email: true,
      ngay_tao: true,
    },
  });

  return user;
}

// Update user role (Admin)
async function updateUserRole(id, vai_tro) {
  // Check if user exists
  const existingUser = await prisma.nguoiDung.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingUser) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  // Update user role
  const updatedUser = await prisma.nguoiDung.update({
    where: { ma: Number(id) },
    data: { vai_tro },
    select: {
      ma: true,
      email: true,
      ho: true,
      ten: true,
      vai_tro: true,
      ngay_cap_nhat: true,
    },
  });

  return updatedUser;
}

// Update user information (Admin)
async function updateUser(id, data) {
  const { ho, ten, so_dien_thoai } = data;

  // Check if user exists
  const existingUser = await prisma.nguoiDung.findUnique({
    where: { ma: Number(id) },
  });

  if (!existingUser) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  // Update user
  const updatedUser = await prisma.nguoiDung.update({
    where: { ma: Number(id) },
    data: {
      ho,
      ten,
      so_dien_thoai,
    },
    select: {
      ma: true,
      email: true,
      ho: true,
      ten: true,
      so_dien_thoai: true,
      vai_tro: true,
      xac_thuc_email: true,
      ngay_cap_nhat: true,
    },
  });

  return updatedUser;
}

module.exports = {
  getAllUsers,
  createUser,
  updateUserRole,
  updateUser,
};
