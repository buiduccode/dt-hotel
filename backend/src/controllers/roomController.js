const { sql } = require('../config/db');

// Lấy tất cả phòng
const getAllRooms = async (req, res) => {
    try {
        const { trangthai, roomtypes_id } = req.query;

        let query = `
            SELECT r.room_id, r.room_number, r.trangthai,
                   rt.roomtypes_id, rt.room_name, rt.gia, rt.mieuTa
            FROM Rooms r
            JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
            WHERE 1=1
        `;

        const inputs = {};
        if (trangthai) {
            query += ` AND r.trangthai = @trangthai`;
            inputs.trangthai = trangthai;
        }
        if (roomtypes_id) {
            query += ` AND r.roomtypes_id = @roomtypes_id`;
            inputs.roomtypes_id = parseInt(roomtypes_id);
        }
        query += ` ORDER BY r.room_number`;

        const request = new sql.Request();
        if (inputs.trangthai) request.input('trangthai', sql.NVarChar, inputs.trangthai);
        if (inputs.roomtypes_id) request.input('roomtypes_id', sql.Int, inputs.roomtypes_id);

        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết 1 phòng kèm đánh giá
const getRoomById = async (req, res) => {
    try {
        const { room_id } = req.params;

        const room = await sql.query`
            SELECT r.room_id, r.room_number, r.trangthai,
                   rt.room_name, rt.gia, rt.mieuTa
            FROM Rooms r
            JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
            WHERE r.room_id = ${room_id}
        `;
        if (room.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phòng' });
        }

        const reviews = await sql.query`
            SELECT rv.xepHang, rv.binhLuan, u.fullname
            FROM Reviews rv
            JOIN Users u ON rv.user_id = u.user_id
            WHERE rv.room_id = ${room_id}
        `;

        const avgReview = await sql.query`
            SELECT AVG(CAST(xepHang AS FLOAT)) AS diemTrungBinh
            FROM Reviews WHERE room_id = ${room_id}
        `;

        res.status(200).json({
            ...room.recordset[0],
            danhGia: reviews.recordset,
            diemTrungBinh: avgReview.recordset[0].diemTrungBinh
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thêm phòng mới (admin)
const createRoom = async (req, res) => {
    try {
        const { room_number, roomtypes_id, trangthai } = req.body;

        const validStatuses = ['AVAILABLE', 'BOOKED', 'OCCUPIED', 'MAINTENANCE'];
        if (!validStatuses.includes(trangthai)) {
            return res.status(400).json({ message: 'Trạng thái phòng không hợp lệ' });
        }

        // Kiểm tra số phòng đã tồn tại chưa
        const existing = await sql.query`
            SELECT * FROM Rooms WHERE room_number = ${room_number}
        `;
        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: 'Số phòng đã tồn tại' });
        }

        await sql.query`
            INSERT INTO Rooms (room_number, roomtypes_id, trangthai)
            VALUES (${room_number}, ${roomtypes_id}, ${trangthai})
        `;

        res.status(201).json({ message: 'Thêm phòng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật phòng (admin)
const updateRoom = async (req, res) => {
    try {
        const { room_id } = req.params;
        const { roomtypes_id, trangthai } = req.body;

        const room = await sql.query`SELECT * FROM Rooms WHERE room_id = ${room_id}`;
        if (room.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phòng' });
        }

        await sql.query`
            UPDATE Rooms
            SET roomtypes_id = ${roomtypes_id}, trangthai = ${trangthai}
            WHERE room_id = ${room_id}
        `;

        res.status(200).json({ message: 'Cập nhật phòng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xoá phòng (admin)
const deleteRoom = async (req, res) => {
    try {
        const { room_id } = req.params;

        const room = await sql.query`SELECT * FROM Rooms WHERE room_id = ${room_id}`;
        if (room.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phòng' });
        }
        if (room.recordset[0].trangthai === 'OCCUPIED') {
            return res.status(400).json({ message: 'Không thể xoá phòng đang có khách' });
        }

        await sql.query`DELETE FROM Rooms WHERE room_id = ${room_id}`;
        res.status(200).json({ message: 'Xoá phòng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom };