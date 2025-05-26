const prisma = require('../lib/prisma');
const ApiError = require('../lib/ApiError');

// Get all products with pagination
async function getAllSanPham(page = 1, limit = 10, search = '', filters = {}, sortBy = 'ma', sortOrder = 'desc') {
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
  
  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'ten', 'giaban', 'giangiam'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';
  
  // Validate sortOrder
  const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
  orderBy[validSortField] = validSortOrder;
  
  // Get products with pagination
  const [sanPhams, totalCount] = await Promise.all([
    prisma.sanPham.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
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
      },
      masp: sanPham.ma
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
      await prismaClient.hinhAnhMauSac.createMany({
        data: mauSacs.map((item) => ({
          hinhAnh: item.hinhAnh,
          anhChinh: item.anhChinh || false,
          mamausac: item.mamausac,
          masp: sanPham.ma
        })),
        skipDuplicates: true,
      });
    }
    
    // Create variants
    if (bienThes && bienThes.length > 0) {
      await prismaClient.bienThe.createMany({
        data: bienThes.map((bienThe) => ({
          gia: typeof bienThe.gia === 'string' ? parseFloat(bienThe.gia) : bienThe.gia,
          soluong: Number(bienThe.soluong),
          masp: sanPham.ma,
          mamausac: Number(bienThe.mamausac),
          makichco: Number(bienThe.makichco)
        })),
        skipDuplicates: true,
      });
    }
    
    // Return created product with relationships
    return await prismaClient.sanPham.findUnique({
      where: { ma: sanPham.ma }
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
    where: { ma: Number(id) }
  });
  
  if (!existingSanPham) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm');
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
async function getAllSanPhamWithVariants(page = 1, limit = 10, search = '', filters = {}, sortBy = 'ma', sortOrder = 'desc') {
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
  
  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'ten', 'giaban', 'giagiam'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';
  
  // Validate sortOrder
  const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
  orderBy[validSortField] = validSortOrder;
  
  // Get products with pagination and include variants, colors, sizes and ratings
  const [sanPhams, totalCount] = await Promise.all([
    prisma.sanPham.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
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

// Advanced product search with comprehensive filtering
async function advancedSearchSanPham(page = 1, limit = 10, filters = {}, sortBy = 'ma', sortOrder = 'desc') {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  
  // Text search
  if (filters.search) {
    where.ten = {
      contains: filters.search,
      mode: 'insensitive'
    };
  }
  
  // Category filters (multiple)
  if (filters.madanhmuc && filters.madanhmuc.length > 0) {
    const categoryIds = filters.madanhmuc.map(id => Number(id));
    where.madanhmuc = {
      in: categoryIds
    };
  }
  
  // Sub-category filters (multiple)
  if (filters.maloaisanpham && filters.maloaisanpham.length > 0) {
    const subCategoryIds = filters.maloaisanpham.map(id => Number(id));
    where.maloaisanpham = {
      in: subCategoryIds
    };
  }
  
  // Brand filters (multiple)
  if (filters.mathuonghieu && filters.mathuonghieu.length > 0) {
    const brandIds = filters.mathuonghieu.map(id => Number(id));
    where.mathuonghieu = {
      in: brandIds
    };
  }
  
  // Price range filter
  if (filters.minPrice || filters.maxPrice) {
    where.giaban = {};
    
    if (filters.minPrice) {
      where.giaban.gte = parseFloat(filters.minPrice);
    }
    
    if (filters.maxPrice) {
      where.giaban.lte = parseFloat(filters.maxPrice);
    }
  }
  
  // Featured products filter
  if (filters.noibat !== undefined) {
    where.noibat = filters.noibat === 'true';
  }
  
  // Status filter
  if (filters.trangthai !== undefined) {
    where.trangthai = filters.trangthai === 'true';
  }
  
  // Color filter - requires joining with BienThe
  let colorFilter = {};
  if (filters.mamausac && filters.mamausac.length > 0) {
    const colorIds = filters.mamausac.map(id => Number(id));
    colorFilter = {
      some: {
        mamausac: {
          in: colorIds
        }
      }
    };
  }
  
  // Size filter - requires joining with BienThe
  let sizeFilter = {};
  if (filters.makichco && filters.makichco.length > 0) {
    const sizeIds = filters.makichco.map(id => Number(id));
    sizeFilter = {
      some: {
        makichco: {
          in: sizeIds
        }
      }
    };
  }
  
  // Apply color and size filters if they exist
  if (Object.keys(colorFilter).length > 0 || Object.keys(sizeFilter).length > 0) {
    where.bienThes = {};
    
    if (Object.keys(colorFilter).length > 0) {
      where.bienThes = colorFilter;
    }
    
    if (Object.keys(sizeFilter).length > 0) {
      where.bienThes = { ...where.bienThes, ...sizeFilter };
    }
  }
  
  // Build sort options
  const orderBy = {};
  // Validate sortBy field to prevent injection
  const validSortFields = ['ma', 'ten', 'giaban', 'giagiam'];
  const validSortField = validSortFields.includes(sortBy) ? sortBy : 'ma';
  
  // Validate sortOrder
  const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
  orderBy[validSortField] = validSortOrder;
  
  // Get products with pagination and include variants, colors, sizes
  const [sanPhams, totalCount] = await Promise.all([
    prisma.sanPham.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
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
          where: {
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
  getAllSanPhamWithVariants,
  advancedSearchSanPham 
};
