// ============================================================
//  admin.js – Xử lý toàn bộ trang Admin/Staff
//  Yêu cầu: nhúng /assets/js/api.js TRƯỚC file này
// ============================================================

// ── State ────────────────────────────────────────────────────
let selectedRoomId    = null;
let selectedBookingId = null;
let selectedAccountId = null;
let selectedCustomerId = null;
let _roomTypes = []; // cache kiểu phòng

// ============================================================
// KHỞI ĐỘNG
// ============================================================
document.addEventListener('DOMContentLoaded', async function () {
    requireAdmin();
    renderAuthNav();

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function (e) {
            e.stopPropagation();
            clearAuth();
            alert('Đã đăng xuất thành công!');
            window.location.href = '/pages/auth/login.html';
        });
    }

    const authContainer  = document.getElementById('auth-container');
    const logoutDropdown = document.getElementById('logout-dropdown');
    if (authContainer && logoutDropdown) {
        authContainer.addEventListener('click', function (e) {
            e.stopPropagation();
            logoutDropdown.style.display =
                logoutDropdown.style.display === 'block' ? 'none' : 'block';
        });
        window.addEventListener('click', () => { logoutDropdown.style.display = 'none'; });
    }

    const page = detectPage();
    if (page === 'rooms')     await loadRooms();
    if (page === 'customers') { setupCustomerListeners(); await loadCustomers(); }
    if (page === 'accounts')  { setupAccountListeners();  await loadAccounts();  }
    if (page === 'bookings')  await loadBookings();
    if (page === 'revenue')   await loadRevenue();
});

function detectPage() {
    if (document.getElementById('roomTable'))     return 'rooms';
    if (document.getElementById('customerTable')) return 'customers';
    if (document.getElementById('accountTable'))  return 'accounts';
    if (document.getElementById('historyTable'))  return 'bookings';
    if (document.getElementById('revenueTable'))  return 'revenue';
    return null;
}

// ============================================================
// TRANG QUẢN LÝ PHÒNG (QuanLyPhong.html)
// ============================================================
async function loadRooms() {
    try {
        const [roomsRes, typesRes] = await Promise.all([
            api.get('/rooms'),
            api.get('/room-types')
        ]);
        const rooms = roomsRes.data || roomsRes || [];
        _roomTypes  = typesRes.data || typesRes || [];

        // Populate kiểu phòng
        const selectType = document.getElementById('room-type');
        if (selectType) {
            selectType.innerHTML =
                '<option value="">-- Chọn kiểu phòng --</option>' +
                _roomTypes.map(t =>
                    `<option value="${t.roomtypes_id}" data-gia="${t.gia}">${t.room_name}</option>`
                ).join('');
        }

        renderRoomTable(rooms);
        setupRoomListeners();
    } catch (err) {
        console.error('loadRooms:', err);
        showError('roomTable', 'Không thể tải danh sách phòng: ' + err.message);
    }
}

function onRoomTypeChange() {
    const sel = document.getElementById('room-type');
    const opt = sel?.options[sel.selectedIndex];
    const gia = opt?.dataset?.gia;
    const priceEl = document.getElementById('room-price');
    if (priceEl) priceEl.value = gia ? formatVND(gia) : '';
}

function setupRoomListeners() {
    // ── Click hàng → điền form ────────────────────────────────
    document.getElementById('roomTable')?.addEventListener('click', function (e) {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;
        document.querySelectorAll('#roomTable tbody tr').forEach(r => r.classList.remove('row-selected'));
        row.classList.add('row-selected');
        selectedRoomId = row.dataset.id;

        _setVal('room-id-hidden', selectedRoomId);
        _setVal('room-number', row.dataset.roomNumber || '');

        const roomIdDisplay = document.getElementById('room-id-display');
        if (roomIdDisplay) roomIdDisplay.textContent = `Mã ID: ${selectedRoomId}`;

        // Set kiểu phòng
        const selectType = document.getElementById('room-type');
        if (selectType && row.dataset.roomtypesId) {
            selectType.value = row.dataset.roomtypesId;
            onRoomTypeChange();
        }

        // Set tình trạng
        const selectStatus = document.getElementById('room-status');
        if (selectStatus && row.dataset.trangthai) {
            selectStatus.value = row.dataset.trangthai;
        }
    });

    // ── Thêm phòng ───────────────────────────────────────────
    document.getElementById('btn-them')?.addEventListener('click', async function () {
        const room_number  = _getVal('room-number');
        const roomtypes_id = document.getElementById('room-type')?.value;
        const trangthai    = document.getElementById('room-status')?.value || 'AVAILABLE';

        if (!room_number || !roomtypes_id) {
            alert('Vui lòng nhập số phòng và chọn kiểu phòng!'); return;
        }
        try {
            await api.post('/rooms', { room_number, roomtypes_id: parseInt(roomtypes_id), trangthai });
            alert('Thêm phòng thành công!');
            clearRoomForm();
            await loadRooms();
        } catch (err) { alert(err.message || 'Lỗi khi thêm phòng'); }
    });

    // ── Cập nhật phòng ───────────────────────────────────────
    document.getElementById('btn-capnhat')?.addEventListener('click', async function () {
        if (!selectedRoomId) { alert('Vui lòng chọn phòng cần cập nhật (click vào dòng)!'); return; }

        const room_number  = _getVal('room-number');
        const roomtypes_id = document.getElementById('room-type')?.value;
        const trangthai    = document.getElementById('room-status')?.value;

        if (!roomtypes_id || !trangthai) {
            alert('Vui lòng chọn đầy đủ kiểu phòng và tình trạng!'); return;
        }
        try {
            await api.put(`/rooms/${selectedRoomId}`, {
                room_number,
                roomtypes_id: parseInt(roomtypes_id),
                trangthai
            });
            alert('Cập nhật phòng thành công!');
            clearRoomForm();
            selectedRoomId = null;
            await loadRooms();
        } catch (err) { alert(err.message || 'Lỗi khi cập nhật'); }
    });

    // ── Xóa phòng ────────────────────────────────────────────
    document.getElementById('btn-xoa')?.addEventListener('click', async function () {
        if (!selectedRoomId) { alert('Vui lòng chọn phòng cần xóa (click vào dòng)!'); return; }
        if (!confirm(`Bạn có chắc muốn xóa phòng này (ID: ${selectedRoomId})?`)) return;
        try {
            await api.delete(`/rooms/${selectedRoomId}`);
            alert('Xóa phòng thành công!');
            clearRoomForm();
            selectedRoomId = null;
            await loadRooms();
        } catch (err) { alert(err.message || 'Lỗi khi xóa'); }
    });
}

function renderRoomTable(rooms) {
    const tbody = document.querySelector('#roomTable tbody');
    if (!tbody) return;
    if (!rooms.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999">Không có dữ liệu</td></tr>';
        return;
    }

    const statusMap = {
        AVAILABLE:   { label: 'Còn trống', cls: 'available' },
        BOOKED:      { label: 'Đã đặt',    cls: 'booked' },
        OCCUPIED:    { label: 'Đang ở',    cls: 'occupied' },
        MAINTENANCE: { label: 'Bảo trì',   cls: 'maintenance' },
    };

    tbody.innerHTML = rooms.map(r => {
        const st = statusMap[r.trangthai] || { label: r.trangthai, cls: '' };
        return `
        <tr data-id="${r.room_id}"
            data-room-number="${_esc(r.room_number)}"
            data-roomtypes-id="${r.roomtypes_id}"
            data-trangthai="${r.trangthai}">
            <td>${r.room_number}</td>
            <td>${safeValue(r.room_number)}</td>
                <td>${safeValue(r.room_name)}</td>
            <td>${formatVND(r.gia)}</td>
            <td><span class="status-badge badge-${st.cls}">${st.label}</span></td>
        </tr>`;
    }).join('');
}

function clearRoomForm() {
    _setVal('room-id-hidden', '');
    _setVal('room-number', '');
    _setVal('room-price', '');
    const roomIdDisplay = document.getElementById('room-id-display');
    if (roomIdDisplay) roomIdDisplay.textContent = '';
    const selectType = document.getElementById('room-type');
    if (selectType) selectType.value = '';
    const selectStatus = document.getElementById('room-status');
    if (selectStatus) selectStatus.value = 'AVAILABLE';
}

// ============================================================
// TRANG QUẢN LÝ KHÁCH HÀNG (QuanLyKhachHang.html)
// ============================================================
function setupCustomerListeners() {
    document.getElementById('customerTable')?.addEventListener('click', function (e) {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;
        document.querySelectorAll('#customerTable tbody tr').forEach(r => r.classList.remove('row-selected'));
        row.classList.add('row-selected');
        selectedCustomerId = row.dataset.id;

        _setVal('customer-name', row.dataset.fullname || '');
        _setGender('customer-gender', row.dataset.gender || 'Nam');
        _setVal('customer-phone', row.dataset.phone || '');
        _setVal('customer-email', row.dataset.email || '');
        _setVal('customer-address', row.dataset.address || '');
    });

    document.getElementById('btn-them-customer')?.addEventListener('click', async function () {
        const fullname  = _getVal('customer-name');
        const gioi_tinh = document.getElementById('customer-gender')?.value || 'Nam';
        const phone     = _getVal('customer-phone');
        const email     = _getVal('customer-email');
        const dia_chi   = _getVal('customer-address');
        if (!fullname || !phone || !email) { alert('Vui lòng nhập đầy đủ Tên, SĐT và Email!'); return; }
        try {
            await api.post('/auth/users', { fullname, email, password: 'Password@123', phone, role_id: 3, gioi_tinh, dia_chi });
            alert('Thêm khách hàng thành công!\nMật khẩu mặc định: Password@123');
            clearCustomerForm();
            await loadCustomers();
        } catch (err) { alert(err.message); }
    });

    document.getElementById('btn-capnhat-customer')?.addEventListener('click', async function () {
        if (!selectedCustomerId) { alert('Vui lòng chọn khách hàng cần cập nhật!'); return; }
        const fullname  = _getVal('customer-name');
        const gioi_tinh = document.getElementById('customer-gender')?.value || 'Nam';
        const phone     = _getVal('customer-phone');
        const email     = _getVal('customer-email');
        const dia_chi   = _getVal('customer-address');
        if (!fullname || !phone || !email) { alert('Vui lòng nhập đầy đủ thông tin!'); return; }
        try {
            await api.put(`/auth/users/${selectedCustomerId}`, { fullname, email, phone, role_id: 3, gioi_tinh, dia_chi });
            alert('Cập nhật thành công!');
            clearCustomerForm();
            selectedCustomerId = null;
            await loadCustomers();
        } catch (err) { alert(err.message); }
    });

    document.getElementById('btn-xoa-customer')?.addEventListener('click', async function () {
        if (!selectedCustomerId) { alert('Vui lòng chọn khách hàng cần xóa!'); return; }
        if (!confirm('Bạn có chắc muốn xóa khách hàng này?')) return;
        try {
            await api.delete(`/auth/users/${selectedCustomerId}`);
            alert('Xóa thành công!');
            clearCustomerForm();
            selectedCustomerId = null;
            await loadCustomers();
        } catch (err) { alert(err.message); }
    });
}

async function loadCustomers() {
    try {
        const res = await api.get('/auth/users');
        const customers = (res.data || res || []).filter(u => normalizeRoleName(u.role_name) === 'CUSTOMER');
        const tbody = document.querySelector('#customerTable tbody');
        if (!tbody) return;
        if (!customers.length) {
            tbody.innerHTML = `<tr><td colspan="${getTableColumnCount('customerTable')}" style="text-align:center">Chưa có khách hàng</td></tr>`;
            return;
        }
        tbody.innerHTML = customers.map(u => `
            <tr data-id="${u.user_id}"
                data-fullname="${_esc(u.fullname || '')}"
                data-gender="${_esc(u.gioi_tinh || 'Nam')}"
                data-phone="${_esc(u.phone || '')}"
                data-email="${_esc(u.email || '')}"
                data-address="${_esc(u.dia_chi || '')}">
                <td>${u.user_id}</td>
                <td>${formatDisplayValue(u.fullname)}</td>
                <td>${formatDisplayValue(u.gioi_tinh)}</td>
                <td>${formatDisplayValue(u.phone)}</td>
                <td>${formatDisplayValue(u.email)}</td>
                <td>${formatDisplayValue(u.dia_chi)}</td>
            </tr>
        `).join('');
    } catch (err) {
        showError('customerTable', 'Không thể tải danh sách khách hàng: ' + err.message);
    }
}

function clearCustomerForm() {
    ['customer-name','customer-phone','customer-email','customer-address'].forEach(id => _setVal(id, ''));
    const g = document.getElementById('customer-gender');
    if (g) g.value = 'Nam';
}

// ============================================================
// TRANG QUẢN LÝ TÀI KHOẢN (QuanLyTaiKhoan.html)
// ============================================================
function setupAccountListeners() {
    document.getElementById('accountTable')?.addEventListener('click', function (e) {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;
        document.querySelectorAll('#accountTable tbody tr').forEach(r => r.classList.remove('row-selected'));
        row.classList.add('row-selected');
        selectedAccountId = row.dataset.id;
        _setVal('fullname',  row.dataset.fullname || '');
        _setVal('username',  row.dataset.email    || '');
        _setVal('password',  '');
        _setVal('phone-acc', row.dataset.phone    || '');
        const sel = document.getElementById('account-type');
        if (sel) sel.value = row.dataset.roleId || '3';
    });

    document.getElementById('btn-them')?.addEventListener('click', async function () {
        const fullname = _getVal('fullname');
        const email    = _getVal('username');
        const password = _getVal('password');
        const phone    = _getVal('phone-acc');
        const role_id  = parseInt(document.getElementById('account-type')?.value || '3', 10);
        if (!fullname || !email || !password || !phone) {
            alert('Vui lòng điền đầy đủ: Họ tên, Email, Mật khẩu, SĐT!'); return;
        }
        try {
            await api.post('/auth/users', { fullname, email, password, phone, role_id });
            alert('Thêm tài khoản thành công!');
            clearAccountForm();
            await loadAccounts();
        } catch (err) { alert(err.message); }
    });

    document.getElementById('btn-cap_nhap')?.addEventListener('click', async function () {
        if (!selectedAccountId) { alert('Vui lòng chọn tài khoản cần cập nhật!'); return; }
        const fullname = _getVal('fullname');
        const email    = _getVal('username');
        const password = _getVal('password');
        const phone    = _getVal('phone-acc');
        const role_id  = parseInt(document.getElementById('account-type')?.value || '3', 10);
        if (!fullname || !email || !phone) { alert('Vui lòng điền đầy đủ: Họ tên, Email, SĐT!'); return; }
        const payload = { fullname, email, phone, role_id };
        if (password) payload.password = password;
        try {
            await api.put(`/auth/users/${selectedAccountId}`, payload);
            alert('Cập nhật thành công!');
            clearAccountForm();
            selectedAccountId = null;
            await loadAccounts();
        } catch (err) { alert(err.message); }
    });

    document.getElementById('btn-xoa')?.addEventListener('click', async function () {
        if (!selectedAccountId) { alert('Vui lòng chọn tài khoản cần xóa!'); return; }
        if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
        try {
            await api.delete(`/auth/users/${selectedAccountId}`);
            alert('Xóa thành công!');
            clearAccountForm();
            selectedAccountId = null;
            await loadAccounts();
        } catch (err) { alert(err.message); }
    });
}

async function loadAccounts() {
    try {
        const res = await api.get('/auth/users');
        const users = res.data || res || [];
        const tbody = document.querySelector('#accountTable tbody');
        if (!tbody) return;
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="${getTableColumnCount('accountTable')}" style="text-align:center">Chưa có tài khoản</td></tr>`;
            return;
        }
        tbody.innerHTML = users.map(u => {
            const roleName = normalizeRoleName(u.role_name);
            return `
            <tr data-id="${u.user_id}"
                data-email="${_esc(u.email || '')}"
                data-role-id="${u.role_id}"
                data-fullname="${_esc(u.fullname || '')}"
                data-phone="${_esc(u.phone || '')}">
                <td>${u.user_id}</td>
                <td>${formatDisplayValue(u.email)}</td>
                <td>••••••••</td>
                <td>${formatDisplayValue(u.role_name)}</td>
                <td>${roleName === 'CUSTOMER' ? (u.user_id || '') : ''}</td>
                <td>${roleName !== 'CUSTOMER' ? (u.user_id || '') : ''}</td>
            </tr>`;
        }).join('');
    } catch (err) {
        showError('accountTable', 'Không thể tải tài khoản: ' + err.message);
    }
}

function clearAccountForm() {
    ['fullname','username','password','phone-acc'].forEach(id => _setVal(id, ''));
    const sel = document.getElementById('account-type');
    if (sel) sel.value = '3';
}

// ============================================================
// TRANG LỊCH SỬ ĐẶT PHÒNG (LichSuDatPhong.html)
// ============================================================
async function loadBookings() {
    try {
        const res = await api.get('/bookings');
        const bookings = res.data || res || [];
        renderBookingTable(bookings);
        setupBookingListeners();
    } catch (err) {
        console.error('loadBookings:', err);
        showError('historyTable', 'Không thể tải lịch sử đặt phòng: ' + err.message);
    }
}

const STATUS_VN = {
    PENDING:   { label: 'Chờ xác nhận',               cls: 'pending'   },
    CONFIRMED: { label: 'Đang thanh toán (tiền mặt)',  cls: 'confirmed' },
    COMPLETED: { label: 'Đã thanh toán',               cls: 'completed' },
    CANCELLED: { label: 'Đã hủy',                      cls: 'cancelled' },
};

function renderBookingTable(bookings) {
    const tbody = document.querySelector('#historyTable tbody');
    if (!tbody) return;
    if (!bookings.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999">Chưa có lịch sử đặt phòng</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const st = STATUS_VN[b.trangThai] || { label: b.trangThai, cls: '' };
        return `
        <tr data-id="${b.booking_id}"
            data-room-number="${_esc(b.room_number || '')}"
            data-room-name="${_esc(b.room_name || '')}"
            data-ma-kh="${b.ma_kh || ''}"
            data-fullname="${_esc(b.fullname || '')}"
            data-trangthai="${b.trangThai}">
            <td>${b.booking_id}</td>
            <td>${b.room_number || ''}</td>
            <td>${b.room_name   || ''}</td>
            <td>${b.ma_kh       || ''}</td>
            <td>${b.fullname    || ''}</td>
            <td class="time-range">
                ${formatDate(b.check_in)}<span class="sep">→</span>${formatDate(b.check_out)}
            </td>
            <td>${b.tong_tien ? formatVND(b.tong_tien) : ''}</td>
            <td><span class="badge badge-${st.cls}">${st.label}</span></td>
        </tr>`;
    }).join('');
}

function setupBookingListeners() {
    // ── Click hàng → điền form ────────────────────────────────
    document.getElementById('historyTable')?.addEventListener('click', function (e) {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;
        document.querySelectorAll('#historyTable tbody tr').forEach(r => r.classList.remove('row-selected'));
        row.classList.add('row-selected');
        selectedBookingId = row.dataset.id;

        _setVal('booking-id-hidden', selectedBookingId);
        _setVal('bk-id',          selectedBookingId);
        _setVal('bk-room-number', row.dataset.roomNumber || '');
        _setVal('bk-room-name',   row.dataset.roomName   || '');
        _setVal('bk-ma-kh',       row.dataset.maKh       || '');
        _setVal('bk-fullname',    row.dataset.fullname   || '');

        const statusSel = document.getElementById('bk-status');
        if (statusSel) statusSel.value = row.dataset.trangthai || 'PENDING';
    });

    // ── Cập nhật trạng thái ───────────────────────────────────
    document.getElementById('btn-capnhat-booking')?.addEventListener('click', async function () {
        if (!selectedBookingId) { alert('Vui lòng chọn đặt phòng cần cập nhật (click vào dòng)!'); return; }
        const newStatus = document.getElementById('bk-status')?.value;
        if (!newStatus) { alert('Vui lòng chọn trạng thái!'); return; }
        try {
            await api.patch(`/bookings/${selectedBookingId}/status`, { trangThai: newStatus });
            alert('Cập nhật trạng thái thành công!');
            clearBookingForm();
            selectedBookingId = null;
            await loadBookings();
        } catch (err) { alert(err.message || 'Lỗi khi cập nhật'); }
    });

    // ── Hủy đặt phòng ────────────────────────────────────────
    document.getElementById('btn-huy-booking')?.addEventListener('click', async function () {
        if (!selectedBookingId) { alert('Vui lòng chọn đặt phòng cần hủy (click vào dòng)!'); return; }
        if (!confirm(`Bạn có chắc muốn HỦY đặt phòng #${selectedBookingId}?\nThao tác này sẽ giải phóng phòng về trạng thái trống.`)) return;
        try {
            await api.patch(`/bookings/${selectedBookingId}/status`, { trangThai: 'CANCELLED' });
            alert('Đã hủy đặt phòng thành công!');
            clearBookingForm();
            selectedBookingId = null;
            await loadBookings();
        } catch (err) { alert(err.message || 'Lỗi khi hủy'); }
    });
}

function clearBookingForm() {
    ['booking-id-hidden','bk-id','bk-room-number','bk-room-name','bk-ma-kh','bk-fullname'].forEach(id => _setVal(id, ''));
    const s = document.getElementById('bk-status');
    if (s) s.value = 'PENDING';
}

// ============================================================
// TRANG THỐNG KÊ THU NHẬP
// ============================================================
async function loadRevenue() {
    try {
        const res = await api.get('/dashboard/revenue/month');
        const data = res.data || res || [];
        const tbody = document.querySelector('#revenueTable tbody');
        if (!tbody) return;
        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Chưa có dữ liệu</td></tr>';
            return;
        }
        let tongTong = 0;
        tbody.innerHTML = data.map(row => {
            tongTong += Number(row.doanhThu || 0);
            return `<tr>
                <td>${row.nam}</td>
                <td>Tháng ${row.thang}</td>
                <td>${row.soGiaoDich}</td>
                <td>${formatVND(row.doanhThu)}</td>
            </tr>`;
        }).join('');
        const totalEl = document.getElementById('totalRevenueText');
        if (totalEl) totalEl.textContent = formatVND(tongTong);
    } catch (err) {
        showError('revenueTable', 'Không thể tải doanh thu: ' + err.message);
    }
}

// ============================================================
// LỌC / TÌM KIẾM
// ============================================================
function filterRooms()     { _filterTable('roomTable',     ['searchRoom'],     [0, 1]); }
function filterCustomers() { _filterTable('customerTable', ['searchCustomer'], [0, 1, 3, 4]); }
function filterAccounts()  { _filterTable('accountTable',  ['searchAccount'],  [0, 1, 3]); }
function searchTable()     { _filterTable('historyTable',  ['searchBooking'],  [0, 1, 4]); }

function filterRevenue() {
    const input  = document.getElementById('searchRevenue');
    const filter = input ? input.value.toLowerCase().trim() : '';
    const table  = document.getElementById('revenueTable');
    if (!table) return;
    let sum = 0;
    Array.from(table.querySelectorAll('tbody tr')).forEach(row => {
        const cells = row.getElementsByTagName('td');
        const text  = Array.from(cells).map(c => c.textContent.toLowerCase()).join(' ');
        const show  = text.includes(filter);
        row.style.display = show ? '' : 'none';
        if (show) sum += parseInt((cells[3]?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
    });
    const el = document.getElementById('totalRevenueText');
    if (el) el.textContent = formatVND(sum);
}

function _filterTable(tableId, inputIds, colIndexes) {
    const filters = inputIds.map(id => {
        const el = document.getElementById(id);
        return el ? el.value.toLowerCase() : '';
    });
    const table = document.getElementById(tableId);
    if (!table) return;
    Array.from(table.querySelectorAll('tbody tr')).forEach(row => {
        const cells = row.getElementsByTagName('td');
        const matched = filters.some(f =>
            colIndexes.some(i => (cells[i]?.textContent || '').toLowerCase().includes(f))
        );
        row.style.display = matched ? '' : 'none';
    });
}

// ============================================================
// TIỆN ÍCH
// ============================================================
function showError(tableId, msg) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${getTableColumnCount(tableId)}" style="color:red;text-align:center">${msg}</td></tr>`;
}
function _getVal(id)       { return (document.getElementById(id)?.value || '').trim(); }
function _setVal(id, val)  { const el = document.getElementById(id); if (el) el.value = val; }
function _setGender(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val === 'Nữ' ? 'Nữ' : 'Nam';
}
function _esc(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


// ============================================================
// SAFE VALUE
// ============================================================
function safeValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return value;
}

function normalizeRoleName(roleName) {
    return String(roleName || '').trim().toUpperCase();
}

function formatDisplayValue(value) {
    const v = safeValue(value);
    return v === '' ? '—' : v;
}

function getTableColumnCount(tableId) {
    const table = document.getElementById(tableId);
    return table?.querySelectorAll('thead th').length || 1;
}
