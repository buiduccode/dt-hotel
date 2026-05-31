const success = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const created = (res, data = null, message = 'Created successfully') => {
    return res.status(201).json({
        success: true,
        message,
        data
    });
};

const error = (res, message = 'Internal Server Error', statusCode = 500, err = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && err ? { detail: err.message } : {})
    });
};

const notFound = (res, message = 'Không tìm thấy dữ liệu') => {
    return res.status(404).json({ success: false, message });
};

const badRequest = (res, message = 'Yêu cầu không hợp lệ') => {
    return res.status(400).json({ success: false, message });
};

const forbidden = (res, message = 'Không có quyền truy cập') => {
    return res.status(403).json({ success: false, message });
};

const unauthorized = (res, message = 'Chưa xác thực') => {
    return res.status(401).json({ success: false, message });
};

module.exports = { success, created, error, notFound, badRequest, forbidden, unauthorized };