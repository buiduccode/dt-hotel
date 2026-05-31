const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middlewares/errorMiddleware');
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

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const publicPath = path.resolve(__dirname, '../../front-end');
app.use(express.static(publicPath));

app.use('/api/auth',       authRoutes);
app.use('/api/bookings',   bookingRoutes);
app.use('/api/checkin',    checkinRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/rooms',      roomRoutes);
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/services',   serviceRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(errorHandler);
module.exports = app;