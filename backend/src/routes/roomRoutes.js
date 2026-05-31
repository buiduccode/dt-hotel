const express = require('express');
const router = express.Router();
const roomService = require('../services/roomService');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');
const response = require('../utils/responseHandler');

// GET /api/rooms?trangthai=AVAILABLE&roomtypes_id=1  – public
router.get('/', async (req, res) => {
    try {
        const data = await roomService.getAllRooms(req.query);
        return response.success(res, data);
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// GET /api/rooms/:room_id  – public
router.get('/:room_id', async (req, res) => {
    try {
        const data = await roomService.getRoomById(req.params.room_id);
        return response.success(res, data);
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// POST /api/rooms  – admin
router.post('/', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
    try {
        await roomService.createRoom(req.body);
        return response.created(res, null, 'Thêm phòng thành công');
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// PUT /api/rooms/:room_id  – admin
router.put('/:room_id', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
    try {
        await roomService.updateRoom(req.params.room_id, req.body);
        return response.success(res, null, 'Cập nhật phòng thành công');
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

// DELETE /api/rooms/:room_id  – admin
router.delete('/:room_id', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
    try {
        await roomService.deleteRoom(req.params.room_id);
        return response.success(res, null, 'Xoá phòng thành công');
    } catch (err) {
        return response.error(res, err.message, err.statusCode || 500, err);
    }
});

module.exports = router;