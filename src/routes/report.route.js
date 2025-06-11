const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

// Get dashboard stats (total revenue, customers, products, orders)
router.get('/dashboard-stats', reportController.getDashboardStats);

// Get monthly revenue for a year
router.get('/monthly-revenue', reportController.getMonthlyRevenue);

// Get customer stats
router.get('/customer-stats/:customerId', reportController.getCustomerStats);

module.exports = router;
