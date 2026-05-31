const { sql } = require('../config/db');

// Tạo đánh giá
const createReview = async (req, res) => {
    try {
        const { user_id, room_id, xepHang, binhLuan } = req.body;

        if (xepHang < 1 || xepHang > 5) {
            return res.status(400).json({ message: 'Xếp hạng phải từ 1 đến 5' });
        }

        // Kiểm tra user đã từng ở phòng này chưa
        const stayCheck = await sql.query`
            SELECT b.booking_id FROM Bookings b
            JOIN BookingDetails bd ON b.booking_id = bd.booking_id
            WHERE b.user_id = ${user_id}
              AND bd.room_id = ${room_id}
              AND b.trangThai = 'COMPLETED'
        `;
        if (stayCheck.recordset.length === 0) {
            return res.status(403).json({
                message: 'Bạn chỉ có thể đánh giá phòng mà bạn đã từng ở'
            });
        }

        // Kiểm tra đã đánh giá chưa
        const existingReview = await sql.query`
            SELECT * FROM Reviews WHERE user_id = ${user_id} AND room_id = ${room_id}
        `;
        if (existingReview.recordset.length > 0) {
            return res.status(400).json({ message: 'Bạn đã đánh giá phòng này rồi' });
        }

        await sql.query`
            INSERT INTO Reviews (user_id, room_id, xepHang, binhLuan)
            VALUES (${user_id}, ${room_id}, ${xepHang}, ${binhLuan})
        `;

        res.status(201).json({ message: 'Đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy đánh giá theo phòng
const getReviewsByRoom = async (req, res) => {
    try {
        const { room_id } = req.params;

        const result = await sql.query`
            SELECT rv.review_id, u.fullname, rv.xepHang, rv.binhLuan
            FROM Reviews rv
            JOIN Users u ON rv.user_id = u.user_id
            WHERE rv.room_id = ${room_id}
            ORDER BY rv.review_id DESC
        `;

        const avgResult = await sql.query`
            SELECT AVG(CAST(xepHang AS FLOAT)) AS diemTrungBinh, COUNT(*) AS tongDanhGia
            FROM Reviews WHERE room_id = ${room_id}
        `;

        res.status(200).json({
            danhGia: result.recordset,
            diemTrungBinh: avgResult.recordset[0].diemTrungBinh,
            tongDanhGia: avgResult.recordset[0].tongDanhGia
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xoá đánh giá (admin)
const deleteReview = async (req, res) => {
    try {
        const { review_id } = req.params;

        const review = await sql.query`
            SELECT * FROM Reviews WHERE review_id = ${review_id}
        `;
        if (review.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
        }

        await sql.query`DELETE FROM Reviews WHERE review_id = ${review_id}`;

        res.status(200).json({ message: 'Đã xoá đánh giá' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createReview, getReviewsByRoom, deleteReview };