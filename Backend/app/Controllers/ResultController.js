import Result from '../Models/Result.js';
import QuizAttempt from '../Models/QuizAttempt.js';

export function parseAttemptId(value) {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export default class ResultController {
    static async submitResult(req, res) {
        const attemptId = parseAttemptId(req.body?.attempt_id);

        if (attemptId === null) {
            return res.status(400).json({ error: 'Provide a valid attempt_id' });
        }

        try {
            const result = await QuizAttempt.submit(req.auth.userId, attemptId);
            if (!result) {
                return res.status(404).json({ error: 'Quiz attempt not found' });
            }
            res.status(result.alreadySubmitted ? 200 : 201).json({
                message: 'Result submitted successfully',
                ...result
            });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to submit result' });
        }
    }

    static async getUserResults(req, res) {
        try {
            const results = await Result.getByUser(req.auth.userId);
            res.status(200).json(results);
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch results' });
        }
    }
}
