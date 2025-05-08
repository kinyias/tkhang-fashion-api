const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all products with pagination
async function getAllSanPham(page = 1, limit = 10, search = '', filters = {}) {
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
  if (filters.madanhmuc) {
    where.madanhmuc = Number(filters.madanhmuc);
  }
  
  if (filters.maloaisanpham) {
    where.maloaisanpham = Number(filters.maloaisanpham);
  }
  
  if (filters.mathuonghieu) {
    where.mathuonghieu = Number(filters.mathuonghieu);
  }
  
  if (filters.noibat !== undefined) {
    where.noibat = filters.noibat === 'true';
  }
  
  if (filters.trangthai !== undefined) {
    where.trangthai = filters.trangthai === 'true';
  }
  
  // Get products with pagination
  const [sanPhams, totalCount] = await Promise.all([
    prisma.sanPham.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        ma: 'desc'
      },
      include: {
        danhMuc: {
          select: {
            ma: true,
            ten: true
          }
        },
        loaiSanPham: {
          select: {
            ma: true,
            ten: true
          }
        },
        thuongHieu: {
          select: {
            ma: true,
            ten: true
          }
        },
        _count: {
          select: {
            danhGias: true
          }
        }
      }
    }),
    prisma.sanPham.count({ where })
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: sanPhams,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}

// Get product by ID
async function getSanPhamById(id) {
  const sanPham = await prisma.sanPham.findUnique({
    where: { ma: Number(id) },
    include: {
      danhMuc: {
        select: {
          ma: true,
          ten: true
        }
      },
      loaiSanPham: {
        select: {
          ma: true,
          ten: true
        }
      },
      thuongHieu: {
        select: {
          ma: true,
          ten: true
        }
      },
      bienThes: {
        include: {
          mauSac: true,
          kichCo: true
        }
      },
      _count: {
        select: {
          bienThes: true,
          danhGias: true
        }
      }
    }
  });
  
  if (!sanPham) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm');
  }
  
  // Get color images for each color
  const mauSacIds = sanPham.bienThes.map(bt => bt.mauSac.ma);
  const uniqueMauSacIds = [...new Set(mauSacIds)];
  
  const hinhAnhMauSacs = await prisma.hinhAnhMauSac.findMany({
    where: {
      mamausac: {
        in: uniqueMauSacIds
      }
    }
  });
  
  // Group images by color
  const hinhAnhTheoMau = {};
  hinhAnhMauSacs.forEach(hinh => {
    if (!hinhAnhTheoMau[hinh.mamausac]) {
      hinhAnhTheoMau[hinh.mamausac] = [];
    }
    hinhAnhTheoMau[hinh.mamausac].push(hinh);
  });
  
  // Add images to response
  const response = {
    ...sanPham,
    hinhAnhMauSacs: hinhAnhTheoMau
  };
  
  return response;
}

// Create new product with variants and color images
async function createSanPham(data) {
  const { 
    ten, 
    mota, 
    giaban, 
    giagiam, 
    hinhanh, 
    noibat, 
    trangthai, 
    madanhmuc, 
    maloaisanpham, 
    mathuonghieu,
    bienThes,
    mauSacs
  } = data;
  
  // Validate required relationships
  const [danhMuc, loaiSanPham, thuongHieu] = await Promise.all([
    prisma.danhMuc.findUnique({ where: { ma: Number(madanhmuc) } }),
    prisma.loaiSanPham.findUnique({ where: { ma: Number(maloaisanpham) } }),
    prisma.thuongHieu.findUnique({ where: { ma: Number(mathuonghieu) } })
  ]);
  
  if (!danhMuc) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }
  
  if (!loaiSanPham) {
    throw new ApiError(404, 'Không tìm thấy loại sản phẩm');
  }
  
  if (!thuongHieu) {
    throw new ApiError(404, 'Không tìm thấy thương hiệu');
  }
  
  // Check if product with the same name exists
  const existingSanPham = await prisma.sanPham.findFirst({
    where: { ten }
  });
  
  if (existingSanPham) {
    throw new ApiError(409, 'Sản phẩm với tên này đã tồn tại');
  }
  
  // Use transaction to create product, variants, and color images
  return await prisma.$transaction(async (prismaClient) => {
    // Create product
    const sanPham = await prismaClient.sanPham.create({
      data: {
        ten,
        mota,
        giaban: typeof giaban === 'string' ? parseFloat(giaban) : giaban,
        giagiam: giagiam ? (typeof giagiam === 'string' ? parseFloat(giagiam) : giagiam) : null,
        hinhanh,
        noibat: Boolean(noibat),
        trangthai: trangthai !== undefined ? Boolean(trangthai) : true,
        madanhmuc: Number(madanhmuc),
        maloaisanpham: Number(maloaisanpham),
        mathuonghieu: Number(mathuonghieu)
      }
    });
    
    // Process colors and their images
    if (mauSacs && mauSacs.length > 0) {
      for (const mauSacData of mauSacs) {
        
        // Create color images
        if (mauSacData.hinhAnhs && mauSacData.hinhAnhs.length > 0) {
          await Promise.all(
            mauSacData.hinhAnhs.map(hinhAnh => 
              prismaClient.hinhAnhMauSac.create({
                data: {
                  hinhAnh: hinhAnh.url,
                  anhChinh: hinhAnh.anhChinh || false,
                  mamausac: mauSac.ma
                }
              })
            )
          );
        }
      }
    }
    
    // Create variants
    if (bienThes && bienThes.length > 0) {
      await Promise.all(
        bienThes.map(bienThe => 
          prismaClient.bienThe.create({
            data: {
              gia: typeof bienThe.gia === 'string' ? parseFloat(bienThe.gia) : bienThe.gia,
              soluong: Number(bienThe.soluong),
              msp: sanPham.ma,
              mamausac: Number(bienThe.mamausac),
              makichco: Number(bienThe.makichco)
            }
          })
        )
      );
    }
    
    // Return created product with relationships
    return await prismaClient.sanPham.findUnique({
      where: { ma: sanPham.ma },
      // include: {
      //   danhMuc: {
      //     select: {
      //       ma: true,
      //       ten: true
      //     }
      //   },
      //   loaiSanPham: {
      //     select: {
      //       ma: true,
      //       ten: true
      //     }
      //   },
      //   thuongHieu: {
      //     select: {
      //       ma: true,
      //       ten: true
      //     }
      //   },
      //   bienThes: {
      //     include: {
      //       mauSac: true,
      //       kichCo: true
      //     }
      //   }
      // }
    });
  });
}

// Update product
async function updateSanPham(id, data) {
  const { 
    ten, 
    mota, 
    giaban, 
    giagiam, 
    hinhanh, 
    noibat, 
    trangthai, 
    madanhmuc, 
    maloaisanpham, 
    mathuonghieu,
    bienThes,
    mauSacs
  } = data;
  
  // Check if product exists
  const existingSanPham = await prisma.sanPham.findUnique({
    where: { ma: Number(id) },
    include: {
      bienThes: true
    }
  });
  
  if (!existingSanPham) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm');
  }
  
  // Validate relationships if changing
  if (madanhmuc) {
    const danhMuc = await prisma.danhMuc.findUnique({
      where: { ma: Number(madanhmuc) }
    });
    
    if (!danhMuc) {
      throw new ApiError(404, 'Không tìm thấy danh mục');
    }
  }
  
  if (maloaisanpham) {
    const loaiSanPham = await prisma.loaiSanPham.findUnique({
      where: { ma: Number(maloaisanpham) }
    });
    
    if (!loaiSanPham) {
      throw new ApiError(404, 'Không tìm thấy loại sản phẩm');
    }
  }
  
  if (mathuonghieu) {
    const thuongHieu = await prisma.thuongHieu.findUnique({
      where: { ma: Number(mathuonghieu) }
    });
    
    if (!thuongHieu) {
      throw new ApiError(404, 'Không tìm thấy thương hiệu');
    }
  }
  
  // Check if another product with the same name exists
  if (ten && ten !== existingSanPham.ten) {
    const duplicateName = await prisma.sanPham.findFirst({
      where: {
        ten,
        ma: { not: Number(id) }
      }
    });
    
    if (duplicateName) {
      throw new ApiError(409, 'Sản phẩm với tên này đã tồn tại');
    }
  }
  
  // Use transaction to update product, variants, and color images
  return await prisma.$transaction(async (prismaClient) => {
    // Update product
    const updatedSanPham = await prismaClient.sanPham.update({
      where: { ma: Number(id) },
      data: {
        ten,
        mota,
        giaban: giaban ? (typeof giaban === 'string' ? parseFloat(giaban) : giaban) : undefined,
        giagiam: giagiam ? (typeof giagiam === 'string' ? parseFloat(giagiam) : giagiam) : null,
        hinhanh,
        noibat: noibat !== undefined ? Boolean(noibat) : undefined,
        trangthai: trangthai !== undefined ? Boolean(trangthai) : undefined,
        madanhmuc: madanhmuc ? Number(madanhmuc) : undefined,
        maloaisanpham: maloaisanpham ? Number(maloaisanpham) : undefined,
        mathuonghieu: mathuonghieu ? Number(mathuonghieu) : undefined
      }
    });
    
    // Update variants if provided
    if (bienThes && Array.isArray(bienThes) && bienThes.length > 0) {
      // Get existing variants
      const existingBienThes = await prismaClient.bienThe.findMany({
        where: { msp: Number(id) }
      });
      
      // Identify variants to update, create, or delete
      const existingBienTheIds = existingBienThes.map(bt => bt.ma);
      const incomingBienTheIds = bienThes.filter(bt => bt.ma).map(bt => Number(bt.ma));
      
      // Variants to delete (exist in DB but not in incoming data)
      const bienTheIdsToDelete = existingBienTheIds.filter(btId => !incomingBienTheIds.includes(btId));
      
      // Delete variants that are no longer needed
      if (bienTheIdsToDelete.length > 0) {
        await prismaClient.bienThe.deleteMany({
          where: {
            ma: {
              in: bienTheIdsToDelete
            }
          }
        });
      }
      
      // Process each variant
      for (const bienThe of bienThes) {
        if (bienThe.ma) {
          // Update existing variant
          await prismaClient.bienThe.update({
            where: { ma: Number(bienThe.ma) },
            data: {
              gia: typeof bienThe.gia === 'string' ? parseFloat(bienThe.gia) : bienThe.gia,
              soluong: Number(bienThe.soluong),
              mamausac: Number(bienThe.mamausac),
              makichco: Number(bienThe.makichco)
            }
          });
        } else {
          // Create new variant
          await prismaClient.bienThe.create({
            data: {
              gia: typeof bienThe.gia === 'string' ? parseFloat(bienThe.gia) : bienThe.gia,
              soluong: Number(bienThe.soluong),
              msp: updatedSanPham.ma,
              mamausac: Number(bienThe.mamausac),
              makichco: Number(bienThe.makichco)
            }
          });
        }
      }
    }
    
    // Update color images if provided
    if (mauSacs && Array.isArray(mauSacs) && mauSacs.length > 0) {
      for (const mauSacData of mauSacs) {
        const mamausac = Number(mauSacData.ma);
        
        // Update color images
        if (mauSacData.hinhAnhs && Array.isArray(mauSacData.hinhAnhs) && mauSacData.hinhAnhs.length > 0) {
          // Delete existing images for this color
          await prismaClient.hinhAnhMauSac.deleteMany({
            where: { mamausac }
          });
          
          // Create new images
          await Promise.all(
            mauSacData.hinhAnhs.map(hinhAnh => 
              prismaClient.hinhAnhMauSac.create({
                data: {
                  hinhAnh: hinhAnh.url,
                  anhChinh: hinhAnh.anhChinh || false,
                  mamausac
                }
              })
            )
          );
        }
      }
    }
    
    // Return updated product with relationships
    return await prismaClient.sanPham.findUnique({
      where: { ma: updatedSanPham.ma },
      include: {
        danhMuc: {
          select: {
            ma: true,
            ten: true
          }
        },
        loaiSanPham: {
          select: {
            ma: true,
            ten: true
          }
        },
        thuongHieu: {
          select: {
            ma: true,
            ten: true
          }
        },
        bienThes: {
          include: {
            mauSac: true,
            kichCo: true
          }
        }
      }
    });
  });
}

// Delete product
async function deleteSanPham(id) {
  // Check if product exists
  const existingSanPham = await prisma.sanPham.findUnique({
    where: { ma: Number(id) },
    include: {
      _count: {
        select: {
          chiTietDonHangs: true,
          danhGias: true
        }
      }
    }
  });
  
  if (!existingSanPham) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm');
  }
  
  // Check if product has related order details or reviews
  if (existingSanPham._count.chiTietDonHangs > 0) {
    throw new ApiError(400, 'Không thể xóa sản phẩm đang có đơn hàng liên kết');
  }
  
  // Use transaction to delete product and related entities
  return await prisma.$transaction(async (prismaClient) => {
    // Get all variants
    const bienThes = await prismaClient.bienThe.findMany({
      where: { msp: Number(id) }
    });
    
    // Delete all variants
    if (bienThes.length > 0) {
      await prismaClient.bienThe.deleteMany({
        where: { msp: Number(id) }
      });
    }
    
    // Delete reviews if any
    if (existingSanPham._count.danhGias > 0) {
      await prismaClient.danhGia.deleteMany({
        where: { masp: Number(id) }
      });
    }
    
    // Delete product
    await prismaClient.sanPham.delete({
      where: { ma: Number(id) }
    });
    
    return { message: 'Xóa sản phẩm thành công' };
  });
}

module.exports = {
  getAllSanPham,
  getSanPhamById,
  createSanPham,
  updateSanPham,
  deleteSanPham
};