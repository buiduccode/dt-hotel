const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/userRepository');
const { generateToken } = require('../utils/generateToken');

const register = async ({ fullname, email, password, phone, role_id = 3 }) => {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw { statusCode: 400, message: 'Email đã được sử dụng' };

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user_id = await userRepo.create({ fullname, email, password_hash, phone, role_id });
    return { user_id };
};

const login = async ({ email, password }) => {
    const user = await userRepo.findByEmail(email);
    if (!user) throw { statusCode: 400, message: 'Email không tồn tại' };

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw { statusCode: 400, message: 'Mật khẩu không đúng' };

    const token = generateToken({ user_id: user.user_id, role_id: user.role_id });
    return {
        token,
        user: {
            user_id: user.user_id,
            fullname: user.fullname,
            email: user.email,
            role_id: user.role_id
        }
    };
};

const getProfile = async (user_id) => {
    const user = await userRepo.findById(user_id);
    if (!user) throw { statusCode: 404, message: 'Không tìm thấy người dùng' };
    return user;
};

const updateProfile = async (user_id, { fullname, phone }) => {
    await userRepo.update(user_id, { fullname, phone });
};

const changePassword = async (user_id, { oldPassword, newPassword }) => {
    const user = await userRepo.findByEmail(
        (await userRepo.findById(user_id)).email
    );
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) throw { statusCode: 400, message: 'Mật khẩu cũ không đúng' };

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await userRepo.updatePassword(user_id, password_hash);
};

module.exports = { register, login, getProfile, updateProfile, changePassword };