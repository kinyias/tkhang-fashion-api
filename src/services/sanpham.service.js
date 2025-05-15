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
        await prismaClient.hinhAnhMauSac.create({
          data: {
            hinhAnh: mauSacData.hinhAnh,
            anhChinh: mauSacData.anhChinh || false,
            mamausac: mauSacData.mamausac,
            masp: sanPham.ma
          }
        });

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
              masp: sanPham.ma,
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
        where: { masp: Number(id) }
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
        if (bienThe.ma !=0) {
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
              masp: updatedSanPham.ma,
              mamausac: Number(bienThe.mamausac),
              makichco: Number(bienThe.makichco)
            }
          });
        }
      }
    }
    
    // Update color images if provided
    if (mauSacs && mauSacs.length > 0) {
      const existingMauSacs = await prismaClient.hinhAnhMauSac.findMany({
        where: { masp: Number(id) }
      });
      // Identify to update, create, or delete
      const existingMauSacIds = existingMauSacs.map(bt => bt.ma);
      const incomingMauSacIds = mauSacs.filter(bt => bt.ma).map(bt => Number(bt.ma));
      
      // To delete (exist in DB but not in incoming data)
      const mauSacIdsToDelete = existingMauSacIds.filter(btId => !incomingMauSacIds.includes(btId));
      // Delete variants that are no longer needed
      if (mauSacIdsToDelete.length > 0) {
        await prismaClient.hinhAnhMauSac.deleteMany({
          where: {
            ma: {
              in: mauSacIdsToDelete
            }
          }
        });
      }
      for (const mauSac of mauSacs) {
        if (mauSac.ma !=0) {
          // Update existing variant
          await prismaClient.hinhAnhMauSac.update({
            where: { ma: Number(mauSac.ma) },
            data: {
            hinhAnh: mauSac.hinhAnh,
            anhChinh: mauSac.anhChinh || false,
            mamausac: mauSac.mamausac,
            masp: updatedSanPham.ma
            }
          });
        } else {
          // Create new variant
          await prismaClient.hinhAnhMauSac.create({
            data: {
              hinhAnh: mauSac.hinhAnh,
              anhChinh: mauSac.anhChinh || false,
              mamausac: mauSac.mamausac,
              masp: updatedSanPham.ma
            }
          });
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
    
    // Delete product
    await prismaClient.sanPham.delete({
      where: { ma: Number(id) }
    });
    
    return { message: 'Xóa sản phẩm thành công' };
  });
}

// Delete multiple products
async function deleteManySanPham(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Danh sách ID không hợp lệ');
  }
  
  // Convert all ids to numbers
  const productIds = ids.map(id => Number(id));
  
  // Check if all products exist and can be deleted
  const products = await prisma.sanPham.findMany({
    where: {
      ma: {
        in: productIds
      }
    },
    include: {
      _count: {
        select: {
          chiTietDonHangs: true,
          danhGias: true
        }
      }
    }
  });
  
  // Check if all requested products were found
  if (products.length !== productIds.length) {
    throw new ApiError(404, 'Một hoặc nhiều sản phẩm không tồn tại');
  }
  
  // Check if any product has related orders
  const withOrders = products.filter(p => p._count.chiTietDonHangs > 0);
  if (withOrders.length > 0) {
    const productNames = withOrders.map(p => p.ten).join(', ');
    throw new ApiError(400, `Không thể xóa sản phẩm đang có đơn hàng liên kết: ${productNames}`);
  }
  
  // Use transaction to delete products and related entities
  return await prisma.$transaction(async (prismaClient) => {
    // Delete the products
    await prismaClient.sanPham.deleteMany({
      where: {
        ma: {
          in: productIds
        }
      }
    });
    
    return { 
      message: `Đã xóa ${productIds.length} sản phẩm thành công`
    };
  });
}

// Get all products with variants, colors and sizes
async function getAllSanPhamWithVariants(page = 1, limit = 10, search = '', filters = {}) {
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
  
  // Get products with pagination and include variants, colors, sizes and ratings
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
        bienThes: {
          include: {
            mauSac: true,
            kichCo: true
          }
        },
        hinhAnhMauSacs: {
          where:{
            anhChinh: true
          }
        },
        danhGias: {
          select: {
            sosao: true
          }
        }
      }
    }),
    prisma.sanPham.count({ where })
  ]);

  // Calculate average rating for each product
  const sanPhamsWithRating = sanPhams.map(sanPham => {
    const totalStars = sanPham.danhGias.reduce((sum, review) => sum + review.sosao, 0);
    const averageRating = sanPham.danhGias.length > 0 
      ? Math.min(5, Math.max(0, totalStars / sanPham.danhGias.length))
      : 0;

    // Remove the detailed reviews array and add the average
    const { danhGias, ...sanPhamWithoutReviews } = sanPham;
    return {
      ...sanPhamWithoutReviews,
      danhGia_trungbinh: Number(averageRating.toFixed(1))
    };
  });
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  console.log(sanPhamsWithRating)
  return {
    data: sanPhamsWithRating,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: totalCount,
      totalPages
    }
  };
}
module.exports = {
  getAllSanPham,
  getSanPhamById,
  createSanPham,
  updateSanPham,
  deleteSanPham,
  deleteManySanPham,
  getAllSanPhamWithVariants
};
