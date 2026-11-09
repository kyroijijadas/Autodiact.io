import pool from './db.js';

export default class QuizAccessRequest {
    static async getForStudent(studentId) {
        const [rows] = await pool.execute(`
            SELECT quiz_id, status
            FROM quiz_access_requests
            WHERE student_id = ?
        `, [studentId]);
        return rows;
    }

    static async getForProfessor(professorId) {
        const [rows] = await pool.execute(`
            SELECT request.id, request.quiz_id, request.status, request.requested_at,
                   quiz.title AS quiz_title, quiz.subject,
                   student.username AS student_username
            FROM quiz_access_requests request
            JOIN quizzes quiz ON quiz.id = request.quiz_id
            JOIN users student ON student.id = request.student_id
            WHERE quiz.created_by = ? AND request.status = 'pending'
            ORDER BY request.requested_at ASC, request.id ASC
        `, [professorId]);
        return rows;
    }

    static async request(studentId, quizId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [quizzes] = await connection.execute(`
                SELECT id, created_by
                FROM quizzes
                WHERE id = ? AND is_active = TRUE
                FOR UPDATE
            `, [quizId]);
            const quiz = quizzes[0];
            if (!quiz || !quiz.created_by) {
                await connection.rollback();
                return { unavailable: true };
            }

            const [requests] = await connection.execute(`
                SELECT id, status
                FROM quiz_access_requests
                WHERE quiz_id = ? AND student_id = ?
                FOR UPDATE
            `, [quizId, studentId]);
            const existing = requests[0];
            if (existing?.status === 'approved' || existing?.status === 'pending') {
                await connection.rollback();
                return { status: existing.status };
            }

            if (existing) {
                await connection.execute(`
                    UPDATE quiz_access_requests
                    SET status = 'pending', requested_at = CURRENT_TIMESTAMP,
                        reviewed_by = NULL, reviewed_at = NULL
                    WHERE id = ?
                `, [existing.id]);
            } else {
                await connection.execute(`
                    INSERT INTO quiz_access_requests (quiz_id, student_id)
                    VALUES (?, ?)
                `, [quizId, studentId]);
            }

            await connection.commit();
            return { status: 'pending' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async review(professorId, requestId, status) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [requests] = await connection.execute(`
                SELECT request.id, request.status
                FROM quiz_access_requests request
                JOIN quizzes quiz ON quiz.id = request.quiz_id
                WHERE request.id = ? AND quiz.created_by = ?
                FOR UPDATE
            `, [requestId, professorId]);
            const request = requests[0];
            if (!request) {
                await connection.rollback();
                return { notFound: true };
            }
            if (request.status !== 'pending') {
                await connection.rollback();
                return { alreadyReviewed: true };
            }

            await connection.execute(`
                UPDATE quiz_access_requests
                SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, professorId, requestId]);
            await connection.commit();
            return { status };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
