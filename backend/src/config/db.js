// backend/src/config/db.js  –  hỗ trợ cả local SQL Server và Azure SQL
const sql = require('mssql');
require('dotenv').config();

const isAzure = process.env.DB_SERVER && process.env.DB_SERVER.includes('.database.windows.net');

const config = {
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server:   process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port:     parseInt(process.env.DB_PORT) || 1433,

    options: {
        // Azure SQL bắt buộc encrypt: true
        // Local SQL Server có thể dùng false
        encrypt: isAzure ? true : false,
        trustServerCertificate: !isAzure,
    },

    // Azure SQL cần connection pool lớn hơn
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log(`SQL Server Connected (${isAzure ? 'Azure' : 'Local'})`);
    } catch (error) {
        console.error('DB Connection Error:', error.message);
        // Không crash app, thử lại sau 5 giây
        setTimeout(connectDB, 5000);
    }
};

module.exports = { sql, connectDB };