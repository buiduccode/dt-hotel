// backend/src/app.js  –  cập nhật CORS cho production
const express = require('express');
const cors = require('cors');
const path = require('path');

const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

const authRoutes      = require('./routes/authRoutes');
const bookingRoutes   = require('./routes/bookingRoutes');
const checkinRoutes   = require('./routes/checkinRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const reviewRoutes    = require('./routes/reviewRoutes');
const roomRoutes      = require('./routes/roomRoutes');
const roomTypeRoutes  = require('./routes/roomTypeRoutes');
const serviceRoutes   = require('./routes/serviceRoutes');

const app = express();

// ── CORS: cho phép cả localhost (dev) và frontend thật (production) ──
const allowedOrigins = [
    // Localhost dev
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    // Netlify – thay bằng URL thật của bạn
    process.env.FRONTEND_URL,
    // GitHub Pages – thay bằng URL thật của bạn (nếu dùng)
    process.env.GITHUB_PAGES_URL,
].filter(Boolean); // loại bỏ undefined

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép request không có origin (Postman, curl, v.v.)
        if (!origin) return callback(null, true);
        const allowed = allowedOrigins.some(o =>
            o instanceof RegExp ? o.test(origin) : o === origin
        );
        if (allowed) return callback(null, true);
        callback(new Error('CORS: origin không được phép: ' + origin));
    },
    credentials: true
}));

app.use(express.json());

// Static files (chỉ dùng khi chạy local, trên Render không cần)
if (process.env.NODE_ENV !== 'production') {
    const publicPath = path.resolve(__dirname, '../../front-end');
    app.use(express.static(publicPath));
    app.get('/{*splat}', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(publicPath, 'index.html'));
        }
    });
}

app.use('/api/auth',       authRoutes);
app.use('/api/bookings',   bookingRoutes);
app.use('/api/checkin',    checkinRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/rooms',      roomRoutes);
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/services',   serviceRoutes);

// Health check – Render dùng để kiểm tra service còn sống
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;