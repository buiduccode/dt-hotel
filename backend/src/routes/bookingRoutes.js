const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');
const response = require('../utils/responseHandler');

// POST /api/bookings  – customer đặt phòng
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER), async (req, res) => {
    try {
        const data = await bookingService.createBooking(req.body);
        return response.created(res, data, 'Đặt phòng thành công');
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// GET /api/bookings  – admin/staff xem tất cả
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), async (req, res) => {
    try {
        const data = await bookingService.getAllBookings();
        return response.success(res, data);
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// GET /api/bookings/my  – customer xem lịch sử của mình
router.get('/my', authenticate, async (req, res) => {
    try {
        const data = await bookingService.getBookingsByUser(req.user.user_id);
        return response.success(res, data);
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// GET /api/bookings/user/:user_id  – admin xem theo user
router.get('/user/:user_id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), async (req, res) => {
    try {
        const data = await bookingService.getBookingsByUser(req.params.user_id);
        return response.success(res, data);
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// GET /api/bookings/:booking_id
router.get('/:booking_id', authenticate, async (req, res) => {
    try {
        const data = await bookingService.getBookingDetail(req.params.booking_id);
        return response.success(res, data);
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// PATCH /api/bookings/:booking_id/status  – admin/staff cập nhật trạng thái
router.patch('/:booking_id/status', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), async (req, res) => {
    try {
        await bookingService.updateStatus(req.params.booking_id, req.body.trangThai);
        return response.success(res, null, 'Cập nhật trạng thái thành công');
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// DELETE /api/bookings/:booking_id/cancel  – customer huỷ booking
router.delete('/:booking_id/cancel', authenticate, async (req, res) => {
    try {
        await bookingService.cancelBooking(req.params.booking_id, req.user.user_id);
        return response.success(res, null, 'Huỷ đặt phòng thành công');
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

module.exports = router;