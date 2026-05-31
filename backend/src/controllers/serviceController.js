const { sql } = require('../config/db');

// Lấy tất cả dịch vụ
const getAllServices = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT services_id, name_services, gia FROM Services ORDER BY name_services
        `;
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thêm dịch vụ mới (admin)
const createService = async (req, res) => {
    try {
        const { name_services, gia } = req.body;

        if (!name_services || !gia) {
            return res.status(400).json({ message: 'Vui lòng nhập tên và giá dịch vụ' });
        }

        await sql.query`
            INSERT INTO Services (name_services, gia) VALUES (${name_services}, ${gia})
        `;

        res.status(201).json({ message: 'Thêm dịch vụ thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật dịch vụ (admin)
const updateService = async (req, res) => {
    try {
        const { services_id } = req.params;
        const { name_services, gia } = req.body;

        const existing = await sql.query`
            SELECT * FROM Services WHERE services_id = ${services_id}
        `;
        if (existing.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
        }

        await sql.query`
            UPDATE Services SET name_services = ${name_services}, gia = ${gia}
            WHERE services_id = ${services_id}
        `;

        res.status(200).json({ message: 'Cập nhật dịch vụ thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xoá dịch vụ (admin)
const deleteService = async (req, res) => {
    try {
        const { services_id } = req.params;

        const existing = await sql.query`
            SELECT * FROM Services WHERE services_id = ${services_id}
        `;
        if (existing.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
        }

        await sql.query`DELETE FROM Services WHERE services_id = ${services_id}`;
        res.status(200).json({ message: 'Xoá dịch vụ thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thêm dịch vụ cho booking (customer/staff)
const addServiceToBooking = async (req, res) => {
    try {
        const { booking_id, service_id, soLuong } = req.body;

        if (soLuong <= 0) {
            return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
        }

        // Kiểm tra booking tồn tại và còn active
        const booking = await sql.query`
            SELECT * FROM Bookings WHERE booking_id = ${booking_id}
        `;
        if (booking.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy booking' });
        }
        const validStatus = ['CONFIRMED', 'PENDING'];
        if (!validStatus.includes(booking.recordset[0].trangThai)) {
            return res.status(400).json({ message: 'Không thể thêm dịch vụ cho booking này' });
        }

        // Kiểm tra dịch vụ tồn tại
        const service = await sql.query`
            SELECT * FROM Services WHERE services_id = ${service_id}
        `;
        if (service.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
        }

        // Nếu đã có → cộng thêm số lượng
        const existing = await sql.query`
            SELECT * FROM ServiceUsages
            WHERE booking_id = ${booking_id} AND service_id = ${service_id}
        `;

        if (existing.recordset.length > 0) {
            await sql.query`
                UPDATE ServiceUsages
                SET soLuong = soLuong + ${soLuong}
                WHERE booking_id = ${booking_id} AND service_id = ${service_id}
            `;
        } else {
            await sql.query`
                INSERT INTO ServiceUsages (booking_id, service_id, soLuong)
                VALUES (${booking_id}, ${service_id}, ${soLuong})
            `;
        }

        res.status(201).json({ message: 'Thêm dịch vụ vào booking thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy dịch vụ đã dùng theo booking
const getServicesByBooking = async (req, res) => {
    try {
        const { booking_id } = req.params;

        const result = await sql.query`
            SELECT su.usage_id, s.name_services, s.gia, su.soLuong,
                   (s.gia * su.soLuong) AS thanhTien
            FROM ServiceUsages su
            JOIN Services s ON su.service_id = s.services_id
            WHERE su.booking_id = ${booking_id}
        `;

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllServices,
    createService,
    updateService,
    deleteService,
    addServiceToBooking,
    getServicesByBooking
};