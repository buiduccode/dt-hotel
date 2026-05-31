// ============================================================
//  auth.js – Xử lý các trang: login, SignUp, changePass, forgotpass
//  Yêu cầu: nhúng /assets/js/api.js TRƯỚC file này
// ============================================================

// ────────────────────────────────────────────────────────────
// 1. TRANG ĐĂNG NHẬP (login.html)
// ────────────────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    if (isLoggedIn()) {
        const u = getUser();
        window.location.href = u?.role_id === 1 || u?.role_id === 2
            ? '/pages/admin/QuanLyTaiKhoan.html'
            : '/pages/customer/Trangchu.html';
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        const email    = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Đang đăng nhập...';

        try {
            const res = await api.post('/auth/login', { email, password });
            // authController trả thẳng { token, user } không bọc data
            saveToken(res.token);
            saveUser(res.user);

            // FIX: dùng res.user thay vì res.data.user
            const role = res.user.role_id;
            if (role === 1 || role === 2) {
                window.location.href = '/pages/admin/QuanLyTaiKhoan.html';
            } else {
                window.location.href = '/pages/customer/Trangchu.html';
            }
        } catch (err) {
            alert(err.message || 'Đăng nhập thất bại, vui lòng thử lại.');
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Đăng nhập';
        }
    });
}

// ────────────────────────────────────────────────────────────
// 2. TRANG ĐĂNG KÝ (SignUp.html)
// ────────────────────────────────────────────────────────────
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btnSubmit = registerForm.querySelector('button[type="submit"]');

        const fullname    = document.getElementById('fullname').value.trim();
        const phone       = document.getElementById('phone').value.trim();
        const email       = document.getElementById('email').value.trim();
        const password    = document.getElementById('password').value;
        const rePassword  = document.getElementById('re-password').value;

        if (password !== rePassword) {
            alert('Mật khẩu nhập lại không trùng khớp!');
            document.getElementById('re-password').value = '';
            document.getElementById('re-password').focus();
            return;
        }
        if (password.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Đang đăng ký...';

        try {
            await api.post('/auth/register', { fullname, email, password, phone, role_id: 3 });
            alert('Đăng ký thành công! Hệ thống chuyển về trang đăng nhập.');
            window.location.href = 'login.html';
        } catch (err) {
            alert(err.message || 'Đăng ký thất bại, vui lòng thử lại.');
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Đăng ký';
        }
    });
}

// ────────────────────────────────────────────────────────────
// 3. TRANG ĐỔI MẬT KHẨU (changePass.html)
// ────────────────────────────────────────────────────────────
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
    requireLogin();

    changePasswordForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btnSubmit  = changePasswordForm.querySelector('button[type="submit"]');
        const oldPassword = document.getElementById('old-password')?.value
                         || document.getElementById('current-password')?.value || '';
        const newPassword    = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert('Mật khẩu nhập lại không trùng khớp!');
            document.getElementById('confirm-password').value = '';
            document.getElementById('confirm-password').focus();
            return;
        }
        if (newPassword.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Đang xử lý...';

        try {
            await api.put('/auth/change-password', { oldPassword, newPassword });
            alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            clearAuth();
            window.location.href = 'login.html';
        } catch (err) {
            alert(err.message || 'Đổi mật khẩu thất bại.');
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Xác nhận';
        }
    });
}

// ────────────────────────────────────────────────────────────
// 4. TRANG QUÊN MẬT KHẨU (forgotpass.html)
// ────────────────────────────────────────────────────────────
const phoneForm = document.getElementById('phoneForm');
if (phoneForm) {
    phoneForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const phone = document.getElementById('phone').value.trim();
        if (!phone) { alert('Vui lòng nhập số điện thoại!'); return; }
        alert('Tính năng quên mật khẩu đang được phát triển.\nVui lòng liên hệ nhân viên khách sạn để được hỗ trợ.');
    });
}

// ────────────────────────────────────────────────────────────
// 5. TIỆN ÍCH: Ẩn/Hiện mật khẩu
// ────────────────────────────────────────────────────────────
function bindTogglePassword(toggleId, inputId) {
    const btn = document.getElementById(toggleId);
    if (!btn) return;
    btn.addEventListener('click', function () {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            this.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
            input.type = 'password';
            this.classList.replace('fa-eye', 'fa-eye-slash');
        }
    });
}
bindTogglePassword('togglePassword', 'password');
bindTogglePassword('toggleRePassword', 're-password');
