const { verifyToken } = require('../utils/generateToken');
const { unauthorized } = require('../utils/responseHandler');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return unauthorized(res, 'Token không tồn tại hoặc không đúng định dạng');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        req.user = decoded; // { user_id, role_id }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return unauthorized(res, 'Token đã hết hạn, vui lòng đăng nhập lại');
        }
        return unauthorized(res, 'Token không hợp lệ');
    }
};

module.exports = { authenticate };