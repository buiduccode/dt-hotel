const { sql } = require('../config/db');

const findByEmail = async (email) => {
    const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
    return result.recordset[0] || null;
};

const findById = async (user_id) => {
    const result = await sql.query`
        SELECT u.user_id, u.fullname, u.email, u.phone, u.create_at, r.role_name
        FROM Users u
        JOIN Roles r ON u.role_id = r.role_id
        WHERE u.user_id = ${user_id}
    `;
    return result.recordset[0] || null;
};

const create = async ({ fullname, email, password_hash, phone, role_id }) => {
    const result = await sql.query`
        INSERT INTO Users (fullname, email, password_hash, phone, role_id)
        OUTPUT INSERTED.user_id
        VALUES (${fullname}, ${email}, ${password_hash}, ${phone}, ${role_id})
    `;
    return result.recordset[0].user_id;
};

const findAll = async () => {
    const result = await sql.query`
        SELECT u.user_id, u.fullname, u.email, u.phone, u.create_at, r.role_name
        FROM Users u
        JOIN Roles r ON u.role_id = r.role_id
        ORDER BY u.create_at DESC
    `;
    return result.recordset;
};

const update = async (user_id, { fullname, phone }) => {
    await sql.query`
        UPDATE Users SET fullname = ${fullname}, phone = ${phone}
        WHERE user_id = ${user_id}
    `;
};

const updatePassword = async (user_id, password_hash) => {
    await sql.query`
        UPDATE Users SET password_hash = ${password_hash} WHERE user_id = ${user_id}
    `;
};

const remove = async (user_id) => {
    await sql.query`DELETE FROM Users WHERE user_id = ${user_id}`;
};

module.exports = { findByEmail, findById, create, findAll, update, updatePassword, remove };