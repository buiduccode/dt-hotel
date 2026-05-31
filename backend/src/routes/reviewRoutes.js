const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');

// POST /api/reviews  – customer tạo đánh giá
router.post('/', authenticate, authorize(ROLES.CUSTOMER), reviewController.createReview);

// GET /api/reviews/room/:room_id  – public, xem đánh giá của phòng
router.get('/room/:room_id', reviewController.getReviewsByRoom);

// DELETE /api/reviews/:review_id  – admin xoá đánh giá
router.delete('/:review_id', authenticate, authorize(ROLES.ADMIN), reviewController.deleteReview);

module.exports = router;