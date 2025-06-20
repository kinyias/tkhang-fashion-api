const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all promotions with pagination
async function getAllKhuyenMai(page = 1, limit = 10, search = '', filters = {}, sortBy = 'ma', sortOrder = 'desc') {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  if (search) {
    where.ten = {
      contains: search,
      mode: 'insensitive'
    };
  }
  
  // Apply additional filters
  if (filters.loaikhuyenmai && filters.loaikhuyenmai !== 'all') {
    where.loaikhuyenmai = filters.loaikhuyenmai;
  }
  
  if (filters.active === 'true') {
    const now = new Date();
    where.AND = [
      { ngaybatdat: { lte: now } },
      { ngayketthuc: { gte: now } }
    ];
  }
  
  // Validate sort field
  const validSortFields = ['ma', 'ten', 'ngaybatdat', 'ngayketthuc', 'giatrigiam', 'giatridonhang'];
  const orderBy = {};
  
  if (validSortFields.includes(sortBy)) {
    orderBy[sortBy] = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
  } else {
    orderBy.ma = 'desc'; // Default sorting
  }
  
  // Get promotions with pagination
  const [khuyenMais, totalCount] = await Promise.all([
    prisma.khuyenMai.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
    }),
    prisma.khuyenMai.count({ where })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: khuyenMais,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Get promotion by ID
async function getKhuyenMaiById(id) {
  const khuyenMai = await prisma.khuyenMai.findUnique({
    where: { ma: Number(id) },
  });
  
  if (!khuyenMai) {
    throw new ApiError(404, 'Không tìm thấy khuyến mãi');
  }
  
  return khuyenMai;
}

// Create new promotion
async function createKhuyenMai(data) {
  const { ten, loaikhuyenmai, giatrigiam, giatridonhang, giamtoida, ngaybatdat, ngayketthuc } = data;
  
  // Check if promotion with the same name exists
  const existingKhuyenMai = await prisma.khuyenMai.findFirst({
    where: { ten }
  });
  
  if (existingKhuyenMai) {
    throw new ApiError(409, 'Khuyến mãi với tên này đã tồn tại');
  }
  
  // Validate promotion dates
  const startDate = new Date(ngaybatdat);
  const endDate = new Date(ngayketthuc);
  
  if (endDate <= startDate) {
    throw new ApiError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
  }
  
  // Validate discount value based on promotion type
  if (loaikhuyenmai === 'phan_tram' && (giatrigiam <= 0 || giatrigiam > 100)) {
    throw new ApiError(400, 'Giá trị giảm theo phần trăm phải từ 1 đến 100');
  }
  
  if (loaikhuyenmai === 'tien_mat' && giatrigiam <= 0) {
    throw new ApiError(400, 'Giá trị giảm phải lớn hơn 0');
  }
  
  // Create new promotion
  const khuyenMai = await prisma.khuyenMai.create({
    data: {
      ten,
      loaikhuyenmai,
      giatrigiam,
      giatridonhang,
      giamtoida,
      ngaybatdat: startDate,
      ngayketthuc: endDate
    }
  });
  
  return khuyenMai;
}

// Update promotion
async function updateKhuyenMai(id, data) {
  const { ten, loaikhuyenmai, giatrigiam, giatridonhang, giamtoida, ngaybatdat, ngayketthuc } = data;
  
  // Check if promotion exists
  const existingKhuyenMai = await prisma.khuyenMai.findUnique({
    where: { ma: Number(id) },
  });
  
  if (!existingKhuyenMai) {
    throw new ApiError(404, 'Không tìm thấy khuyến mãi');
  }
  
  // Check if another promotion with the same name exists
  if (ten && ten !== existingKhuyenMai.ten) {
    const duplicateName = await prisma.khuyenMai.findFirst({
      where: {
        ten,
        ma: { not: Number(id) }
      }
    });
    
    if (duplicateName) {
      throw new ApiError(409, 'Khuyến mãi với tên này đã tồn tại');
    }
  }
  
  // Validate promotion dates if provided
  let startDate = existingKhuyenMai.ngaybatdat;
  let endDate = existingKhuyenMai.ngayketthuc;
  
  if (ngaybatdat) {
    startDate = new Date(ngaybatdat);
  }
  
  if (ngayketthuc) {
    endDate = new Date(ngayketthuc);
  }
  
  if (endDate <= startDate) {
    throw new ApiError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
  }
  
  // Validate discount value based on promotion type if provided
  const promotionType = loaikhuyenmai || existingKhuyenMai.loaikhuyenmai;
  const discountValue = giatrigiam !== undefined ? giatrigiam : existingKhuyenMai.giatrigiam;
  
  if (promotionType === 'phan_tram' && (discountValue <= 0 || discountValue > 100)) {
    throw new ApiError(400, 'Giá trị giảm theo phần trăm phải từ 1 đến 100');
  }
  
  if (promotionType === 'tien_mat' && discountValue <= 0) {
    throw new ApiError(400, 'Giá trị giảm phải lớn hơn 0');
  }
  
  // Update promotion
  const updatedKhuyenMai = await prisma.khuyenMai.update({
    where: { ma: Number(id) },
    data: {
      ten,
      loaikhuyenmai,
      giatrigiam,
      giatridonhang,
      giamtoida,
      ngaybatdat: ngaybatdat ? startDate : undefined,
      ngayketthuc: ngayketthuc ? endDate : undefined
    }
  });
  
  return updatedKhuyenMai;
}

// Delete promotion
async function deleteKhuyenMai(id) {
  // Check if promotion exists
  const existingKhuyenMai = await prisma.khuyenMai.findUnique({
    where: { ma: Number(id) },
  });
  
  if (!existingKhuyenMai) {
    throw new ApiError(404, 'Không tìm thấy khuyến mãi');
  }
  
  // Check if promotion has related orders
  if (existingKhuyenMai._count.DonHang > 0) {
    throw new ApiError(400, 'Không thể xóa khuyến mãi đang có đơn hàng liên kết');
  }
  
  // Delete promotion
  await prisma.khuyenMai.delete({
    where: { ma: Number(id) }
  });
  
  return { message: 'Xóa khuyến mãi thành công' };
}

module.exports = {
  getAllKhuyenMai,
  getKhuyenMaiById,
  createKhuyenMai,
  updateKhuyenMai,
  deleteKhuyenMai
};