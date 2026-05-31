// ============================================================
//  payment.js – Xử lý thanh toán DT Hotel
//  Yêu cầu: nhúng /assets/js/api.js TRƯỚC file này
// ============================================================

const PAYMENT_API = 'http://localhost:5000/api';

// ── Tạo thanh toán mới ────────────────────────────────────
async function createPayment(bookingId, phuongThucThanhToan) {
    const token = getToken();
    if (!token) throw { message: 'Bạn chưa đăng nhập', code: 401 };

    const res = await fetch(`${PAYMENT_API}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            booking_id: parseInt(bookingId),
            phuongThucThanhToan
        })
    });

    const data = await res.json();
    if (!res.ok) throw { message: data.message || 'Thanh toán thất bại', code: res.status };
    return data;
}

// ── Lấy lịch sử thanh toán theo booking ──────────────────
async function getPaymentByBooking(bookingId) {
    const token = getToken();
    if (!token) return [];
    const res = await fetch(`${PAYMENT_API}/payments/booking/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return res.ok ? (data.data || data || []) : [];
}

// ── Lấy tất cả thanh toán (admin) ────────────────────────
async function getAllPayments() {
    const token = getToken();
    if (!token) return [];
    const res = await fetch(`${PAYMENT_API}/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return res.ok ? (data.data || data || []) : [];
}

// ── Kiểm tra booking đã thanh toán chưa ──────────────────
async function isBookingPaid(bookingId) {
    const payments = await getPaymentByBooking(bookingId);
    return payments.some(p => p.trangThai === 'SUCCESS');
}

// ── Format helpers ────────────────────────────────────────
function fmtVND(amount) {
    return Number(amount).toLocaleString('vi-VN') + ' đ';
}
function fmtDate(dateStr) {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('vi-VN');
}
