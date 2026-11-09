import QuizAttempt from '../Models/QuizAttempt.js';

function parseId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateAnswers(answers) {
    if (!Array.isArray(answers) || answers.length < 1 || answers.length > 100) {
        return 'Answers must contain between 1 and 100 selections';
    }

    const seenQuestionIds = new Set();
    for (const answer of answers) {
        if (
            !answer ||
            !Number.isSafeInteger(answer.question_id) || answer.question_id <= 0 ||
            !Number.isSafeInteger(answer.option_id) || answer.option_id <= 0 ||
            seenQuestionIds.has(answer.question_id)
        ) {
            return 'Each answer requires a unique positive question_id and option_id';
        }
        seenQuestionIds.add(answer.question_id);
    }
    return null;
}

export default class QuizAttemptController {
    static async start(req, res) {
        const quizId = parseId(req.params.quizId);
        if (quizId === null) {
            return res.status(400).json({ error: 'Quiz ID must be a positive integer' });
        }

        try {
            const attempt = await QuizAttempt.start(req.auth.userId, quizId);
            if (!attempt) {
                return res.status(404).json({ error: 'Active quiz not found' });
            }
            res.status(201).json(attempt);
        } catch (error) {
            if (error.code === 'QUIZ_NOT_READY') {
                return res.status(409).json({ error: 'Quiz is not ready for attempts' });
            }
            if (error.code === 'QUIZ_ACCESS_NOT_APPROVED') {
                return res.status(403).json({ error: 'Professor approval is required before taking this quiz' });
            }
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to start quiz attempt' });
        }
    }

    static async get(req, res) {
        const attemptId = parseId(req.params.attemptId);
        if (attemptId === null) {
            return res.status(400).json({ error: 'Attempt ID must be a positive integer' });
        }

        try {
            const attempt = await QuizAttempt.get(req.auth.userId, attemptId);
            if (!attempt) {
                return res.status(404).json({ error: 'Quiz attempt not found' });
            }
            res.status(200).json(attempt);
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch quiz attempt' });
        }
    }

    static async saveAnswers(req, res) {
        const attemptId = parseId(req.params.attemptId);
        if (attemptId === null) {
            return res.status(400).json({ error: 'Attempt ID must be a positive integer' });
        }
        const validationError = validateAnswers(req.body?.answers);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        try {
            const result = await QuizAttempt.saveAnswers(
                req.auth.userId,
                attemptId,
                req.body.answers
            );
            if (!result) {
                return res.status(404).json({ error: 'Quiz attempt not found' });
            }
            if (result.expired) {
                return res.status(409).json({ error: 'The quiz time limit has expired; submit the attempt to receive your score' });
            }
            if (result.completed) {
                return res.status(409).json({ error: 'Quiz attempt has already been submitted' });
            }
            res.status(200).json({ message: 'Answers saved' });
        } catch (error) {
            if (error.code === 'INVALID_ANSWERS') {
                return res.status(400).json({ error: 'Each answer must select an option belonging to its question' });
            }
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to save answers' });
        }
    }
}
