const prisma = require('../lib/prisma');

class ReportService {
  // Get total revenue, customers, products, and orders
  async getDashboardStats() {
    const [totalRevenue, totalCustomers, totalProducts, totalOrders] =
      await Promise.all([
        // Get total revenue from completed orders
        prisma.donHang.aggregate({
          where: {
            trangthai: 'da_giao_hang',
          },
          _sum: {
            tonggia: true,
          },
        }),
        // Get total customers (users)
        prisma.nguoiDung.count(),
        // Get total products
        prisma.sanPham.count(),
        // Get total orders
        prisma.donHang.count(),
      ]);

    return {
      totalRevenue: totalRevenue._sum.tonggia || 0,
      totalCustomers,
      totalProducts,
      totalOrders,
    };
  }

  // Get revenue by month for a specific year
  async getMonthlyRevenue(year) {
    const monthlyRevenue = await prisma.donHang.groupBy({
      by: ['ngaydat'],
      where: {
        trangthai: 'da_giao_hang',
        ngaydat: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      _sum: {
        tonggia: true,
      },
    });

    // Initialize array with 12 months
    const revenueByMonth = Array(12).fill(0);

    // Fill in the revenue for months that have data
    monthlyRevenue.forEach((item) => {
      const month = new Date(item.ngaydat).getMonth();
      revenueByMonth[month] = Number(item._sum.tonggia);
    });

    return revenueByMonth;
  }

  // Get customer stats (total orders and spending)
  async getCustomerStats(customerId) {
    const [totalOrders, totalSpending, totalGoing] = await Promise.all([
      // Get total orders for customer
      prisma.donHang.count({
        where: {
          manguoidung: customerId,
        },
      }),
      // Get total spending for customer
      prisma.donHang.aggregate({
        where: {
          manguoidung: customerId,
          trangthai: 'da_giao_hang',
        },
        _sum: {
          tonggia: true,
        },
      }),
      // Get total going orders for customer
      prisma.donHang.count({
        where: {
          manguoidung: customerId,
          trangthai: 'dang_giao_hang',
        },
      }),
    ]);
    return {
      totalOrders,
      totalSpending: totalSpending._sum.tonggia || 0,
      totalGoing,
    };
  }

  // Get featured products with sales count
  async getFeaturedProducts(limit = 5) {
    const featuredProducts = await prisma.sanPham.findMany({
      where: {
        noibat: true,
        trangthai: true, // Only active products
      },
      select: {
        ma: true,
        ten: true,
        giaban: true,
        giagiam: true,
        hinhanh: true,
        _count: {
          select: {
            chiTietDonHangs: {
              where: {
                donHang: {
                  trangthai: 'da_giao_hang', // Only count completed orders
                },
              },
            },
          },
        },
        danhMuc: {
          select: {
            ma: true,
            ten: true,
          },
        },
        thuongHieu: {
          select: {
            ma: true,
            ten: true,
          },
        },
      },
      orderBy: {
        chiTietDonHangs: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    // Transform the response to include total sales
    return featuredProducts.map((product) => ({
      ...product,
      totalSales: product._count.chiTietDonHangs,
      _count: undefined, // Remove the _count field from response
    }));
  }
}

module.exports = new ReportService();
