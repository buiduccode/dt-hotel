const { sql } = require('../config/db');

// Tạo thanh toán
const createPayment = async (req, res) => {
    try {
        const { booking_id, phuongThucThanhToan } = req.body;

        // Kiểm tra booking tồn tại
        const booking = await sql.query`
            SELECT * FROM Bookings WHERE booking_id = ${booking_id}
        `;
        if (booking.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy booking' });
        }
        if (booking.recordset[0].trangThai === 'CANCELLED') {
            return res.status(400).json({ message: 'Booking đã bị huỷ, không thể thanh toán' });
        }

        // Kiểm tra đã thanh toán chưa
        const existingPayment = await sql.query`
            SELECT * FROM Payments WHERE booking_id = ${booking_id} AND trangThai = 'SUCCESS'
        `;
        if (existingPayment.recordset.length > 0) {
            return res.status(400).json({ message: 'Booking này đã được thanh toán' });
        }

        // Tính số ngày lưu trú
        const { check_in, check_out } = booking.recordset[0];
        const soNgay = Math.ceil(
            (new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24)
        );

        // Tổng tiền phòng
        const roomCost = await sql.query`
            SELECT SUM(bd.gia) AS tongTienPhong
            FROM BookingDetails bd
            WHERE bd.booking_id = ${booking_id}
        `;

        // Tổng tiền dịch vụ
        const serviceCost = await sql.query`
            SELECT SUM(s.gia * su.soLuong) AS tongTienDichVu
            FROM ServiceUsages su
            JOIN Services s ON su.service_id = s.services_id
            WHERE su.booking_id = ${booking_id}
        `;

        const tongTienPhong = (roomCost.recordset[0].tongTienPhong || 0) * soNgay;
        const tongTienDichVu = serviceCost.recordset[0].tongTienDichVu || 0;
        const tongTien = tongTienPhong + tongTienDichVu;

        // Tạo bản ghi thanh toán
        const result = await sql.query`
            INSERT INTO Payments (tien, phuongThucThanhToan, trangThai, booking_id)
            OUTPUT INSERTED.pay_id
            VALUES (${tongTien}, ${phuongThucThanhToan}, 'SUCCESS', ${booking_id})
        `;

        // Cập nhật trạng thái booking → CONFIRMED (hoặc COMPLETED nếu đã check-in xong)
        await sql.query`
            UPDATE Bookings SET trangThai = 'CONFIRMED'
            WHERE booking_id = ${booking_id} AND trangThai = 'PENDING'
        `;

        res.status(201).json({
            message: 'Thanh toán thành công',
            pay_id: result.recordset[0].pay_id,
            tongTien,
            soNgay,
            tongTienPhong,
            tongTienDichVu
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy lịch sử thanh toán theo booking
const getPaymentByBooking = async (req, res) => {
    try {
        const { booking_id } = req.params;

        const result = await sql.query`
            SELECT p.pay_id, p.tien, p.phuongThucThanhToan, p.trangThai, p.pay_date,
                   b.check_in, b.check_out, u.fullname
            FROM Payments p
            JOIN Bookings b ON p.booking_id = b.booking_id
            JOIN Users u ON b.user_id = u.user_id
            WHERE p.booking_id = ${booking_id}
        `;

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy tất cả thanh toán (admin)
const getAllPayments = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT p.pay_id, p.tien, p.phuongThucThanhToan, p.trangThai, p.pay_date,
                   b.booking_id, u.fullname, u.email
            FROM Payments p
            JOIN Bookings b ON p.booking_id = b.booking_id
            JOIN Users u ON b.user_id = u.user_id
            ORDER BY p.pay_date DESC
        `;

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createPayment, getPaymentByBooking, getAllPayments };