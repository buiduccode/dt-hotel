const { forbidden } = require('../utils/responseHandler');

// role_id: 1 = ADMIN, 2 = STAFF, 3 = CUSTOMER
const ROLES = { ADMIN: 1, STAFF: 2, CUSTOMER: 3 };

/**
 * Dùng: authorize(ROLES.ADMIN) hoặc authorize(ROLES.ADMIN, ROLES.STAFF)
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return forbidden(res, 'Không có thông tin người dùng');
        }

        const { role_id } = req.user;

        if (!allowedRoles.includes(role_id)) {
            return forbidden(res, 'Bạn không có quyền thực hiện hành động này');
        }

        next();
    };
};

module.exports = { authorize, ROLES };