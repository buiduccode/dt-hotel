const { sql } = require('../config/db');

const findAll = async ({ trangthai, roomtypes_id } = {}) => {
    const request = new sql.Request();
    let query = `
        SELECT r.room_id, r.room_number, r.trangthai,
               rt.roomtypes_id, rt.room_name, rt.gia, rt.mieuTa
        FROM Rooms r
        JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
        WHERE 1=1
    `;
    if (trangthai) {
        query += ` AND r.trangthai = @trangthai`;
        request.input('trangthai', sql.NVarChar, trangthai);
    }
    if (roomtypes_id) {
        query += ` AND r.roomtypes_id = @roomtypes_id`;
        request.input('roomtypes_id', sql.Int, parseInt(roomtypes_id));
    }
    query += ` ORDER BY r.room_number`;
    const result = await request.query(query);
    return result.recordset;
};

const findById = async (room_id) => {
    const result = await sql.query`
        SELECT r.room_id, r.room_number, r.trangthai,
               rt.roomtypes_id, rt.room_name, rt.gia, rt.mieuTa
        FROM Rooms r
        JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
        WHERE r.room_id = ${room_id}
    `;
    return result.recordset[0] || null;
};

const findByNumber = async (room_number) => {
    const result = await sql.query`SELECT * FROM Rooms WHERE room_number = ${room_number}`;
    return result.recordset[0] || null;
};

const create = async ({ room_number, roomtypes_id, trangthai }) => {
    await sql.query`
        INSERT INTO Rooms (room_number, roomtypes_id, trangthai)
        VALUES (${room_number}, ${roomtypes_id}, ${trangthai})
    `;
};

// Cập nhật phòng – cho phép đổi cả room_number
const update = async (room_id, { room_number, roomtypes_id, trangthai }) => {
    const request = new sql.Request();
    request.input('room_id', sql.Int, parseInt(room_id));
    request.input('roomtypes_id', sql.Int, parseInt(roomtypes_id));
    request.input('trangthai', sql.NVarChar, trangthai);

    if (room_number) {
        request.input('room_number', sql.NVarChar, room_number);
        await request.query(`
            UPDATE Rooms
            SET room_number = @room_number, roomtypes_id = @roomtypes_id, trangthai = @trangthai
            WHERE room_id = @room_id
        `);
    } else {
        await request.query(`
            UPDATE Rooms
            SET roomtypes_id = @roomtypes_id, trangthai = @trangthai
            WHERE room_id = @room_id
        `);
    }
};

const updateStatus = async (room_id, trangthai) => {
    await sql.query`UPDATE Rooms SET trangthai = ${trangthai} WHERE room_id = ${room_id}`;
};

const updateStatusByBooking = async (booking_id, trangthai) => {
    await sql.query`
        UPDATE Rooms SET trangthai = ${trangthai}
        WHERE room_id IN (SELECT room_id FROM BookingDetails WHERE booking_id = ${booking_id})
    `;
};

const remove = async (room_id) => {
    await sql.query`DELETE FROM Rooms WHERE room_id = ${room_id}`;
};

const getPriceByRoom = async (room_id) => {
    const result = await sql.query`
        SELECT rt.gia FROM Rooms r
        JOIN RoomTypes rt ON r.roomtypes_id = rt.roomtypes_id
        WHERE r.room_id = ${room_id}
    `;
    return result.recordset[0]?.gia || 0;
};

module.exports = { findAll, findById, findByNumber, create, update, updateStatus, updateStatusByBooking, remove, getPriceByRoom };
