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
      revenueByMonth[month] += Number(item._sum.tonggia);
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
        // noibat: true,
        trangthai: true, // Only active products
      },
      select: {
        ma: true,
        ten: true,
        giaban: true,
        giagiam: true,
        hinhanh: true,
        bienThes: {
          select: {
            chiTietDonHangs: {
              where: {
                donHang: {
                  trangthai: 'da_giao_hang',
                },
              },
              select: {
                soluong: true,
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
      // orderBy: {
      //   bienThes: {
      //     chiTietDonHangs: {
      //       _count: 'desc',
      //     },
      //   }
      // },
      take: limit,
    });

    const transformed = featuredProducts.map((product) => {
      const totalSales = product.bienThes.reduce((total, bienThe) => {
        return (
          total +
          bienThe.chiTietDonHangs.reduce((sum, ct) => sum + ct.soluong, 0)
        );
      }, 0);

      return {
        ...product,
        totalSales,
      };
    });

    return transformed
      .sort((a, b) => b.totalSales - a.totalSales)
      .map(({ bienThes, ...rest }) => rest);
    // Transform the response to include total sales
    // return featuredProducts.map((product) => ({
    //   ...product,
    //   totalSales: product._count.bienThes,
    //   _count: undefined, // Remove the _count field from response
    // }));
  }

  // Get revenue by custom date range
  async getRevenueByDateRange(startDate, endDate) {
    const revenue = await prisma.donHang.aggregate({
      where: {
        trangthai: 'da_giao_hang',
        ngaydat: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _sum: {
        tonggia: true,
      },
    });

    return revenue._sum.tonggia || 0;
  }

  // Get revenue by year
  async getRevenueByYear(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    return this.getRevenueByDateRange(startDate, endDate);
  }

  // Get revenue by month
  async getRevenueByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return this.getRevenueByDateRange(startDate, endDate);
  }

  // Get revenue by week
  async getRevenueByWeek(startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59);
    return this.getRevenueByDateRange(start, end);
  }

  // Get detailed revenue report by date range
  async getDetailedRevenueReport(startDate, endDate, groupBy = 'day') {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let grouping;
    if (groupBy === 'month') {
      grouping = {
        year: { month: { ngaydat: true } },
      };
    } else if (groupBy === 'week') {
      grouping = {
        year: { week: { ngaydat: true } },
      };
    } else {
      // default to daily
      grouping = {
        ngaydat: true,
      };
    }

    const revenue = await prisma.donHang.groupBy({
      by: ['ngaydat'],
      where: {
        trangthai: 'da_giao_hang',
        ngaydat: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        tonggia: true,
      },
      orderBy: {
        ngaydat: 'asc',
      },
    });

    return revenue.map((item) => ({
      date: item.ngaydat,
      revenue: Number(item._sum.tonggia) || 0,
    }));
  }

  // Get orders count by status
  async getOrdersByStatus() {
    const orderStatuses = [
      'da_dat',
      'dang_xu_ly',
      'da_huy',
      'dang_giao_hang',
      'da_giao_hang',
    ];

    const ordersByStatus = await Promise.all(
      orderStatuses.map(async (status) => {
        const count = await prisma.donHang.count({
          where: {
            trangthai: status,
          },
        });

        return {
          status,
          count,
        };
      })
    );

    return ordersByStatus;
  }
}

module.exports = new ReportService();
