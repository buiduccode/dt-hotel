const roomRepo = require('../repositories/roomRepository');
const { sql } = require('../config/db');

const getAllRooms = async (filters) => roomRepo.findAll(filters);

const getRoomById = async (room_id) => {
    const room = await roomRepo.findById(room_id);
    if (!room) throw { statusCode: 404, message: 'Không tìm thấy phòng' };

    // Lấy đánh giá
    const reviews = await sql.query`
        SELECT rv.xepHang, rv.binhLuan, u.fullname
        FROM Reviews rv
        JOIN Users u ON rv.user_id = u.user_id
        WHERE rv.room_id = ${room_id}
    `;
    const avg = await sql.query`
        SELECT AVG(CAST(xepHang AS FLOAT)) AS diemTrungBinh
        FROM Reviews WHERE room_id = ${room_id}
    `;

    return {
        ...room,
        danhGia: reviews.recordset,
        diemTrungBinh: avg.recordset[0].diemTrungBinh
    };
};

const createRoom = async ({ room_number, roomtypes_id, trangthai = 'AVAILABLE' }) => {
    const validStatuses = ['AVAILABLE', 'BOOKED', 'OCCUPIED', 'MAINTENANCE'];
    if (!validStatuses.includes(trangthai)) {
        throw { statusCode: 400, message: 'Trạng thái phòng không hợp lệ' };
    }
    const existing = await roomRepo.findByNumber(room_number);
    if (existing) throw { statusCode: 400, message: 'Số phòng đã tồn tại' };

    await roomRepo.create({ room_number, roomtypes_id, trangthai });
};

const updateRoom = async (room_id, data) => {
    const room = await roomRepo.findById(room_id);
    if (!room) throw { statusCode: 404, message: 'Không tìm thấy phòng' };
    await roomRepo.update(room_id, data);
};

const deleteRoom = async (room_id) => {
    const room = await roomRepo.findById(room_id);
    if (!room) throw { statusCode: 404, message: 'Không tìm thấy phòng' };
    if (room.trangthai === 'OCCUPIED') throw { statusCode: 400, message: 'Không thể xoá phòng đang có khách' };
    await roomRepo.remove(room_id);
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom };