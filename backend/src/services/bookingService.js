const bookingRepo = require('../repositories/bookingRepository');
const roomRepo = require('../repositories/roomRepository');

const createBooking = async ({ user_id, check_in, check_out, room_ids }) => {
    if (!room_ids || room_ids.length === 0) {
        throw { statusCode: 400, message: 'Vui lòng chọn ít nhất 1 phòng' };
    }

    // Kiểm tra tất cả phòng còn trống
    for (const room_id of room_ids) {
        const room = await roomRepo.findById(room_id);
        if (!room) throw { statusCode: 404, message: `Phòng ID ${room_id} không tồn tại` };
        if (room.trangthai !== 'AVAILABLE') {
            throw { statusCode: 400, message: `Phòng ${room.room_number} hiện không còn trống` };
        }
    }

    const booking_id = await bookingRepo.create({ user_id, check_in, check_out });

    for (const room_id of room_ids) {
        const gia = await roomRepo.getPriceByRoom(room_id);
        await bookingRepo.addDetail({ booking_id, room_id, gia });
        await roomRepo.updateStatus(room_id, 'BOOKED');
    }

    return { booking_id };
};

const getAllBookings = async () => bookingRepo.findAll();

const getBookingsByUser = async (user_id) => bookingRepo.findByUser(user_id);

const getBookingDetail = async (booking_id) => {
    const booking = await bookingRepo.findById(booking_id);
    if (!booking) throw { statusCode: 404, message: 'Không tìm thấy booking' };

    const rooms = await bookingRepo.findDetails(booking_id);
    return { booking, rooms };
};

const updateStatus = async (booking_id, trangThai) => {
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(trangThai)) {
        throw { statusCode: 400, message: 'Trạng thái không hợp lệ' };
    }

    const booking = await bookingRepo.findById(booking_id);
    if (!booking) throw { statusCode: 404, message: 'Không tìm thấy booking' };

    await bookingRepo.updateStatus(booking_id, trangThai);

    if (trangThai === 'CANCELLED') {
        await roomRepo.updateStatusByBooking(booking_id, 'AVAILABLE');
    }
};

const cancelBooking = async (booking_id, user_id) => {
    const booking = await bookingRepo.findById(booking_id);
    if (!booking) throw { statusCode: 404, message: 'Không tìm thấy booking' };
    if (booking.user_id !== user_id) throw { statusCode: 403, message: 'Không có quyền huỷ booking này' };
    if (booking.trangThai === 'CANCELLED') throw { statusCode: 400, message: 'Booking đã được huỷ' };
    if (booking.trangThai === 'COMPLETED') throw { statusCode: 400, message: 'Booking đã hoàn thành, không thể huỷ' };

    await bookingRepo.updateStatus(booking_id, 'CANCELLED');
    await roomRepo.updateStatusByBooking(booking_id, 'AVAILABLE');
};

module.exports = { createBooking, getAllBookings, getBookingsByUser, getBookingDetail, updateStatus, cancelBooking };