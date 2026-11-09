import pool from './db.js';

const profileTables = Object.freeze({
    student: 'student_profiles',
    professor: 'professor_profiles',
    admin: 'admin_profiles'
});

export function getProfileTableForRole(role) {
    if (!Object.hasOwn(profileTables, role)) {
        throw new Error('Unsupported user role');
    }
    return profileTables[role];
}

class User {

    static async findByUsername(username) {
        const [rows] = await pool.execute(
            'SELECT id, username, password_hash, role, is_active FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    }

    static async findPublicById(userId) {
        const [rows] = await pool.execute(
            'SELECT id, username, role, is_active, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (!rows[0]) {
            return undefined;
        }

        let subjects = [];
        if (rows[0].role === 'professor') {
            [subjects] = await pool.execute(
                'SELECT subject FROM professor_subjects WHERE user_id = ? ORDER BY subject',
                [userId]
            );
        }
        const profileQueries = {
            student: 'SELECT enrolled_at AS since FROM student_profiles WHERE user_id = ?',
            professor: 'SELECT approved_at AS since FROM professor_profiles WHERE user_id = ?',
            admin: 'SELECT provisioned_at AS since FROM admin_profiles WHERE user_id = ?'
        };
        const [profiles] = await pool.execute(profileQueries[rows[0].role], [userId]);
        return {
            ...rows[0],
            is_active: Boolean(rows[0].is_active),
            profile: profiles[0] ?? null,
            subjects: subjects.map(({ subject }) => subject)
        };
    }

    static async findAuthById(userId) {
        const [rows] = await pool.execute(
            'SELECT id, username, role, is_active FROM users WHERE id = ?',
            [userId]
        );
        return rows[0];
    }

    static async create(username, passwordHash, role) {
        const profileTable = getProfileTableForRole(role);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.execute(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                [username, passwordHash, role]
            );
            await connection.execute(
                `INSERT INTO ${profileTable} (user_id) VALUES (?)`,
                [result.insertId]
            );
            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async createProfessorApplication(userId, subject) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [users] = await connection.execute(
                'SELECT role, is_active FROM users WHERE id = ? FOR UPDATE',
                [userId]
            );
            if (!users[0] || !Boolean(users[0].is_active)) {
                await connection.rollback();
                return 'not_found';
            }
            if (users[0].role !== 'student' && users[0].role !== 'professor') {
                await connection.rollback();
                return 'not_student';
            }

            const [pending] = await connection.execute(
                `SELECT id FROM professor_applications
                 WHERE user_id = ? AND subject = ? AND status = 'pending' FOR UPDATE`,
                [userId, subject]
            );
            if (pending.length > 0) {
                await connection.rollback();
                return 'pending_exists';
            }
            const [approved] = await connection.execute(
                'SELECT user_id FROM professor_subjects WHERE user_id = ? AND subject = ? FOR UPDATE',
                [userId, subject]
            );
            if (approved.length > 0) {
                await connection.rollback();
                return 'already_assigned';
            }

            const [result] = await connection.execute(
                `INSERT INTO professor_applications (user_id, subject)
                 VALUES (?, ?)`,
                [userId, subject]
            );
            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getProfessorApplications(userId = null, status = null) {
        const conditions = [];
        const values = [];
        if (userId !== null) {
            conditions.push('a.user_id = ?');
            values.push(userId);
        }
        if (status !== null) {
            conditions.push('a.status = ?');
            values.push(status);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await pool.execute(`
            SELECT a.id, a.user_id, u.username, a.subject, a.status,
                   a.reviewed_by, reviewer.username AS reviewed_by_username,
                   a.reviewed_at, a.created_at
            FROM professor_applications a
            JOIN users u ON u.id = a.user_id
            LEFT JOIN users reviewer ON reviewer.id = a.reviewed_by
            ${where}
            ORDER BY a.created_at DESC, a.id DESC
        `, values);
        return rows;
    }

    static async reviewProfessorApplication(applicationId, adminId, approve) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [applications] = await connection.execute(`
                SELECT id, user_id, subject, status
                FROM professor_applications
                WHERE id = ?
                FOR UPDATE
            `, [applicationId]);
            const application = applications[0];
            if (!application) {
                await connection.rollback();
                return 'not_found';
            }
            if (application.status !== 'pending') {
                await connection.rollback();
                return 'already_reviewed';
            }

            const [users] = await connection.execute(
                'SELECT role, is_active FROM users WHERE id = ? FOR UPDATE',
                [application.user_id]
            );
            if (
                !users[0] ||
                !Boolean(users[0].is_active) ||
                (users[0].role !== 'student' && users[0].role !== 'professor')
            ) {
                await connection.rollback();
                return 'account_unavailable';
            }

            await connection.execute(`
                UPDATE professor_applications
                SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [approve ? 'approved' : 'rejected', adminId, applicationId]);

            if (approve) {
                await connection.execute(`
                    INSERT INTO professor_subjects (user_id, subject, approved_by)
                    VALUES (?, ?, ?)
                `, [application.user_id, application.subject, adminId]);
                if (users[0].role === 'student') {
                    await connection.execute(
                        'UPDATE users SET role = ? WHERE id = ?',
                        ['professor', application.user_id]
                    );
                    await connection.execute(
                        'DELETE FROM student_profiles WHERE user_id = ?',
                        [application.user_id]
                    );
                }
                await connection.execute(
                    'INSERT INTO professor_profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)',
                    [application.user_id]
                );
            }

            await connection.commit();
            return 'reviewed';
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

}

export default User;