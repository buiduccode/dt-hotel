const { sql } = require('../config/db');

// Check-in: khách đến nhận phòng
const checkIn = async (req, res) => {
    try {
        const { booking_id } = req.params;

        const booking = await sql.query`
            SELECT * FROM Bookings WHERE booking_id = ${booking_id}
        `;
        if (booking.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy booking' });
        }

        const { trangThai } = booking.recordset[0];
        if (trangThai !== 'CONFIRMED') {
            return res.status(400).json({
                message: `Không thể check-in. Trạng thái hiện tại: ${trangThai}. Booking phải ở trạng thái CONFIRMED.`
            });
        }

        // Cập nhật trạng thái booking → OCCUPIED (dùng COMPLETED cho luồng check-in)
        // Đổi trạng thái phòng → OCCUPIED
        await sql.query`
            UPDATE Rooms SET trangthai = 'OCCUPIED'
            WHERE room_id IN (
                SELECT room_id FROM BookingDetails WHERE booking_id = ${booking_id}
            )
        `;

        res.status(200).json({ message: `Check-in thành công cho booking #${booking_id}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Check-out: khách trả phòng
const checkOut = async (req, res) => {
    try {
        const { booking_id } = req.params;

        const booking = await sql.query`
            SELECT * FROM Bookings WHERE booking_id = ${booking_id}
        `;
        if (booking.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy booking' });
        }

        const { trangThai, check_in, check_out, user_id } = booking.recordset[0];

        if (trangThai === 'COMPLETED') {
            return res.status(400).json({ message: 'Booking đã được check-out trước đó' });
        }

        // Tính số ngày lưu trú
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);
        const soNgay = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        // Tính tổng tiền phòng
        const roomCost = await sql.query`
            SELECT SUM(bd.gia) AS tongTienPhong
            FROM BookingDetails bd
            WHERE bd.booking_id = ${booking_id}
        `;

        // Tính tổng tiền dịch vụ
        const serviceCost = await sql.query`
            SELECT SUM(s.gia * su.soLuong) AS tongTienDichVu
            FROM ServiceUsages su
            JOIN Services s ON su.service_id = s.services_id
            WHERE su.booking_id = ${booking_id}
        `;

        const tongTienPhong = (roomCost.recordset[0].tongTienPhong || 0) * soNgay;
        const tongTienDichVu = serviceCost.recordset[0].tongTienDichVu || 0;
        const tongTien = tongTienPhong + tongTienDichVu;

        // Cập nhật trạng thái booking và phòng
        await sql.query`
            UPDATE Bookings SET trangThai = 'COMPLETED' WHERE booking_id = ${booking_id}
        `;
        await sql.query`
            UPDATE Rooms SET trangthai = 'AVAILABLE'
            WHERE room_id IN (
                SELECT room_id FROM BookingDetails WHERE booking_id = ${booking_id}
            )
        `;

        res.status(200).json({
            message: `Check-out thành công cho booking #${booking_id}`,
            soNgayLuuTru: soNgay,
            tongTienPhong,
            tongTienDichVu,
            tongTien
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { checkIn, checkOut };