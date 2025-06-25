const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');
const { createMoMoPayment, refundMoMo } = require('./momo.service');
const { createVnPayPayment } = require('./vnpay.service');
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
      lte: new Date(filters.endDate),
    };
  }

  // Search by phone number
  if (search) {
    where.sdt = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Get orders with pagination
  const [donHangs, totalCount] = await Promise.all([
    prisma.donHang.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        ngaydat: 'desc',
      },
      include: {
        nguoiDung: {
          select: {
            ma: true,
            ho: true,
            ten: true,
            email: true,
            so_dien_thoai: true,
          },
        },
        khuyenMai: true,
        chiTietDonHangs: {
          include: {
            sanPham: {
              select: {
                ma: true,
                ten: true,
                hinhanh: true,
              },
            },
            bienThe: {
              include: {
                mauSac: true,
                kichCo: true,
              },
            },
          },
        },
        thanhToans: true,
        _count: {
          select: {
            chiTietDonHangs: true,
          },
        },
      },
    }),
    prisma.donHang.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: donHangs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Get order wiht order item by ID
async function getDonHangWithChiTietById(id) {
  const donHang = await prisma.donHang.findUnique({
    where: { ma: id },
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
          so_dien_thoai: true,
        },
      },
      khuyenMai: true,
      chiTietDonHangs: {
        include: {
          sanPham: {
            select: {
              ma: true,
              ten: true,
              hinhanh: true,
            },
          },
          bienThe: {
            include: {
              mauSac: true,
              kichCo: true,
            },
          },
        },
      },
      thanhToans: true,
    },
  });

  if (!donHang) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  return donHang;
}
// Get order by ID
async function getDonHangById(id) {
  const donHang = await prisma.donHang.findUnique({
    where: { ma: id },
    include: {
      thanhToans: true,
    },
  });

  if (!donHang) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  return donHang;
}
// Get orders by user ID
async function getDonHangByUserId(userId, page = 1, limit = 10, trangthai) {
  const skip = (page - 1) * limit;
  const where = {};
  // Filter by order status
  if (userId) {
    where.manguoidung = Number(userId);
  }
  if (trangthai) {
    where.trangthai = trangthai;
  }
  // Get orders with pagination
  const [donHangs, totalCount] = await Promise.all([
    prisma.donHang.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        ngaydat: 'desc',
      },
      include: {
        khuyenMai: true,
        chiTietDonHangs: {
          include: {
            sanPham: {
              select: {
                ma: true,
                ten: true,
                hinhanh: true,
              },
            },
            bienThe: {
              include: {
                mauSac: true,
                kichCo: true,
              },
            },
          },
        },
        thanhToans: true,
      },
    }),
    prisma.donHang.count({ where }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: donHangs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages,
    },
  };
}

// Create new order with transaction
async function createDonHang(data, req) {
  const {
    ten,
    email,
    diachi,
    thanhpho,
    quan,
    phuong,
    sdt,
    ghichu,
    tonggia,
    tamtinh,
    giamgia,
    phuongthucgiaohang,
    phigiaohang,
    manguoidung,
    maKhuyenMai,
    chiTietDonHangs,
    thanhToan,
    returnUrl,
    ipnUrl,
  } = data;
  // Validate order items
  if (
    !chiTietDonHangs ||
    !Array.isArray(chiTietDonHangs) ||
    chiTietDonHangs.length === 0
  ) {
    throw new ApiError(400, 'Đơn hàng phải có ít nhất một sản phẩm');
  }

  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (prismaClient) => {
    // Create order
    const donHang = await prismaClient.donHang.create({
      data: {
        ngaydat: new Date(),
        ten,
        email,
        giamgia,
        tamtinh,
        tonggia,
        diachi,
        thanhpho,
        quan,
        phuong,
        sdt,
        phuongthucgiaohang,
        phigiaohang,
        trangthai: 'da_dat',
        ghichu,
        manguoidung: Number(manguoidung),
        maKhuyenMai,
      },
    });

    const operations = [];

    // Create order items
    const chiTietData = chiTietDonHangs.map((item) => ({
      soluong: Number(item.soluong),
      dongia: item.dongia,
      masp: Number(item.masp),
      madh: donHang.ma,
      mabienthe: Number(item.mabienthe),
    }));
    operations.push(prismaClient.chiTietDonHang.createMany({ data: chiTietData }));

    // Update inventory - use single updateMany where possible
    // Group by same quantity changes if needed, or use individual updates
    const inventoryUpdates = chiTietDonHangs.map(item =>
      prismaClient.bienThe.update({
        where: { 
          ma: Number(item.mabienthe),
          soluong: { gte: Number(item.soluong) }
        },
        data: {
          soluong: { decrement: Number(item.soluong) }
        }
      }).catch(e => {
        console.error(`Không đủ số lượng cho biến thể ${item.mabienthe}`);
        throw new ApiError(400, `Số lượng còn lại của sản phẩm không đủ`);
      })
    );
    operations.push(...inventoryUpdates);

    // Execute order items creation and inventory updates in parallel
    await Promise.all(operations);

    // Create payment record if provided
    if (thanhToan) {
      if (thanhToan.phuongthuc === 'momo') {
        try {
          // Create MoMo payment
          const orderInfo = `Thanh toán đơn hàng ${donHang.ma}`;
          const momoResponse = await createMoMoPayment(
            donHang.ma,
            tonggia,
            orderInfo,
            returnUrl,
            ipnUrl
          );
          // Create payment record with pending status
          paymentResult = await prismaClient.thanhToan.create({
            data: {
              phuongthuc: 'momo',
              ngaythanhtoan: new Date(),
              trangthai: false, // false = pending
              madh: donHang.ma,
              // momoRequestId: momoResponse.requestId,
              // momoOrderId: momoResponse.orderId,
              // momoPayUrl: momoResponse.payUrl
            },
          });

          // Return order with payment URL
          const result = await prismaClient.donHang.findUnique({
            where: { ma: donHang.ma },
            include: {
              nguoiDung: {
                select: {
                  ma: true,
                  ho: true,
                  ten: true,
                  email: true,
                  so_dien_thoai: true,
                },
              },
              chiTietDonHangs: {
                include: {
                  sanPham: {
                    select: {
                      ma: true,
                      ten: true,
                      hinhanh: true,
                    },
                  },
                },
              },
            },
          });

          return {
            ...result,
            paymentUrl: momoResponse.payUrl,
          };
        } catch (error) {
          console.error('MoMo payment error:', error);
          throw new ApiError(500, 'Lỗi khi tạo thanh toán MoMo');
        }
      }
      else if(thanhToan.phuongthuc === 'vnpay') {
        try {
          // Create VNPay payment
          const vnpayResponse = await createVnPayPayment(donHang.ma, tonggia, req);
          await prismaClient.thanhToan.create({
            data: {
              phuongthuc: 'vnpay',
              ngaythanhtoan: new Date(),
              trangthai: false, // false = pending
              madh: donHang.ma,
            },
          });
          const result = await prismaClient.donHang.findUnique({
            where: { ma: donHang.ma },
            include: {
              nguoiDung: {
                select: {
                  ma: true,
                  ho: true,
                  ten: true,
                  email: true,
                  so_dien_thoai: true,
                },
              },
              chiTietDonHangs: {
                include: {
                  sanPham: {
                    select: {
                      ma: true,
                      ten: true,
                      hinhanh: true,
                    },
                  },
                },
              },
            },
          });
          return {
            ...result,
            paymentUrl: vnpayResponse.vnpUrl,
          };
        } catch (error) {
          console.error('VNPay payment error:', error);
          throw new ApiError(500, 'Lỗi khi tạo thanh toán VNPay');
        }
      }
      else {
        // Handle other payment methods (COD, etc.)
        await prismaClient.thanhToan.create({
          data: {
            phuongthuc: thanhToan.phuongthuc,
            ngaythanhtoan: new Date(),
            trangthai: thanhToan.trangthai || false,
            madh: donHang.ma,
          },
        });
      }
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
            so_dien_thoai: true,
          },
        },
        chiTietDonHangs: {
          include: {
            sanPham: {
              select: {
                ma: true,
                ten: true,
                hinhanh: true,
              },
            },
          },
        },
      },
    });
  },{
    timeout: 20000, 
    maxWait: 15000,
  });
}

// Update order status
async function updateDonHangStatus(id, trangthai, ngaygiao = null, mavandon = null) {
  // Check if order exists
  const existingDonHang = await prisma.donHang.findUnique({
    where: { ma: id},
  });

  if (!existingDonHang) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  // Validate status transition
  const validTransitions = {
    da_dat: ['dang_xu_ly', 'da_giao_hang'],
    dang_xu_ly: ['dang_giao_hang', 'da_giao_hang'],
    dang_giao_hang: ['da_giao_hang'],
  };

  if (
    existingDonHang.trangthai !== trangthai &&
    (!validTransitions[existingDonHang.trangthai] ||
      !validTransitions[existingDonHang.trangthai].includes(trangthai))
  ) {
    throw new ApiError(
      400,
      `Không thể chuyển trạng thái từ ${existingDonHang.trangthai} sang ${trangthai}`
    );
  }

  // Update data based on status
  const updateData = { trangthai };
  if(mavandon){
    updateData.mavandon = mavandon;
  }
  if (trangthai === 'dang_giao_hang' && !existingDonHang.ngaygiao) {
    updateData.ngaygiao = ngaygiao ? new Date(ngaygiao) : new Date();
  }
  if (trangthai === 'da_giao_hang') {
    await prisma.thanhToan.update({
      where: { madh: id },
      data: {
        trangthai: true,
      },
    });
  }
  // Update order
  const updatedDonHang = await prisma.donHang.update({
    where: { ma: id },
    data: updateData,
    include: {
      nguoiDung: {
        select: {
          ma: true,
          ho: true,
          ten: true,
          email: true,
          so_dien_thoai: true,
        },
      },
      khuyenMai: true,
      chiTietDonHangs: {
        include: {
          sanPham: {
            select: {
              ma: true,
              ten: true,
              hinhanh: true,
            },
          },
          bienThe: {
            include: {
              mauSac: true,
              kichCo: true,
            },
          },
        },
      },
      thanhToans: true,
    },
  });

  return updatedDonHang;
}

// Cancel order with transaction
async function cancelDonHang(id, lydo) {
  // Check if order exists
  const existingDonHang = await prisma.donHang.findUnique({
    where: { ma: id },
    include: {
      chiTietDonHangs: {
        include: {
          bienThe: true,
        },
      },
      thanhToans: true,
    },
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
      where: { ma: id },
      data: {
        lydo,
        ngayhuy: new Date(),
        trangthai: 'da_huy',
      },
    });

    // Restore inventory (add back to stock)
    for (const item of existingDonHang.chiTietDonHangs) {
      await prismaClient.bienThe.update({
        where: { ma: item.mabienthe },
        data: {
          soluong: {
            increment: item.soluong,
          },
        },
      });
    }
    // Refund MoMo
  //   if(existingDonHang.thanhToans.phuongthuc === 'momo' && existingDonHang.thanhToans.trangthai && existingDonHang.thanhToans.transId){
  //   const refundResult = await refundMoMo({
  //     orderId: id,
  //     amount: existingDonHang.tonggia,
  //     transId: existingDonHang.thanhToans[0].transId,
  //     description: 'Hoàn tiền đơn hàng',
  //   });
  //   return {...refundResult, trangthai: updatedDonHang.trangthai};
  // } else if(existingDonHang.thanhToans.phuongthuc === 'vnpay' && existingDonHang.thanhToans.trangthai && existingDonHang.thanhToans.transId){
  //   const refundResult = await refundVnPay(req);
  //   return {...refundResult, trangthai: updatedDonHang.trangthai};
  // }
  // else{
    return {...updatedDonHang, trangthai: updatedDonHang.trangthai};
  // }
    // // Return updated order
    // return await prismaClient.donHang.findUnique({
    //   where: { ma: updatedDonHang.ma },
    //   include: {
    //     nguoiDung: {
    //       select: {
    //         ma: true,
    //         ho: true,
    //         ten: true,
    //         email: true,
    //         so_dien_thoai: true,
    //       },
    //     },
    //     khuyenMai: true,
    //     chiTietDonHangs: {
    //       include: {
    //         sanPham: {
    //           select: {
    //             ma: true,
    //             ten: true,
    //             hinhanh: true,
    //           },
    //         },
    //         bienThe: {
    //           include: {
    //             mauSac: true,
    //             kichCo: true,
    //           },
    //         },
    //       },
    //     },
    //     thanhToans: true,
    //   },
    // });
  });
}

// Update payment status
async function updateThanhToan(id, data) {
  const { phuongthuc, trangthai } = data;

  // Check if payment exists
  const existingThanhToan = await prisma.thanhToan.findUnique({
    where: { ma: Number(id) },
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
      ngaythanhtoan: trangthai ? new Date() : existingThanhToan.ngaythanhtoan,
    },
  });

  return updatedThanhToan;
}

// Create payment for an order
async function createThanhToan(data) {
  const { madh, phuongthuc, trangthai } = data;

  // Check if order exists
  const donHang = await prisma.donHang.findUnique({
    where: { ma: madh },
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
      madh: madh,
    },
  });

  return thanhToan;
}

module.exports = {
  getAllDonHang,
  getDonHangWithChiTietById,
  getDonHangByUserId,
  createDonHang,
  updateDonHangStatus,
  cancelDonHang,
  updateThanhToan,
  createThanhToan,
  getDonHangById,
};
