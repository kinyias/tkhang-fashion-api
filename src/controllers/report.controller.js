const reportService = require('../services/report.service');

// Get dashboard stats
async function getDashboardStats(req, res) {
  try {
    const stats = await reportService.getDashboardStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get monthly revenue
async function getMonthlyRevenue(req, res) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const monthlyRevenue = await reportService.getMonthlyRevenue(year);
    return res.status(200).json(monthlyRevenue);
  } catch (error) {
    console.error('Error getting monthly revenue:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get customer stats
async function getCustomerStats(req, res) {
  try {
    const customerId = parseInt(req.params.customerId);
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const stats = await reportService.getCustomerStats(customerId);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting customer stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get featured products with sales count
async function getFeaturedProducts(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const products = await reportService.getFeaturedProducts(limit);
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error getting featured products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get revenue by year
async function getRevenueByYear(req, res) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const revenue = await reportService.getRevenueByYear(year);
    return res.status(200).json({ revenue });
  } catch (error) {
    console.error('Error getting yearly revenue:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get revenue by month
async function getRevenueByMonth(req, res) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const revenue = await reportService.getRevenueByMonth(year, month);
    return res.status(200).json({ revenue });
  } catch (error) {
    console.error('Error getting monthly revenue:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get revenue by week
async function getRevenueByWeek(req, res) {
  try {
    const startDate =
      req.query.startDate || new Date().toISOString().split('T')[0];
    const revenue = await reportService.getRevenueByWeek(startDate);
    return res.status(200).json({ revenue });
  } catch (error) {
    console.error('Error getting weekly revenue:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get detailed revenue report
async function getDetailedRevenueReport(req, res) {
  try {
    const { startDate, endDate, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'Start date and end date are required' });
    }

    const report = await reportService.getDetailedRevenueReport(
      startDate,
      endDate,
      groupBy
    );
    return res.status(200).json(report);
  } catch (error) {
    console.error('Error getting revenue report:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getDashboardStats,
  getMonthlyRevenue,
  getCustomerStats,
  getFeaturedProducts,
  getRevenueByYear,
  getRevenueByMonth,
  getRevenueByWeek,
  getDetailedRevenueReport,
};
