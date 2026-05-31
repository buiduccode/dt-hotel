const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomTypeController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');

// GET /api/room-types  – public
router.get('/', roomTypeController.getAllRoomTypes);

// GET /api/room-types/:roomtypes_id  – public
router.get('/:roomtypes_id', roomTypeController.getRoomTypeById);

// POST /api/room-types  – admin
router.post('/', authenticate, authorize(ROLES.ADMIN), roomTypeController.createRoomType);

// PUT /api/room-types/:roomtypes_id  – admin
router.put('/:roomtypes_id', authenticate, authorize(ROLES.ADMIN), roomTypeController.updateRoomType);

// DELETE /api/room-types/:roomtypes_id  – admin
router.delete('/:roomtypes_id', authenticate, authorize(ROLES.ADMIN), roomTypeController.deleteRoomType);

module.exports = router;