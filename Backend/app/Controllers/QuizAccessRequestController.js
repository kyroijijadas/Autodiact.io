import QuizAccessRequest from '../Models/QuizAccessRequest.js';

function parseId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export default class QuizAccessRequestController {
    static async getMine(req, res) {
        try {
            res.status(200).json(await QuizAccessRequest.getForStudent(req.auth.userId));
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch quiz access status' });
        }
    }

    static async create(req, res) {
        const quizId = parseId(req.params.quizId);
        if (quizId === null) {
            return res.status(400).json({ error: 'Quiz ID must be a positive integer' });
        }

        try {
            const result = await QuizAccessRequest.request(req.auth.userId, quizId);
            if (result.unavailable) {
                return res.status(404).json({ error: 'Quiz not found or unavailable for access requests' });
            }
            if (result.status === 'approved') {
                return res.status(409).json({ error: 'You already have access to this quiz' });
            }
            if (result.status === 'pending') {
                return res.status(409).json({ error: 'Your request is already awaiting professor approval' });
            }
            res.status(201).json({ status: result.status });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to request quiz access' });
        }
    }

    static async getForProfessor(req, res) {
        try {
            res.status(200).json(await QuizAccessRequest.getForProfessor(req.auth.userId));
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch quiz access requests' });
        }
    }

    static async review(req, res) {
        const requestId = parseId(req.params.requestId);
        if (requestId === null) {
            return res.status(400).json({ error: 'Request ID must be a positive integer' });
        }
        const { action } = req.params;
        const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null;
        if (!status) {
            return res.status(400).json({ error: 'Action must be approve or reject' });
        }

        try {
            const result = await QuizAccessRequest.review(req.auth.userId, requestId, status);
            if (result.notFound) {
                return res.status(404).json({ error: 'Quiz access request not found' });
            }
            if (result.alreadyReviewed) {
                return res.status(409).json({ error: 'Quiz access request has already been reviewed' });
            }
            res.status(200).json({ status: result.status });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to review quiz access request' });
        }
    }
}
