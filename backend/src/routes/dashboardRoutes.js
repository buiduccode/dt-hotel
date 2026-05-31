const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');

const adminOnly = [authenticate, authorize(ROLES.ADMIN)];
const adminStaff = [authenticate, authorize(ROLES.ADMIN, ROLES.STAFF)];

// GET /api/dashboard/overview
router.get('/overview', ...adminStaff, dashboardController.getOverview);

// GET /api/dashboard/revenue/day?date=YYYY-MM-DD
router.get('/revenue/day', ...adminStaff, dashboardController.getRevenueByDay);

// GET /api/dashboard/revenue/month?year=2025
router.get('/revenue/month', ...adminStaff, dashboardController.getRevenueByMonth);

// GET /api/dashboard/revenue/year
router.get('/revenue/year', ...adminStaff, dashboardController.getRevenueByYear);

// GET /api/dashboard/rooms/usage
router.get('/rooms/usage', ...adminStaff, dashboardController.getRoomUsageRate);

module.exports = router;