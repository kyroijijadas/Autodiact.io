import User from '../Models/User.js';

function parseId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export default class AdminController {
    static async listProfessorApplications(req, res) {
        const status = req.query.status ?? null;
        if (
            status !== null &&
            !['pending', 'approved', 'rejected'].includes(status)
        ) {
            return res.status(400).json({
                error: 'Status must be pending, approved, or rejected'
            });
        }

        try {
            res.status(200).json(await User.getProfessorApplications(null, status));
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch professor applications' });
        }
    }

    static async reviewProfessorApplication(req, res, approve) {
        const applicationId = parseId(req.params.applicationId);
        if (applicationId === null) {
            return res.status(400).json({ error: 'Application ID must be a positive integer' });
        }

        try {
            const result = await User.reviewProfessorApplication(
                applicationId,
                req.auth.userId,
                approve
            );
            if (result === 'not_found') {
                return res.status(404).json({ error: 'Professor application not found' });
            }
            if (result === 'already_reviewed') {
                return res.status(409).json({ error: 'Professor application has already been reviewed' });
            }
            if (result === 'account_unavailable') {
                return res.status(409).json({ error: 'Applicant account is inactive or is no longer eligible for professor approval' });
            }
            res.status(200).json({
                message: approve
                    ? 'Professor application approved'
                    : 'Professor application rejected'
            });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to review professor application' });
        }
    }
}
