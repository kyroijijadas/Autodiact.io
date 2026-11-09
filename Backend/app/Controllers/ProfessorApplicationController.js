import User from '../Models/User.js';

export default class ProfessorApplicationController {
    static async create(req, res) {
        const subject = typeof req.body?.subject === 'string'
            ? req.body.subject.trim()
            : '';
        if (!subject || subject.length > 100) {
            return res.status(400).json({
                error: 'Subject is required and must be 100 characters or fewer'
            });
        }

        try {
            const applicationId = await User.createProfessorApplication(
                req.auth.userId,
                subject
            );
            if (applicationId === 'not_found') {
                return res.status(401).json({ error: 'Authentication required' });
            }
            if (applicationId === 'not_student') {
                return res.status(403).json({ error: 'Only students or professors can apply for professor subject approval' });
            }
            if (applicationId === 'pending_exists') {
                return res.status(409).json({ error: 'You already have a pending application for this subject' });
            }
            if (applicationId === 'already_assigned') {
                return res.status(409).json({ error: 'You are already approved for this subject' });
            }
            res.status(201).json({
                message: 'Professor application submitted for admin review',
                applicationId
            });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to submit professor application' });
        }
    }

    static async getMine(req, res) {
        try {
            res.status(200).json(
                await User.getProfessorApplications(req.auth.userId)
            );
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch professor applications' });
        }
    }
}
