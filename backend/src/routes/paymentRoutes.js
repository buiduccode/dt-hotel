const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');
const response = require('../utils/responseHandler');

// POST /api/payments  – tạo thanh toán
router.post('/', authenticate, async (req, res) => {
    try {
        const data = await paymentService.createPayment(req.body);
        return response.created(res, data, 'Thanh toán thành công');
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// GET /api/payments  – admin xem tất cả
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), async (req, res) => {
    try {
        const data = await paymentService.getAllPayments();
        return response.success(res, data);
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// GET /api/payments/booking/:booking_id
router.get('/booking/:booking_id', authenticate, async (req, res) => {
    try {
        const data = await paymentService.getPaymentByBooking(req.params.booking_id);
        return response.success(res, data);
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

module.exports = router;