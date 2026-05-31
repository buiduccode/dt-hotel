const { sql } = require('../config/db');

const create = async ({ tien, phuongThucThanhToan, booking_id }) => {
    const result = await sql.query`
        INSERT INTO Payments (tien, phuongThucThanhToan, trangThai, booking_id)
        OUTPUT INSERTED.pay_id
        VALUES (${tien}, ${phuongThucThanhToan}, 'SUCCESS', ${booking_id})
    `;
    return result.recordset[0].pay_id;
};

const findByBooking = async (booking_id) => {
    const result = await sql.query`
        SELECT p.pay_id, p.tien, p.phuongThucThanhToan, p.trangThai, p.pay_date,
               b.check_in, b.check_out, u.fullname
        FROM Payments p
        JOIN Bookings b ON p.booking_id = b.booking_id
        JOIN Users u ON b.user_id = u.user_id
        WHERE p.booking_id = ${booking_id}
    `;
    return result.recordset;
};

const findSuccessByBooking = async (booking_id) => {
    const result = await sql.query`
        SELECT * FROM Payments WHERE booking_id = ${booking_id} AND trangThai = 'SUCCESS'
    `;
    return result.recordset[0] || null;
};

const findAll = async () => {
    const result = await sql.query`
        SELECT p.pay_id, p.tien, p.phuongThucThanhToan, p.trangThai, p.pay_date,
               b.booking_id, u.fullname, u.email
        FROM Payments p
        JOIN Bookings b ON p.booking_id = b.booking_id
        JOIN Users u ON b.user_id = u.user_id
        ORDER BY p.pay_date DESC
    `;
    return result.recordset;
};

const calcRoomCost = async (booking_id) => {
    const result = await sql.query`
        SELECT SUM(gia) AS tongTienPhong FROM BookingDetails WHERE booking_id = ${booking_id}
    `;
    return result.recordset[0]?.tongTienPhong || 0;
};

const calcServiceCost = async (booking_id) => {
    const result = await sql.query`
        SELECT SUM(s.gia * su.soLuong) AS tongTienDichVu
        FROM ServiceUsages su
        JOIN Services s ON su.service_id = s.services_id
        WHERE su.booking_id = ${booking_id}
    `;
    return result.recordset[0]?.tongTienDichVu || 0;
};

module.exports = { create, findByBooking, findSuccessByBooking, findAll, calcRoomCost, calcServiceCost };