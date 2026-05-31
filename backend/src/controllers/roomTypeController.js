const { sql } = require('../config/db');

// Lấy tất cả loại phòng
const getAllRoomTypes = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT rt.roomtypes_id, rt.room_name, rt.gia, rt.mieuTa,
                   COUNT(r.room_id) AS tongSoPhong,
                   SUM(CASE WHEN r.trangthai = 'AVAILABLE' THEN 1 ELSE 0 END) AS phongConTrong
            FROM RoomTypes rt
            LEFT JOIN Rooms r ON rt.roomtypes_id = r.roomtypes_id
            GROUP BY rt.roomtypes_id, rt.room_name, rt.gia, rt.mieuTa
        `;
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết 1 loại phòng
const getRoomTypeById = async (req, res) => {
    try {
        const { roomtypes_id } = req.params;

        const result = await sql.query`
            SELECT * FROM RoomTypes WHERE roomtypes_id = ${roomtypes_id}
        `;
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy loại phòng' });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thêm loại phòng mới (admin)
const createRoomType = async (req, res) => {
    try {
        const { room_name, gia, mieuTa } = req.body;

        if (!room_name || !gia || !mieuTa) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        await sql.query`
            INSERT INTO RoomTypes (room_name, gia, mieuTa)
            VALUES (${room_name}, ${gia}, ${mieuTa})
        `;

        res.status(201).json({ message: 'Thêm loại phòng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật loại phòng (admin)
const updateRoomType = async (req, res) => {
    try {
        const { roomtypes_id } = req.params;
        const { room_name, gia, mieuTa } = req.body;

        const existing = await sql.query`
            SELECT * FROM RoomTypes WHERE roomtypes_id = ${roomtypes_id}
        `;
        if (existing.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy loại phòng' });
        }

        await sql.query`
            UPDATE RoomTypes
            SET room_name = ${room_name}, gia = ${gia}, mieuTa = ${mieuTa}
            WHERE roomtypes_id = ${roomtypes_id}
        `;

        res.status(200).json({ message: 'Cập nhật loại phòng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xoá loại phòng (admin)
const deleteRoomType = async (req, res) => {
    try {
        const { roomtypes_id } = req.params;

        // Kiểm tra còn phòng thuộc loại này không
        const rooms = await sql.query`
            SELECT COUNT(*) AS count FROM Rooms WHERE roomtypes_id = ${roomtypes_id}
        `;
        if (rooms.recordset[0].count > 0) {
            return res.status(400).json({
                message: 'Không thể xoá loại phòng đang có phòng liên kết'
            });
        }

        await sql.query`DELETE FROM RoomTypes WHERE roomtypes_id = ${roomtypes_id}`;
        res.status(200).json({ message: 'Xoá loại phòng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllRoomTypes,
    getRoomTypeById,
    createRoomType,
    updateRoomType,
    deleteRoomType
};