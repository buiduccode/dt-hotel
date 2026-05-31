const { sql } = require('../config/db');

const create = async ({ user_id, check_in, check_out }) => {
    const result = await sql.query`
        INSERT INTO Bookings (user_id, check_in, check_out, trangThai)
        OUTPUT INSERTED.booking_id
        VALUES (${user_id}, ${check_in}, ${check_out}, 'PENDING')
    `;
    return result.recordset[0].booking_id;
};

const addDetail = async ({ booking_id, room_id, gia }) => {
    await sql.query`
        INSERT INTO BookingDetails (booking_id, room_id, gia)
        VALUES (${booking_id}, ${room_id}, ${gia})
    `;
};

const findById = async (booking_id) => {
    const result = await sql.query`
        SELECT b.*, u.fullname, u.email, u.phone
        FROM Bookings b
        JOIN Users u ON b.user_id = u.user_id
        WHERE b.booking_id = ${booking_id}
    `;
    return result.recordset[0] || null;
};

// findAll – trả về 1 row mỗi (booking × phòng) kèm thông tin KH + thanh toán
const findAll = async () => {
    const result = await sql.query`
        SELECT
            b.booking_id,
            r.room_id,
            r.room_number,
            rt.room_name,
            u.user_id   AS ma_kh,
            u.fullname,
            u.phone,
            b.check_in,
            b.check_out,
            bd.gia      AS tong_tien,
            b.trangThai,
            ISNULL(p.trangThai, 'UNPAID') AS payment_status
        FROM Bookings b
        JOIN Users          u  ON b.booking_id   = b.booking_id AND b.user_id = u.user_id
        JOIN BookingDetails bd ON bd.booking_id  = b.booking_id
        JOIN Rooms          r  ON r.room_id       = bd.room_id
        JOIN RoomTypes      rt ON rt.roomtypes_id = r.roomtypes_id
        LEFT JOIN Payments  p  ON p.booking_id    = b.booking_id
        ORDER BY b.created_at DESC, r.room_number
    `;
    return result.recordset;
};

const findByUser = async (user_id) => {
    const result = await sql.query`
        SELECT b.booking_id, b.check_in, b.check_out, b.trangThai, b.created_at,
               r.room_number, rt.room_name, bd.gia
        FROM Bookings b
        JOIN BookingDetails bd ON b.booking_id = bd.booking_id
        JOIN Rooms r ON bd.room_id = r.room_id
        JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
        WHERE b.user_id = ${user_id}
        ORDER BY b.created_at DESC
    `;
    return result.recordset;
};

const findDetails = async (booking_id) => {
    const result = await sql.query`
        SELECT bd.bookingDetails_id, r.room_id, r.room_number, rt.room_name, bd.gia
        FROM BookingDetails bd
        JOIN Rooms r ON bd.room_id = r.room_id
        JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
        WHERE bd.booking_id = ${booking_id}
    `;
    return result.recordset;
};

const updateStatus = async (booking_id, trangThai) => {
    await sql.query`
        UPDATE Bookings SET trangThai = ${trangThai} WHERE booking_id = ${booking_id}
    `;
};

const getRoomIds = async (booking_id) => {
    const result = await sql.query`
        SELECT room_id FROM BookingDetails WHERE booking_id = ${booking_id}
    `;
    return result.recordset.map(r => r.room_id);
};

module.exports = { create, addDetail, findById, findAll, findByUser, findDetails, updateStatus, getRoomIds };
