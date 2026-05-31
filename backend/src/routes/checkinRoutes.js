const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');

// POST /api/checkin/:booking_id  – staff/admin thực hiện check-in
router.post('/:booking_id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), checkinController.checkIn);

// POST /api/checkin/:booking_id/checkout  – staff/admin thực hiện check-out
router.post('/:booking_id/checkout', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), checkinController.checkOut);

module.exports = router;