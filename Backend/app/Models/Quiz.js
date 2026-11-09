import pool from './db.js';

async function insertQuestions(connection, quizId, questions) {
    for (const question of questions) {
        const [result] = await connection.execute(
            'INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)',
            [quizId, question.text]
        );
        const placeholders = question.options.map(() => '(?, ?, ?)').join(', ');
        const values = question.options.flatMap((option) => [
            result.insertId,
            option.text,
            option.is_correct
        ]);
        await connection.execute(
            `INSERT INTO options (question_id, option_text, is_correct) VALUES ${placeholders}`,
            values
        );
    }
}

export default class Quiz {
    static async create(title, description, subject, timeLimitSeconds, creatorId, questions) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [approvedSubjects] = await connection.execute(
                'SELECT subject FROM professor_subjects WHERE user_id = ? AND subject = ? FOR UPDATE',
                [creatorId, subject]
            );
            if (!approvedSubjects[0]) {
                const error = new Error('Professor is not approved for this subject');
                error.code = 'SUBJECT_NOT_APPROVED';
                throw error;
            }

            const [result] = await connection.execute(`
                INSERT INTO quizzes
                    (title, description, subject, time_limit_seconds, created_by, is_active)
                VALUES (?, ?, ?, ?, ?, TRUE)
            `, [title, description, subject, timeLimitSeconds, creatorId]);
            await insertQuestions(connection, result.insertId, questions);
            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getAllQuizzes() {
        const [rows] = await pool.execute(`
            SELECT q.id, q.title, q.description, q.subject, q.time_limit_seconds, q.created_at,
                   q.created_by,
                   COUNT(question.id) AS question_count
            FROM quizzes q
            LEFT JOIN questions question ON question.quiz_id = q.id
            WHERE q.is_active = TRUE AND q.created_by IS NOT NULL
            GROUP BY q.id
            ORDER BY q.created_at DESC, q.id DESC
        `);
        return rows;
    }

    static async getMine(creatorId) {
        const [rows] = await pool.execute(`
            SELECT q.id, q.title, q.description, q.subject, q.time_limit_seconds, q.created_at,
                   COUNT(question.id) AS question_count
            FROM quizzes q
            LEFT JOIN questions question ON question.quiz_id = q.id
            WHERE q.created_by = ?
            GROUP BY q.id
            ORDER BY q.created_at DESC, q.id DESC
        `, [creatorId]);
        return rows;
    }
}
