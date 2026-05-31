// 404 – route không tồn tại
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} không tồn tại`
    });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.stack || err.message}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Lỗi máy chủ nội bộ';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
};

module.exports = { notFoundHandler, errorHandler };