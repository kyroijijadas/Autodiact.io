import pool from './db.js';
import { gradeAnswers } from './Result.js';

function invalidAnswers() {
    const error = new Error('Submitted answers do not match the quiz');
    error.code = 'INVALID_ANSWERS';
    return error;
}

function quizNotReady() {
    const error = new Error('Quiz is not ready for attempts');
    error.code = 'QUIZ_NOT_READY';
    return error;
}

export default class QuizAttempt {
    static async start(userId, quizId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [quizzes] = await connection.execute(`
                SELECT id, title, description, time_limit_seconds, created_by
                FROM quizzes
                WHERE id = ? AND is_active = TRUE
                FOR UPDATE
            `, [quizId]);
            const quiz = quizzes[0];
            if (!quiz) {
                await connection.rollback();
                return null;
            }

            if (quiz.created_by === null) {
                await connection.rollback();
                return null;
            }

            const [accessRequests] = await connection.execute(`
                SELECT status
                FROM quiz_access_requests
                WHERE quiz_id = ? AND student_id = ?
                FOR UPDATE
            `, [quizId, userId]);
            if (accessRequests[0]?.status !== 'approved') {
                const error = new Error('Professor approval is required to take this quiz');
                error.code = 'QUIZ_ACCESS_NOT_APPROVED';
                throw error;
            }

            if (
                !Number.isSafeInteger(quiz.time_limit_seconds) ||
                quiz.time_limit_seconds < 60 ||
                quiz.time_limit_seconds > 86400
            ) {
                throw quizNotReady();
            }

            const [rows] = await connection.execute(`
                SELECT q.id AS question_id, q.question_text,
                       o.id AS option_id, o.option_text, o.is_correct
                FROM questions q
                JOIN options o ON o.question_id = q.id
                WHERE q.quiz_id = ?
                ORDER BY q.id, o.id
            `, [quizId]);
            const questionMap = new Map();
            for (const row of rows) {
                const question = questionMap.get(row.question_id) ?? {
                    id: row.question_id,
                    text: row.question_text,
                    options: []
                };
                question.options.push({
                    id: row.option_id,
                    text: row.option_text,
                    is_correct: Boolean(row.is_correct)
                });
                questionMap.set(row.question_id, question);
            }
            const questions = [...questionMap.values()];
            if (
                questions.length === 0 ||
                questions.some((question) =>
                    question.options.length < 2 ||
                    question.options.filter((option) => option.is_correct).length !== 1
                )
            ) {
                throw quizNotReady();
            }

            const [attemptResult] = await connection.execute(`
                INSERT INTO quiz_attempts (user_id, quiz_id, expires_at)
                VALUES (?, ?, TIMESTAMPADD(SECOND, ?, UTC_TIMESTAMP()))
            `, [userId, quizId, quiz.time_limit_seconds]);
            const attemptId = attemptResult.insertId;

            for (const question of questions) {
                await connection.execute(`
                    INSERT INTO quiz_attempt_questions (attempt_id, question_id, question_text)
                    VALUES (?, ?, ?)
                `, [attemptId, question.id, question.text]);
                const placeholders = question.options.map(() => '(?, ?, ?, ?, ?)').join(', ');
                const values = question.options.flatMap((option) => [
                    attemptId,
                    question.id,
                    option.id,
                    option.text,
                    option.is_correct
                ]);
                await connection.execute(`
                    INSERT INTO quiz_attempt_options
                        (attempt_id, question_id, option_id, option_text, is_correct)
                    VALUES ${placeholders}
                `, values);
            }

            const [attempts] = await connection.execute(`
                SELECT DATE_FORMAT(expires_at, '%Y-%m-%dT%H:%i:%sZ') AS expires_at
                FROM quiz_attempts
                WHERE id = ?
            `, [attemptId]);
            await connection.commit();
            return {
                attemptId,
                expiresAt: attempts[0].expires_at,
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    time_limit_seconds: quiz.time_limit_seconds,
                    questions: questions.map((question) => ({
                        id: question.id,
                        text: question.text,
                        options: question.options.map(({ id, text }) => ({ id, text }))
                    }))
                }
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async get(userId, attemptId) {
        const [attempts] = await pool.execute(`
            SELECT a.id, a.quiz_id, a.completed_at,
                   DATE_FORMAT(a.expires_at, '%Y-%m-%dT%H:%i:%sZ') AS expires_at,
                   CASE
                       WHEN a.completed_at IS NULL THEN a.expires_at <= UTC_TIMESTAMP()
                       ELSE COALESCE(r.timed_out, FALSE)
                   END AS timed_out,
                   q.title, q.description
            FROM quiz_attempts a
            JOIN quizzes q ON q.id = a.quiz_id
            LEFT JOIN results r ON r.attempt_id = a.id
            WHERE a.id = ? AND a.user_id = ?
        `, [attemptId, userId]);
        const attempt = attempts[0];
        if (!attempt) {
            return null;
        }

        const [questions] = await pool.execute(`
            SELECT q.question_id, q.question_text, o.option_id, o.option_text
            FROM quiz_attempt_questions q
            JOIN quiz_attempt_options o
              ON o.attempt_id = q.attempt_id AND o.question_id = q.question_id
            WHERE q.attempt_id = ?
            ORDER BY q.question_id, o.option_id
        `, [attemptId]);
        const [answers] = await pool.execute(`
            SELECT question_id, option_id
            FROM quiz_attempt_answers
            WHERE attempt_id = ?
        `, [attemptId]);
        const questionMap = new Map();
        for (const row of questions) {
            const question = questionMap.get(row.question_id) ?? {
                id: row.question_id,
                text: row.question_text,
                options: []
            };
            question.options.push({ id: row.option_id, text: row.option_text });
            questionMap.set(row.question_id, question);
        }

        return {
            attemptId: attempt.id,
            expiresAt: attempt.expires_at,
            completed: Boolean(attempt.completed_at),
            timedOut: Boolean(attempt.timed_out),
            quiz: {
                id: attempt.quiz_id,
                title: attempt.title,
                description: attempt.description,
                questions: [...questionMap.values()]
            },
            answers
        };
    }

    static async saveAnswers(userId, attemptId, answers) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [attempts] = await connection.execute(`
                SELECT id, completed_at, expires_at > UTC_TIMESTAMP() AS has_time_left
                FROM quiz_attempts
                WHERE id = ? AND user_id = ?
                FOR UPDATE
            `, [attemptId, userId]);
            const attempt = attempts[0];
            if (!attempt) {
                await connection.rollback();
                return null;
            }
            if (attempt.completed_at) {
                await connection.rollback();
                return { completed: true };
            }
            if (!Boolean(attempt.has_time_left)) {
                await connection.rollback();
                return { expired: true };
            }

            const [options] = await connection.execute(
                'SELECT question_id, option_id FROM quiz_attempt_options WHERE attempt_id = ?',
                [attemptId]
            );
            const optionsByQuestion = new Map();
            for (const option of options) {
                const questionOptions = optionsByQuestion.get(option.question_id) ?? new Set();
                questionOptions.add(option.option_id);
                optionsByQuestion.set(option.question_id, questionOptions);
            }
            for (const answer of answers) {
                if (!optionsByQuestion.get(answer.question_id)?.has(answer.option_id)) {
                    throw invalidAnswers();
                }
            }

            const placeholders = answers.map(() => '(?, ?, ?, CURRENT_TIMESTAMP)').join(', ');
            const values = answers.flatMap((answer) => [
                attemptId,
                answer.question_id,
                answer.option_id
            ]);
            await connection.execute(`
                INSERT INTO quiz_attempt_answers (attempt_id, question_id, option_id, answered_at)
                VALUES ${placeholders}
                ON DUPLICATE KEY UPDATE option_id = VALUES(option_id), answered_at = CURRENT_TIMESTAMP
            `, values);
            await connection.commit();
            return { saved: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async submit(userId, attemptId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [attempts] = await connection.execute(`
                SELECT id, quiz_id, completed_at,
                       expires_at <= UTC_TIMESTAMP() AS timed_out
                FROM quiz_attempts
                WHERE id = ? AND user_id = ?
                FOR UPDATE
            `, [attemptId, userId]);
            const attempt = attempts[0];
            if (!attempt) {
                await connection.rollback();
                return null;
            }

            if (attempt.completed_at) {
                const [results] = await connection.execute(`
                    SELECT id, score, total_questions, timed_out,
                           ROUND((score / total_questions) * 100) AS percentage
                    FROM results
                    WHERE attempt_id = ?
                `, [attemptId]);
                await connection.commit();
                if (!results[0]) {
                    throw new Error('Completed quiz attempt has no result record');
                }
                return {
                    resultId: results[0].id,
                    score: results[0].score,
                    totalQuestions: results[0].total_questions,
                    percentage: results[0].percentage,
                    timedOut: Boolean(results[0].timed_out),
                    alreadySubmitted: true
                };
            }

            const [options] = await connection.execute(`
                SELECT question_id, option_id, is_correct
                FROM quiz_attempt_options
                WHERE attempt_id = ?
            `, [attemptId]);
            const [answers] = await connection.execute(`
                SELECT question_id, option_id
                FROM quiz_attempt_answers
                WHERE attempt_id = ?
            `, [attemptId]);
            const { score, totalQuestions } = gradeAnswers(options, answers);
            const timedOut = Boolean(attempt.timed_out);

            const [result] = await connection.execute(`
                INSERT INTO results
                    (user_id, quiz_id, attempt_id, score, total_questions, timed_out)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, attempt.quiz_id, attemptId, score, totalQuestions, timedOut]);
            await connection.execute(
                'UPDATE quiz_attempts SET completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                [attemptId]
            );
            await connection.commit();
            return {
                resultId: result.insertId,
                score,
                totalQuestions,
                percentage: Math.round((score / totalQuestions) * 100),
                timedOut,
                alreadySubmitted: false
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
