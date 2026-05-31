const paymentRepo = require('../repositories/paymentRepository');
const bookingRepo = require('../repositories/bookingRepository');

const createPayment = async ({ booking_id, phuongThucThanhToan }) => {
    const booking = await bookingRepo.findById(booking_id);
    if (!booking) throw { statusCode: 404, message: 'Không tìm thấy booking' };
    if (booking.trangThai === 'CANCELLED') throw { statusCode: 400, message: 'Booking đã bị huỷ' };

    const paid = await paymentRepo.findSuccessByBooking(booking_id);
    if (paid) throw { statusCode: 400, message: 'Booking này đã được thanh toán' };

    // Tính số ngày lưu trú
    const soNgay = Math.ceil(
        (new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)
    );

    const tongTienPhong = (await paymentRepo.calcRoomCost(booking_id)) * soNgay;
    const tongTienDichVu = await paymentRepo.calcServiceCost(booking_id);
    const tongTien = tongTienPhong + tongTienDichVu;

    const pay_id = await paymentRepo.create({ tien: tongTien, phuongThucThanhToan, booking_id });

    // Xác nhận booking sau khi thanh toán
    if (booking.trangThai === 'PENDING') {
        await bookingRepo.updateStatus(booking_id, 'CONFIRMED');
    }

    return { pay_id, tongTien, soNgay, tongTienPhong, tongTienDichVu };
};

const getPaymentByBooking = async (booking_id) => paymentRepo.findByBooking(booking_id);

const getAllPayments = async () => paymentRepo.findAll();

module.exports = { createPayment, getPaymentByBooking, getAllPayments };