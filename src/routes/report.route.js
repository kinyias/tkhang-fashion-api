const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

// Get dashboard stats (total revenue, customers, products, orders)
router.get('/dashboard-stats', reportController.getDashboardStats);

// Get monthly revenue for a year
router.get('/monthly-revenue', reportController.getMonthlyRevenue);

// Get customer stats
router.get('/customer-stats/:customerId', reportController.getCustomerStats);

// Get featured products with sales count
router.get('/featured-products', reportController.getFeaturedProducts);

// New revenue reporting routes
router.get('/revenue/year', reportController.getRevenueByYear);
router.get('/revenue/month', reportController.getRevenueByMonth);
router.get('/revenue/week', reportController.getRevenueByWeek);
router.get('/revenue/report', reportController.getDetailedRevenueReport);

// Get orders count by status
router.get('/orders-by-status', reportController.getOrdersByStatus);

module.exports = router;
