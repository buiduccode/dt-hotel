const { sql } = require('../config/db');

// Tổng quan hệ thống (admin)
const getOverview = async (req, res) => {
    try {
        const totalRooms = await sql.query`SELECT COUNT(*) AS total FROM Rooms`;
        const availableRooms = await sql.query`SELECT COUNT(*) AS total FROM Rooms WHERE trangthai = 'AVAILABLE'`;
        const occupiedRooms = await sql.query`SELECT COUNT(*) AS total FROM Rooms WHERE trangthai = 'OCCUPIED'`;
        const totalUsers = await sql.query`SELECT COUNT(*) AS total FROM Users`;
        const totalBookings = await sql.query`SELECT COUNT(*) AS total FROM Bookings`;
        const pendingBookings = await sql.query`SELECT COUNT(*) AS total FROM Bookings WHERE trangThai = 'PENDING'`;

        res.status(200).json({
            rooms: {
                total: totalRooms.recordset[0].total,
                available: availableRooms.recordset[0].total,
                occupied: occupiedRooms.recordset[0].total
            },
            users: { total: totalUsers.recordset[0].total },
            bookings: {
                total: totalBookings.recordset[0].total,
                pending: pendingBookings.recordset[0].total
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Doanh thu theo ngày
const getRevenueByDay = async (req, res) => {
    try {
        const { date } = req.query; // format: YYYY-MM-DD

        const result = await sql.query`
            SELECT 
                CAST(p.pay_date AS DATE) AS ngay,
                SUM(p.tien) AS doanhThu,
                COUNT(p.pay_id) AS soGiaoDich
            FROM Payments p
            WHERE p.trangThai = 'SUCCESS'
              AND (${date} IS NULL OR CAST(p.pay_date AS DATE) = ${date})
            GROUP BY CAST(p.pay_date AS DATE)
            ORDER BY ngay DESC
        `;

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Doanh thu theo tháng
const getRevenueByMonth = async (req, res) => {
    try {
        const { year } = req.query;

        const result = await sql.query`
            SELECT 
                YEAR(p.pay_date) AS nam,
                MONTH(p.pay_date) AS thang,
                SUM(p.tien) AS doanhThu,
                COUNT(p.pay_id) AS soGiaoDich
            FROM Payments p
            WHERE p.trangThai = 'SUCCESS'
              AND (${year} IS NULL OR YEAR(p.pay_date) = ${year})
            GROUP BY YEAR(p.pay_date), MONTH(p.pay_date)
            ORDER BY nam DESC, thang DESC
        `;

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Doanh thu theo năm
const getRevenueByYear = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT 
                YEAR(p.pay_date) AS nam,
                SUM(p.tien) AS doanhThu,
                COUNT(p.pay_id) AS soGiaoDich
            FROM Payments p
            WHERE p.trangThai = 'SUCCESS'
            GROUP BY YEAR(p.pay_date)
            ORDER BY nam DESC
        `;

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Tỉ lệ sử dụng phòng
const getRoomUsageRate = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT 
                rt.room_name,
                COUNT(r.room_id) AS tongSoPhong,
                SUM(CASE WHEN r.trangthai = 'OCCUPIED' THEN 1 ELSE 0 END) AS dangSuDung,
                SUM(CASE WHEN r.trangthai = 'AVAILABLE' THEN 1 ELSE 0 END) AS conTrong,
                SUM(CASE WHEN r.trangthai = 'BOOKED' THEN 1 ELSE 0 END) AS daDat,
                SUM(CASE WHEN r.trangthai = 'MAINTENANCE' THEN 1 ELSE 0 END) AS baoTri
            FROM Rooms r
            JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
            GROUP BY rt.room_name
        `;

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getOverview,
    getRevenueByDay,
    getRevenueByMonth,
    getRevenueByYear,
    getRoomUsageRate
};