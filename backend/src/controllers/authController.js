const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { sql } = require('../config/db');

async function hasExtraUserColumns(){
 try{
 const r=await sql.query`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users'`;
const cols = result.recordset.map(
    c => c.COLUMN_NAME.toLowerCase()
);
 }catch(e){}
}
const { success, error: errRes } = require('../utils/responseHandler');

// ── ĐĂNG KÝ (khách hàng tự đăng ký) ──────────────────────────
const register = async (req, res) => {
    try {
        const { fullname, email, password, phone } = req.body;

        if (!fullname || !email || !password || !phone) {
            return errRes(res, 'Vui lòng điền đầy đủ thông tin', 400);
        }

        const checkUser = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
        if (checkUser.recordset.length > 0) {
            return errRes(res, 'Email đã tồn tại', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await sql.query`
            INSERT INTO Users(fullname, email, password_hash, phone, role_id)
            VALUES(${fullname}, ${email}, ${password_hash}, ${phone}, 3)
        `;

        res.status(201).json({ message: 'Register success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── ĐĂNG NHẬP ─────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
        if (result.recordset.length === 0) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login success',
            token,
            user: {
                user_id: user.user_id,
                fullname: user.fullname,
                email: user.email,
                role_id: user.role_id
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── XEM PROFILE ────────────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const { user_id } = req.user;
        const result = await sql.query`
            SELECT u.user_id, u.fullname, u.email, u.phone, u.create_at,
                   u.gioi_tinh, u.dia_chi, r.role_name
            FROM Users u
            JOIN Roles r ON u.role_id = r.role_id
            WHERE u.user_id = ${user_id}
        `;
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── CẬP NHẬT PROFILE ──────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { fullname, phone, gioi_tinh, dia_chi } = req.body;

        await sql.query`
            UPDATE Users
            SET fullname  = ${fullname},
                phone     = ${phone},
                gioi_tinh = ${gioi_tinh || null},
                dia_chi   = ${dia_chi || null}
            WHERE user_id = ${user_id}
        `;
        res.status(200).json({ message: 'Cập nhật thông tin thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── ĐỔI MẬT KHẨU ─────────────────────────────────────────────
const changePassword = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { oldPassword, newPassword } = req.body;

        const result = await sql.query`SELECT * FROM Users WHERE user_id = ${user_id}`;
        const user = result.recordset[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await sql.query`UPDATE Users SET password_hash = ${password_hash} WHERE user_id = ${user_id}`;
        res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── LẤY TẤT CẢ USERS (Admin/Staff) ────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        let hasCols=false;
        try{ const c=await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users'"); const n=c.recordset.map(x=>String(x.COLUMN_NAME).toLowerCase()); hasCols=n.includes('gioi_tinh')&&n.includes('dia_chi'); }catch(e){}
        const result = hasCols ? await sql.query`SELECT u.user_id,u.fullname,u.email,u.phone,u.create_at,u.gioi_tinh,u.dia_chi,u.role_id,r.role_name FROM Users u JOIN Roles r ON u.role_id=r.role_id ORDER BY u.user_id DESC` : await sql.query`SELECT u.user_id,u.fullname,u.email,u.phone,u.create_at,u.role_id,r.role_name FROM Users u JOIN Roles r ON u.role_id=r.role_id ORDER BY u.user_id DESC`;

        // ✅ wrap đúng chuẩn responseHandler → frontend dùng res.data
        return success(res, result.recordset);
    } catch (err) {
        return errRes(res, err.message, 500, err);
    }
};

// ── TẠO USER MỚI (Admin only) ──────────────────────────────────
const createUser = async (req, res) => {
    try {
        const { fullname, email, password, phone, role_id, gioi_tinh, dia_chi } = req.body;

        if (!fullname || !email || !password || !phone || !role_id) {
            return errRes(res, 'Vui lòng điền đầy đủ: họ tên, email, mật khẩu, SĐT, loại TK', 400);
        }

        const check = await sql.query`SELECT user_id FROM Users WHERE email = ${email}`;
        if (check.recordset.length > 0) {
            return errRes(res, 'Email đã tồn tại', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const rid = parseInt(role_id, 10);

        await sql.query`
            INSERT INTO Users(fullname, email, password_hash, phone, role_id, gioi_tinh, dia_chi)
            VALUES(${fullname}, ${email}, ${password_hash}, ${phone}, ${rid},
                   ${gioi_tinh || null}, ${dia_chi || null})
        `;

        return success(res, null, 'Tạo tài khoản thành công', 201);
    } catch (err) {
        return errRes(res, err.message, 500, err);
    }
};

// ── CẬP NHẬT USER (Admin/Staff) ────────────────────────────────
const updateUser = async (req, res) => {
    try {
        const id  = parseInt(req.params.id, 10);
        const { fullname, email, password, phone, role_id, gioi_tinh, dia_chi } = req.body;

        const check = await sql.query`SELECT user_id FROM Users WHERE user_id = ${id}`;
        if (check.recordset.length === 0) {
            return errRes(res, 'Không tìm thấy tài khoản', 404);
        }

        const rid = parseInt(role_id, 10);

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            await sql.query`
                UPDATE Users
                SET fullname = ${fullname}, email = ${email},
                    password_hash = ${password_hash}, phone = ${phone},
                    role_id = ${rid}, gioi_tinh = ${gioi_tinh || null},
                    dia_chi = ${dia_chi || null}
                WHERE user_id = ${id}
            `;
        } else {
            await sql.query`
                UPDATE Users
                SET fullname = ${fullname}, email = ${email},
                    phone = ${phone}, role_id = ${rid},
                    gioi_tinh = ${gioi_tinh || null}, dia_chi = ${dia_chi || null}
                WHERE user_id = ${id}
            `;
        }

        return success(res, null, 'Cập nhật tài khoản thành công');
    } catch (err) {
        return errRes(res, err.message, 500, err);
    }
};

// ── XÓA USER (Admin only) ──────────────────────────────────────
const deleteUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        const check = await sql.query`SELECT user_id FROM Users WHERE user_id = ${id}`;
        if (check.recordset.length === 0) {
            return errRes(res, 'Không tìm thấy tài khoản', 404);
        }

        await sql.query`DELETE FROM Users WHERE user_id = ${id}`;
        return success(res, null, 'Xóa tài khoản thành công');
    } catch (err) {
        return errRes(res, err.message, 500, err);
    }
};

module.exports = {
    register, login,
    getProfile, updateProfile, changePassword,
    getAllUsers, createUser, updateUser, deleteUser
};
