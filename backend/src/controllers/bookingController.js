const { sql } = require('../config/db');

// Tạo booking mới
const createBooking = async (req, res) => {
    try {
        const { user_id, check_in, check_out, room_ids } = req.body;

        if (!room_ids || room_ids.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 phòng' });
        }

        // Kiểm tra phòng còn trống không
        for (const room_id of room_ids) {
            const roomCheck = await sql.query`
                SELECT trangthai FROM Rooms WHERE room_id = ${room_id}
            `;
            if (roomCheck.recordset.length === 0) {
                return res.status(404).json({ message: `Phòng ID ${room_id} không tồn tại` });
            }
            if (roomCheck.recordset[0].trangthai !== 'AVAILABLE') {
                return res.status(400).json({ message: `Phòng ID ${room_id} hiện không còn trống` });
            }
        }

        // Tạo booking
        const bookingResult = await sql.query`
            INSERT INTO Bookings (user_id, check_in, check_out, trangThai)
            OUTPUT INSERTED.booking_id
            VALUES (${user_id}, ${check_in}, ${check_out}, 'PENDING')
        `;
        const booking_id = bookingResult.recordset[0].booking_id;

        // Thêm booking details & cập nhật trạng thái phòng
        for (const room_id of room_ids) {
            const roomType = await sql.query`
                SELECT rt.gia FROM Rooms r
                JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
                WHERE r.room_id = ${room_id}
            `;
            const gia = roomType.recordset[0].gia;

            await sql.query`
                INSERT INTO BookingDetails (booking_id, room_id, gia)
                VALUES (${booking_id}, ${room_id}, ${gia})
            `;

            await sql.query`
                UPDATE Rooms SET trangthai = 'BOOKED' WHERE room_id = ${room_id}
            `;
        }

        res.status(201).json({ message: 'Đặt phòng thành công', booking_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy tất cả bookings (admin/staff)
const getAllBookings = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT b.booking_id, u.fullname, u.email, u.phone,
                   b.check_in, b.check_out, b.trangThai, b.created_at
            FROM Bookings b
            JOIN Users u ON b.user_id = u.user_id
            ORDER BY b.created_at DESC
        `;
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy booking theo user_id (customer xem lịch sử)
const getBookingsByUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const result = await sql.query`
            SELECT b.booking_id, b.check_in, b.check_out, b.trangThai, b.created_at,
                   bd.room_id, r.room_number, rt.room_name, bd.gia
            FROM Bookings b
            JOIN BookingDetails bd ON b.booking_id = bd.booking_id
            JOIN Rooms r ON bd.room_id = r.room_id
            JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
            WHERE b.user_id = ${user_id}
            ORDER BY b.created_at DESC
        `;
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết 1 booking
const getBookingById = async (req, res) => {
    try {
        const { booking_id } = req.params;

        const booking = await sql.query`
            SELECT b.booking_id, u.fullname, u.email, u.phone,
                   b.check_in, b.check_out, b.trangThai, b.created_at
            FROM Bookings b
            JOIN Users u ON b.user_id = u.user_id
            WHERE b.booking_id = ${booking_id}
        `;
        if (booking.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy booking' });
        }

        const details = await sql.query`
            SELECT bd.bookingDetails_id, r.room_number, rt.room_name, bd.gia
            FROM BookingDetails bd
            JOIN Rooms r ON bd.room_id = r.room_id
            JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
            WHERE bd.booking_id = ${booking_id}
        `;

        const services = await sql.query`
            SELECT s.name_services, s.gia, su.soLuong, (s.gia * su.soLuong) AS thanhtien
            FROM ServiceUsages su
            JOIN Services s ON su.service_id = s.services_id
            WHERE su.booking_id = ${booking_id}
        `;

        res.status(200).json({
            booking: booking.recordset[0],
            rooms: details.recordset,
            services: services.recordset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật trạng thái booking (admin/staff)
const updateBookingStatus = async (req, res) => {
    try {
        const { booking_id } = req.params;
        const { trangThai } = req.body;

        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
        if (!validStatuses.includes(trangThai)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        const booking = await sql.query`
            SELECT * FROM Bookings WHERE booking_id = ${booking_id}
        `;
        if (booking.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy booking' });
        }

        await sql.query`
            UPDATE Bookings SET trangThai = ${trangThai} WHERE booking_id = ${booking_id}
        `;

        // Nếu huỷ → trả phòng về AVAILABLE
        if (trangThai === 'CANCELLED') {
            await sql.query`
                UPDATE Rooms SET trangthai = 'AVAILABLE'
                WHERE room_id IN (
                    SELECT room_id FROM BookingDetails WHERE booking_id = ${booking_id}
                )
            `;
        }

        res.status(200).json({ message: `Cập nhật trạng thái thành ${trangThai} thành công` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Huỷ booking (customer tự huỷ)
const cancelBooking = async (req, res) => {
    try {
        const { booking_id } = req.params;
        const { user_id } = req.body;

        const booking = await sql.query`
            SELECT * FROM Bookings WHERE booking_id = ${booking_id} AND user_id = ${user_id}
        `;
        if (booking.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy booking hoặc không có quyền huỷ' });
        }
        if (booking.recordset[0].trangThai === 'CANCELLED') {
            return res.status(400).json({ message: 'Booking đã được huỷ trước đó' });
        }

        await sql.query`
            UPDATE Bookings SET trangThai = 'CANCELLED' WHERE booking_id = ${booking_id}
        `;
        await sql.query`
            UPDATE Rooms SET trangthai = 'AVAILABLE'
            WHERE room_id IN (
                SELECT room_id FROM BookingDetails WHERE booking_id = ${booking_id}
            )
        `;

        res.status(200).json({ message: 'Huỷ đặt phòng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createBooking,
    getAllBookings,
    getBookingsByUser,
    getBookingById,
    updateBookingStatus,
    cancelBooking
};