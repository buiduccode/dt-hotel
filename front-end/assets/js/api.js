// front-end/assets/js/api.js  –  BASE_URL tự động theo môi trường
// ============================================================

// ── Tự nhận biết môi trường ──────────────────────────────────
// - Khi chạy local:  localhost → dùng localhost:5000
// - Khi deploy:      thay RENDER_BACKEND_URL bằng URL thật từ Render
const BASE_URL = (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // ⬇️  THAY THẾ bằng URL backend thật sau khi deploy lên Render
    return 'https://YOUR-BACKEND-NAME.onrender.com/api';
})();

// ── Token helpers ────────────────────────────────────────────
const getToken  = ()        => localStorage.getItem('token');
const saveToken = (token)   => localStorage.setItem('token', token);
const saveUser  = (user)    => localStorage.setItem('currentUser', JSON.stringify(user));
const getUser   = ()        => JSON.parse(localStorage.getItem('currentUser') || 'null');
const clearAuth = ()        => { localStorage.removeItem('token'); localStorage.removeItem('currentUser'); };
const isLoggedIn = ()       => !!getToken();

// ── Fetch wrapper ────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) throw { status: res.status, message: data.message || 'Lỗi không xác định' };
    return data;
}

// ── Shorthand methods ────────────────────────────────────────
const api = {
    get:    (path)         => apiFetch(path, { method: 'GET' }),
    post:   (path, body)   => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
    put:    (path, body)   => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
    patch:  (path, body)   => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: (path)         => apiFetch(path, { method: 'DELETE' }),
};

// ── Bảo vệ trang – chuyển hướng nếu chưa đăng nhập ─────────
function requireLogin(redirectTo = '/pages/auth/login.html') {
    if (!isLoggedIn()) {
        alert('Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.');
        window.location.href = redirectTo;
    }
}

// ── Bảo vệ trang admin ───────────────────────────────────────
function requireAdmin() {
    requireLogin();
    const user = getUser();
    if (!user || (user.role_id !== 1 && user.role_id !== 2)) {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = '/pages/customer/Trangchu.html';
    }
}

// ── Hiển thị tên user lên navbar ────────────────────────────
function renderAuthNav() {
    const user = getUser();
    const authContent = document.getElementById('auth-content');
    if (!authContent) return;
    if (user) {
        authContent.innerHTML = `<p style="margin:0;font-weight:600;">${user.fullname || user.email}</p>`;
    }
}

// ── Format tiền VNĐ ─────────────────────────────────────────
function formatVND(amount) {
    return Number(amount).toLocaleString('vi-VN') + ' đ';
}

// ── Format ngày ─────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ── Ảnh phòng dùng chung cho toàn bộ frontend ────────────────
const _ROOM_IMGS = {
    standard:  [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1586105251261-72a756497a11?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?fit=crop&auto=format',
    ],
    superior:  [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?fit=crop&auto=format',
    ],
    deluxe:    [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?fit=crop&auto=format',
    ],
    double:    [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?fit=crop&auto=format',
    ],
    family:    [
        'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?fit=crop&auto=format',
    ],
    suite:     [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?fit=crop&auto=format',
    ],
    vip:       [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1631049035634-990f8f9e5f87?fit=crop&auto=format',
    ],
    penthouse: [
        'https://images.unsplash.com/photo-1631049035634-990f8f9e5f87?fit=crop&auto=format',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?fit=crop&auto=format',
    ],
};

function getRoomImage(roomName, roomId, size) {
    const n = (roomName || '').toLowerCase();
    let arr;
    if      (n.includes('penthouse'))                         arr = _ROOM_IMGS.penthouse;
    else if (n.includes('vip'))                               arr = _ROOM_IMGS.vip;
    else if (n.includes('suite'))                             arr = _ROOM_IMGS.suite;
    else if (n.includes('family') || n.includes('gia đình')) arr = _ROOM_IMGS.family;
    else if (n.includes('deluxe'))                            arr = _ROOM_IMGS.deluxe;
    else if (n.includes('superior'))                          arr = _ROOM_IMGS.superior;
    else if (n.includes('double') || n.includes('đôi'))       arr = _ROOM_IMGS.double;
    else                                                      arr = _ROOM_IMGS.standard;

    const base = arr[(roomId || 0) % arr.length];
    const [w, h] = (size === 'large') ? [700, 420] : [400, 220];
    return base + `&w=${w}&h=${h}`;
}