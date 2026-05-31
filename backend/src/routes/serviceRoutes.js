const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');

// GET /api/services  – public
router.get('/', serviceController.getAllServices);

// POST /api/services  – admin
router.post('/', authenticate, authorize(ROLES.ADMIN), serviceController.createService);

// PUT /api/services/:services_id  – admin
router.put('/:services_id', authenticate, authorize(ROLES.ADMIN), serviceController.updateService);

// DELETE /api/services/:services_id  – admin
router.delete('/:services_id', authenticate, authorize(ROLES.ADMIN), serviceController.deleteService);

// POST /api/services/booking  – thêm dịch vụ vào booking
router.post('/booking', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER), serviceController.addServiceToBooking);

// GET /api/services/booking/:booking_id  – xem dịch vụ đã dùng
router.get('/booking/:booking_id', authenticate, serviceController.getServicesByBooking);

module.exports = router;