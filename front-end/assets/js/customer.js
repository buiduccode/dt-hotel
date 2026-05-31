// ============================================================
//  customer.js – Xử lý toàn bộ trang Customer
//  Yêu cầu: nhúng /assets/js/api.js TRƯỚC file này
// ============================================================

document.addEventListener('DOMContentLoaded', async function () {

    renderAuthNav();
    setupLogout();

    const path = window.location.pathname;

    if (path.includes('Trangchu'))        await loadTrangChu();
    if (path.includes('datphong'))        await loadDatPhong();
    if (path.includes('lichsu'))          await loadLichSu();
    if (path.includes('HoSo'))            await loadHoSo();
    if (path.includes('chitietphong'))    await loadChiTietPhong();
    if (path.includes('ketquatimkiem'))   await loadKetQuaTimKiem();
});

function setupLogout() {
    const btnLogout = document.getElementById('btn-logout') || document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function (e) {
            e.stopPropagation();
            clearAuth();
            window.location.href = '/pages/auth/login.html';
        });
    }
    const authContainer  = document.getElementById('auth-container');
    const logoutDropdown = document.getElementById('logout-dropdown');
    if (authContainer && logoutDropdown) {
        authContainer.addEventListener('click', e => {
            e.stopPropagation();
            logoutDropdown.style.display =
                logoutDropdown.style.display === 'block' ? 'none' : 'block';
        });
        window.addEventListener('click', () => { logoutDropdown.style.display = 'none'; });
    }
}

// ============================================================
// TRANG CHỦ (Trangchu.html)
// ============================================================
async function loadTrangChu() {
    const user = getUser();
    const navLogin    = document.getElementById('navLogin');
    const navRegister = document.getElementById('navRegister');
    const authContent = document.getElementById('auth-content');

    if (user) {
        if (navLogin)    navLogin.style.display    = 'none';
        if (navRegister) navRegister.style.display = 'none';
        if (authContent) authContent.innerHTML =
            `<span style="font-weight:600;cursor:pointer">${user.fullname}</span>`;
    }

    try {
        const res = await api.get('/rooms?trangthai=AVAILABLE');
        // FIX: responseHandler bọc trong { data } → dùng res.data
        const rooms = res.data || [];
        const container = document.getElementById('roomDetailHomeBody');
        if (container && rooms.length > 0) {
            container.innerHTML = rooms.map(r => `
                <div class="room-card" style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:12px">
                    <h4>${r.room_name} – Phòng ${r.room_number}</h4>
                    <p style="color:#888">${r.mieuTa}</p>
                    <p><strong>${formatVND(r.gia)}</strong> / đêm</p>
                    <a href="/pages/customer/chitietphong.html?room_id=${r.room_id}"
                       style="color:#1a3673;font-weight:600">Xem chi tiết →</a>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('loadTrangChu rooms:', err);
    }

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const searchData = {
                checkin:  document.getElementById('checkin')?.value,
                checkout: document.getElementById('checkout')?.value,
                soKhach:  document.getElementById('selectKhach')?.value,
                loaiPhong:document.getElementById('selectPhong')?.value,
            };
            localStorage.setItem('bookingSearchData', JSON.stringify(searchData));
            window.location.href = '/pages/customer/ketquatimkiem.html';
        });
    }
}

// ============================================================
// TRANG KẾT QUẢ TÌM KIẾM (ketquatimkiem.html)
// ============================================================
async function loadKetQuaTimKiem() {
    try {
        const res = await api.get('/rooms?trangthai=AVAILABLE');
        // FIX: dùng res.data
        const rooms = res.data || [];
        const container = document.querySelector('.room-list') || document.querySelector('main');
        if (!container) return;

        if (rooms.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px">Không tìm thấy phòng phù hợp.</p>';
            return;
        }
        container.innerHTML = rooms.map(r => `
            <div class="room-card" style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
                <div>
                    <h4>${r.room_name} – Phòng ${r.room_number}</h4>
                    <p style="color:#555">${r.mieuTa}</p>
                    <p><strong>${formatVND(r.gia)}</strong> / đêm</p>
                </div>
                <a href="/pages/customer/chitietphong.html?room_id=${r.room_id}"
                   style="background:#224083;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
                   Xem chi tiết
                </a>
            </div>
        `).join('');
    } catch (err) {
        console.error('loadKetQuaTimKiem:', err);
    }
}

// ============================================================
// TRANG CHI TIẾT PHÒNG (chitietphong.html)
// ============================================================
async function loadChiTietPhong() {
    const params  = new URLSearchParams(window.location.search);
    const room_id = params.get('room_id');
    if (!room_id) return;

    try {
        const res  = await api.get(`/rooms/${room_id}`);
        // FIX: roomRoute dùng response.success → bọc trong { data }
        const room = res.data;
        if (!room) return;

        _setText('room-name',    room.room_name);
        _setText('room-number',  room.room_number);
        _setText('room-price',   formatVND(room.gia) + ' / đêm');
        _setText('room-desc',    room.mieuTa);
        _setText('room-status',  room.trangthai);
        _setText('room-rating',  room.diemTrungBinh ? room.diemTrungBinh.toFixed(1) + ' ⭐' : 'Chưa có đánh giá');

        const reviewList = document.getElementById('reviewList');
        if (reviewList && room.danhGia?.length > 0) {
            reviewList.innerHTML = room.danhGia.map(rv => `
                <div style="border-bottom:1px solid #eee;padding:8px 0">
                    <strong>${rv.fullname}</strong>
                    <span style="color:#f5a623;margin-left:8px">${'⭐'.repeat(rv.xepHang)}</span>
                    <p style="margin:4px 0;color:#555">${rv.binhLuan || ''}</p>
                </div>
            `).join('');
        }

        const btnDatPhong = document.getElementById('btn-dat-phong');
        if (btnDatPhong) {
            btnDatPhong.addEventListener('click', () => {
                if (!isLoggedIn()) {
                    alert('Vui lòng đăng nhập để đặt phòng!');
                    window.location.href = '/pages/auth/login.html';
                    return;
                }
                localStorage.setItem('selectedRoom', JSON.stringify(room));
                window.location.href = '/pages/customer/datphong.html';
            });
        }
    } catch (err) {
        console.error('loadChiTietPhong:', err);
        alert('Không thể tải thông tin phòng: ' + err.message);
    }
}

// ============================================================
// TRANG ĐẶT PHÒNG (datphong.html)
// ============================================================
async function loadDatPhong() {
    requireLogin();
    const user = getUser();
    const room = JSON.parse(localStorage.getItem('selectedRoom') || 'null');
    const searchData = JSON.parse(localStorage.getItem('bookingSearchData') || '{}');

    if (user) {
        _setVal('customer-name',  user.fullname);
        _setVal('customer-phone', user.phone);
    }

    if (room) {
        _setVal('room-name', room.room_name || room.room_number);
    }

    if (searchData.checkin)  _setVal('check-in',  searchData.checkin);
    if (searchData.checkout) _setVal('check-out', searchData.checkout);

    try {
        const resServices = await api.get('/services');
        // FIX: serviceController.getAllServices trả thẳng array (không bọc responseHandler)
        // nên dùng trực tiếp resServices nếu là array, hoặc resServices.data nếu có
        const services = Array.isArray(resServices) ? resServices : (resServices.data || []);
        const serviceList = document.getElementById('serviceList');
        if (serviceList && services.length > 0) {
            serviceList.innerHTML = `<h4 style="margin-bottom:8px">Dịch vụ thêm:</h4>` +
                services.map(s => `
                    <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                        <input type="checkbox" name="service" value="${s.services_id}" data-gia="${s.gia}">
                        ${s.name_services} – ${formatVND(s.gia)}
                        <input type="number" min="1" value="1"
                               id="qty-${s.services_id}"
                               style="width:55px;margin-left:4px;border:1px solid #ccc;border-radius:4px;padding:2px 6px">
                    </label>
                `).join('');
        }
    } catch (err) { console.error('services:', err); }

    const datPhongForm = document.getElementById('datPhongForm') || document.querySelector('form');
    if (datPhongForm) {
        datPhongForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!room) { alert('Chưa chọn phòng!'); return; }

            const checkin  = document.getElementById('check-in')?.value;
            const checkout = document.getElementById('check-out')?.value;
            if (!checkin || !checkout) { alert('Vui lòng chọn ngày nhận và trả phòng!'); return; }

            const btnSubmit = datPhongForm.querySelector('button[type="submit"]');
            if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Đang đặt phòng...'; }

            try {
                const bookingRes = await api.post('/bookings', {
                    user_id:   user.user_id,
                    check_in:  checkin,
                    check_out: checkout,
                    room_ids:  [room.room_id]
                });
                // FIX: bookingRoute dùng response.created → { data: { booking_id } }
                const booking_id = bookingRes.data.booking_id;

                const checkedServices = document.querySelectorAll('input[name="service"]:checked');
                for (const cb of checkedServices) {
                    const soLuong = parseInt(document.getElementById(`qty-${cb.value}`)?.value) || 1;
                    await api.post('/services/booking', {
                        booking_id,
                        service_id: parseInt(cb.value),
                        soLuong
                    });
                }

                alert('Đặt phòng thành công! Mã booking: ' + booking_id);
                localStorage.removeItem('selectedRoom');
                window.location.href = '/pages/customer/lichsu.html';
            } catch (err) {
                alert('Đặt phòng thất bại: ' + err.message);
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Xác nhận đặt phòng'; }
            }
        });
    }
}

// ============================================================
// TRANG LỊCH SỬ ĐẶT PHÒNG (lichsu.html)
// ============================================================
async function loadLichSu() {
    requireLogin();
    const container = document.getElementById('historyContainerList');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center;padding:20px">Đang tải...</p>';

    try {
        const res      = await api.get('/bookings/my');
        // FIX: dùng res.data
        const bookings = res.data || [];

        if (bookings.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#888">Bạn chưa có lịch sử đặt phòng.</p>';
            return;
        }

        const statusVN = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã huỷ', COMPLETED: 'Hoàn thành' };
        const statusColor = { PENDING: '#f5a623', CONFIRMED: '#4caf50', CANCELLED: '#f44336', COMPLETED: '#2196f3' };

        const grouped = bookings.reduce((acc, row) => {
            const key = row.booking_id;
            if (!acc[key]) acc[key] = { ...row, rooms: [] };
            if (row.room_number) acc[key].rooms.push(row.room_number);
            return acc;
        }, {});

        container.innerHTML = Object.values(grouped).map(b => `
            <div style="border:1px solid #ddd;border-radius:10px;padding:16px;margin-bottom:16px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <h4 style="margin:0">Booking #${b.booking_id}</h4>
                    <span style="background:${statusColor[b.trangThai] || '#999'};color:#fff;padding:4px 12px;border-radius:20px;font-size:13px">
                        ${statusVN[b.trangThai] || b.trangThai}
                    </span>
                </div>
                <p style="margin:8px 0;color:#555">
                    🏨 Phòng: <strong>${b.rooms.join(', ')}</strong> &nbsp;|&nbsp;
                    📅 ${formatDate(b.check_in)} → ${formatDate(b.check_out)}
                </p>
                <p style="margin:4px 0;color:#888;font-size:13px">Đặt lúc: ${formatDate(b.created_at)}</p>
                ${b.trangThai === 'PENDING' || b.trangThai === 'CONFIRMED' ? `
                    <button onclick="huyBooking(${b.booking_id})"
                        style="margin-top:8px;padding:6px 16px;background:#f44336;color:#fff;border:none;border-radius:6px;cursor:pointer">
                        Huỷ đặt phòng
                    </button>` : ''}
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p style="color:red;text-align:center">Lỗi tải dữ liệu: ' + err.message + '</p>';
    }
}

async function huyBooking(booking_id) {
    if (!confirm('Bạn có chắc muốn huỷ đặt phòng #' + booking_id + '?')) return;
    try {
        await api.delete(`/bookings/${booking_id}/cancel`);
        alert('Huỷ đặt phòng thành công!');
        await loadLichSu();
    } catch (err) {
        alert('Huỷ thất bại: ' + err.message);
    }
}

// ============================================================
// TRANG HỒ SƠ (HoSo.html)
// ============================================================
async function loadHoSo() {
    requireLogin();
    try {
        const res  = await api.get('/auth/profile');
        // FIX: authController.getProfile trả thẳng object (không bọc responseHandler)
        // nên dùng res trực tiếp (nếu không có .data) hoặc res.data nếu có
        const user = res.user_id ? res : (res.data || res);

        _setVal('[name="username"]',  user.email,    true);
        _setVal('[name="fullname"]',  user.fullname, true);
        _setVal('[name="email"]',     user.email,    true);
        _setVal('[name="phone"]',     user.phone,    true);

        saveUser({ ...getUser(), ...user });

        const profileForm = document.querySelector('form');
        if (profileForm) {
            profileForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const fullname = profileForm.querySelector('[name="fullname"]')?.value.trim();
                const phone    = profileForm.querySelector('[name="phone"]')?.value.trim();
                try {
                    await api.put('/auth/profile', { fullname, phone });
                    alert('Cập nhật hồ sơ thành công!');
                    saveUser({ ...getUser(), fullname, phone });
                } catch (err) { alert(err.message); }
            });
        }
    } catch (err) {
        console.error('loadHoSo:', err);
    }
}

// ── Helpers DOM ──────────────────────────────────────────────
function _setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
}
function _setVal(selector, value, byAttr = false) {
    const el = byAttr
        ? document.querySelector(selector)
        : document.getElementById(selector);
    if (el) el.value = value ?? '';
}
