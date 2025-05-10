const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all orders with pagination and filtering
async function getAllDonHang(page = 1, limit = 10, search = '', filters = {}) {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  
  // Filter by order status
  if (filters.trangthai) {
    where.trangthai = filters.trangthai;
  }
  
  // Filter by user ID
  if (filters.manguoidung) {
    where.manguoidung = Number(filters.manguoidung);
  }
  
  // Filter by date range
  if (filters.startDate && filters.endDate) {
    where.ngaydat = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    };
  }
  
  // Search by phone number
  if (search) {
    where.sdt = {
      contains: search,
      mode: 'insensitive'
    };
  }
  
  // Get orders with pagination
  const [donHangs, totalCount] = await Promise.all([
    prisma.donHang.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        ngaydat: 'desc'
      },
      include: {
        nguoiDung: {
          select: {
            ma: true,
            ho: true,
            ten: true,
            email: true,
            so_dien_thoai: true
          }
        },
        khuyenMai: true,
        chiTietDonHangs: {
          include: {
            sanPham: {
              select: {
                ma: true,
                ten: true,
                hinhanh: true
              }
            },
            bienThe: {
              include: {
                mauSac: true,
                kichCo: true
              }
            }
          }
        },
        thanhToans: true,
        _count: {
          select: {
            chiTietDonHangs: true,
            thanhToans: true
          }
        }
      }
    }),
    prisma.donHang.count({ where })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: donHangs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Get order by ID
async function getDonHangById(id) {
  const donHang = await prisma.donHang.findUnique({
    where: { ma: Number(id) },
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
          so_dien_thoai: true
        }
      },
      khuyenMai: true,
      chiTietDonHangs: {
        include: {
          sanPham: {
            select: {
              ma: true,
              ten: true,
              hinhanh: true
            }
          },
          bienThe: {
            include: {
              mauSac: true,
              kichCo: true
            }
          }
        }
      },
      thanhToans: true
    }
  });
  
  if (!donHang) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }
  
  return donHang;
}

// Get orders by user ID
async function getDonHangByUserId(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  // Get orders with pagination
  const [donHangs, totalCount] = await Promise.all([
    prisma.donHang.findMany({
      where: { manguoidung: Number(userId) },
      skip,
      take: Number(limit),
      orderBy: {
        ngaydat: 'desc'
      },
      include: {
        khuyenMai: true,
        chiTietDonHangs: {
          include: {
            sanPham: {
              select: {
                ma: true,
                ten: true,
                hinhanh: true
              }
            },
            bienThe: {
              include: {
                mauSac: true,
                kichCo: true
              }
            }
          }
        },
        thanhToans: true
      }
    }),
    prisma.donHang.count({ where: { manguoidung: Number(userId) } })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: donHangs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Create new order with transaction
async function createDonHang(data) {
  const { 
    diachi, 
    thanhpho, 
    quan, 
    phuong, 
    sdt, 
    ghichu, 
    manguoidung, 
    maKhuyenMai,
    chiTietDonHangs,
    thanhToan
  } = data;
  
  // Validate user exists
  const user = await prisma.nguoiDung.findUnique({
    where: { ma: Number(manguoidung) }
  });
  
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }
  
  // Validate coupon if provided
  let khuyenMai = null;
  if (maKhuyenMai) {
    khuyenMai = await prisma.khuyenMai.findUnique({
      where: { ma: Number(maKhuyenMai) }
    });
    
    if (!khuyenMai) {
      throw new ApiError(404, 'Không tìm thấy mã khuyến mãi');
    }
    
    // Check if coupon is valid (not expired)
    const now = new Date();
    if (now < khuyenMai.ngaybatdat || now > khuyenMai.ngayketthuc) {
      throw new ApiError(400, 'Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực');
    }
  }
  
  // Validate order items
  if (!chiTietDonHangs || !Array.isArray(chiTietDonHangs) || chiTietDonHangs.length === 0) {
    throw new ApiError(400, 'Đơn hàng phải có ít nhất một sản phẩm');
  }
  
  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (prismaClient) => {
    // Calculate order totals
    let tamtinh = 0;
    
    // Validate and calculate price for each order item
    for (const item of chiTietDonHangs) {
      // Check if product exists
      const sanPham = await prismaClient.sanPham.findUnique({
        where: { ma: Number(item.masp) }
      });
      
      if (!sanPham) {
        throw new ApiError(404, `Không tìm thấy sản phẩm với mã ${item.masp}`);
      }
      
      // Check if variant exists
      const bienThe = await prismaClient.bienThe.findUnique({
        where: { ma: Number(item.mabienthe) }
      });
      
      if (!bienThe) {
        throw new ApiError(404, `Không tìm thấy biến thể với mã ${item.mabienthe}`);
      }
      
      // Check if variant belongs to the product
      if (bienThe.msp !== sanPham.ma) {
        throw new ApiError(400, `Biến thể không thuộc sản phẩm này`);
      }
      
      // Check if enough stock
      if (bienThe.soluong < item.soluong) {
        throw new ApiError(400, `Sản phẩm ${sanPham.ten} không đủ số lượng trong kho`);
      }
      
      // Calculate item total
      tamtinh += Number(bienThe.gia) * item.soluong;
    }
    
    // Calculate discount if coupon is applied
    let giamgia = 0;
    if (khuyenMai) {
      // Check minimum order value
      if (tamtinh < khuyenMai.giatridonhang) {
        throw new ApiError(400, `Giá trị đơn hàng chưa đạt tối thiểu để áp dụng mã giảm giá`);
      }
      
      // Calculate discount based on coupon type
      if (khuyenMai.loaikhuyenmai === 'giam_gia_theo_phan_tram') {
        giamgia = (tamtinh * khuyenMai.giatrigiam) / 100;
      } else {
        giamgia = khuyenMai.giatrigiam;
      }
    }
    
    // Calculate final price
    const tonggia = tamtinh - giamgia;
    
    // Create order
    const donHang = await prismaClient.donHang.create({
      data: {
        ngaydat: new Date(),
        giamgia: giamgia > 0 ? giamgia : null,
        tamtinh,
        tonggia,
        diachi,
        thanhpho,
        quan,
        phuong,
        sdt,
        trangthai: 'da_dat',
        ghichu,
        manguoidung: Number(manguoidung),
        maKhuyenMai: khuyenMai ? Number(maKhuyenMai) : null
      }
    });
    
    // Create order items and update inventory
    for (const item of chiTietDonHangs) {
      // Get variant price
      const bienThe = await prismaClient.bienThe.findUnique({
        where: { ma: Number(item.mabienthe) }
      });
      
      // Create order item
      await prismaClient.chiTietDonHang.create({
        data: {
          soluong: Number(item.soluong),
          dongia: bienThe.gia,
          masp: Number(item.masp),
          madh: donHang.ma,
          mabienthe: Number(item.mabienthe)
        }
      });
      
      // Update inventory (reduce stock)
      await prismaClient.bienThe.update({
        where: { ma: Number(item.mabienthe) },
        data: {
          soluong: {
            decrement: Number(item.soluong)
          }
        }
      });
    }
    
    // Create payment record if provided
    if (thanhToan) {
      await prismaClient.thanhToan.create({
        data: {
          phuongthuc: thanhToan.phuongthuc,
          ngaythanhtoan: new Date(),
          trangthai: thanhToan.trangthai || false,
          madh: donHang.ma
        }
      });
    }
    
    // Return created order with relationships
    return await prismaClient.donHang.findUnique({
      where: { ma: donHang.ma },
      include: {
        nguoiDung: {
          select: {
            ma: true,
            ho: true,
            ten: true,
            email: true,
            so_dien_thoai: true
          }
        },
        khuyenMai: true,
        chiTietDonHangs: {
          include: {
            sanPham: {
              select: {
                ma: true,
                ten: true,
                hinhanh: true
              }
            },
            bienThe: {
              include: {
                mauSac: true,
                kichCo: true
              }
            }
          }
        },
        thanhToans: true
      }
    });
  });
}

// Update order status
async function updateDonHangStatus(id, trangthai, ngaygiao = null) {
  // Check if order exists
  const existingDonHang = await prisma.donHang.findUnique({
    where: { ma: Number(id) }
  });
  
  if (!existingDonHang) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }
  
  // Validate status transition
  const validTransitions = {
    da_dat: ['dang_xu_ly', 'da_giao_hang'],
    dang_xu_ly: ['dang_giao_hang', 'da_giao_hang'],
    dang_giao_hang: ['da_giao_hang']
  };
  
  if (
    existingDonHang.trangthai !== trangthai && 
    (!validTransitions[existingDonHang.trangthai] || 
     !validTransitions[existingDonHang.trangthai].includes(trangthai))
  ) {
    throw new ApiError(400, `Không thể chuyển trạng thái từ ${existingDonHang.trangthai} sang ${trangthai}`);
  }
  
  // Update data based on status
  const updateData = { trangthai };
  
  if (trangthai === 'dang_giao_hang' && !existingDonHang.ngaygiao) {
    updateData.ngaygiao = ngaygiao ? new Date(ngaygiao) : new Date();
  }
  
  // Update order
  const updatedDonHang = await prisma.donHang.update({
    where: { ma: Number(id) },
    data: updateData,
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
          so_dien_thoai: true
        }
      },
      khuyenMai: true,
      chiTietDonHangs: {
        include: {
          sanPham: {
            select: {
              ma: true,
              ten: true,
              hinhanh: true
            }
          },
          bienThe: {
            include: {
              mauSac: true,
              kichCo: true
            }
          }
        }
      },
      thanhToans: true
    }
  });
  
  return updatedDonHang;
}

// Cancel order with transaction
async function cancelDonHang(id) {
  // Check if order exists
  const existingDonHang = await prisma.donHang.findUnique({
    where: { ma: Number(id) },
    include: {
      chiTietDonHangs: {
        include: {
          bienThe: true
        }
      }
    }
  });
  
  if (!existingDonHang) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }
  
  // Check if order can be canceled (only if not delivered)
  if (existingDonHang.trangthai === 'da_giao_hang') {
    throw new ApiError(400, 'Không thể hủy đơn hàng đã giao');
  }
  
  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (prismaClient) => {
    // Update order status and set cancellation date
    const updatedDonHang = await prismaClient.donHang.update({
      where: { ma: Number(id) },
      data: {
        ngayhuy: new Date()
      }
    });
    
    // Restore inventory (add back to stock)
    for (const item of existingDonHang.chiTietDonHangs) {
      await prismaClient.bienThe.update({
        where: { ma: item.mabienthe },
        data: {
          soluong: {
            increment: item.soluong
          }
        }
      });
    }
    
    // Return updated order
    return await prismaClient.donHang.findUnique({
      where: { ma: updatedDonHang.ma },
      include: {
        nguoiDung: {
          select: {
            ma: true,
            ho: true,
            ten: true,
            email: true,
            so_dien_thoai: true
          }
        },
        khuyenMai: true,
        chiTietDonHangs: {
          include: {
            sanPham: {
              select: {
                ma: true,
                ten: true,
                hinhanh: true
              }
            },
            bienThe: {
              include: {
                mauSac: true,
                kichCo: true
              }
            }
          }
        },
        thanhToans: true
      }
    });
  });
}

// Update payment status
async function updateThanhToan(id, data) {
  const { phuongthuc, trangthai } = data;
  
  // Check if payment exists
  const existingThanhToan = await prisma.thanhToan.findUnique({
    where: { ma: Number(id) }
  });
  
  if (!existingThanhToan) {
    throw new ApiError(404, 'Không tìm thấy thông tin thanh toán');
  }
  
  // Update payment
  const updatedThanhToan = await prisma.thanhToan.update({
    where: { ma: Number(id) },
    data: {
      phuongthuc,
      trangthai: trangthai !== undefined ? Boolean(trangthai) : undefined,
      ngaythanhtoan: trangthai ? new Date() : existingThanhToan.ngaythanhtoan
    }
  });
  
  return updatedThanhToan;
}

// Create payment for an order
async function createThanhToan(data) {
  const { madh, phuongthuc, trangthai } = data;
  
  // Check if order exists
  const donHang = await prisma.donHang.findUnique({
    where: { ma: Number(madh) }
  });
  
  if (!donHang) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }
  
  // Create payment
  const thanhToan = await prisma.thanhToan.create({
    data: {
      phuongthuc,
      ngaythanhtoan: new Date(),
      trangthai: Boolean(trangthai),
      madh: Number(madh)
    }
  });
  
  return thanhToan;
}

module.exports = {
  getAllDonHang,
  getDonHangById,
  getDonHangByUserId,
  createDonHang,
  updateDonHangStatus,
  cancelDonHang,
  updateThanhToan,
  createThanhToan
};