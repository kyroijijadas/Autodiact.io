import '../config.js';
import bcrypt from 'bcrypt';
import pool from '../app/Models/db.js';

const username = 'admin';
const password = process.env.ADMIN_INITIAL_PASSWORD;

if (
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
) {
    console.error('Set ADMIN_INITIAL_PASSWORD to a password between 8 and 72 bytes.');
    process.exitCode = 1;
} else {
    const connection = await pool.getConnection();
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        await connection.beginTransaction();
        const [users] = await connection.execute(
            'SELECT id FROM users WHERE username = ? FOR UPDATE',
            [username]
        );

        let userId;
        if (users[0]) {
            userId = users[0].id;
            await connection.execute(
                `UPDATE users
                 SET password_hash = ?, role = 'admin', is_active = TRUE
                 WHERE id = ?`,
                [passwordHash, userId]
            );
            await connection.execute('DELETE FROM student_profiles WHERE user_id = ?', [userId]);
            await connection.execute('DELETE FROM professor_profiles WHERE user_id = ?', [userId]);
            await connection.execute('DELETE FROM professor_subjects WHERE user_id = ?', [userId]);
        } else {
            const [result] = await connection.execute(
                `INSERT INTO users (username, password_hash, role, is_active)
                 VALUES (?, ?, 'admin', TRUE)`,
                [username, passwordHash]
            );
            userId = result.insertId;
        }

        await connection.execute(
            'INSERT INTO admin_profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)',
            [userId]
        );
        await connection.commit();
        console.log('Admin account provisioned successfully.');
    } catch (error) {
        await connection.rollback();
        console.error('Failed to provision the admin account:', error.message);
        process.exitCode = 1;
    } finally {
        connection.release();
        await pool.end();
    }
}
