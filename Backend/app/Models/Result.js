import pool from './db.js';

function invalidAnswers() {
    const error = new Error('Submitted answers do not match the quiz');
    error.code = 'INVALID_ANSWERS';
    return error;
}

export function gradeAnswers(options, answers) {
    const optionsByQuestion = new Map();
    for (const option of options) {
        const questionOptions = optionsByQuestion.get(option.question_id) ?? new Map();
        questionOptions.set(option.option_id, Boolean(option.is_correct));
        optionsByQuestion.set(option.question_id, questionOptions);
    }

    const submittedAnswers = new Map(answers.map((answer) => [
        answer.question_id,
        answer.option_id
    ]));
    if (optionsByQuestion.size === 0 || submittedAnswers.size !== answers.length) {
        throw invalidAnswers();
    }

    let score = 0;
    for (const [questionId, optionId] of submittedAnswers) {
        if (!optionsByQuestion.get(questionId)?.has(optionId)) {
            throw invalidAnswers();
        }
    }
    for (const [questionId, correctOptions] of optionsByQuestion) {
        const selectedOptionId = submittedAnswers.get(questionId);
        if (selectedOptionId !== undefined && correctOptions.get(selectedOptionId)) {
            score += 1;
        }
    }

    return { score, totalQuestions: optionsByQuestion.size };
}

export default class Result {
    static async getByUser(userId) {
        const [rows] = await pool.execute(`
            SELECT r.id, r.quiz_id, q.title, r.score, r.total_questions,
                   COALESCE(ROUND((r.score / NULLIF(r.total_questions, 0)) * 100), 0) AS percentage,
                   r.timed_out, r.completed_at
            FROM results r
            JOIN quizzes q ON r.quiz_id = q.id
            WHERE r.user_id = ?
            ORDER BY r.completed_at DESC, r.id DESC
        `, [userId]);
        return rows;
    }
}
