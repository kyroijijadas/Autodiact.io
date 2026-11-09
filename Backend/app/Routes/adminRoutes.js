import express from 'express';
import AdminController from '../Controllers/AdminController.js';
import { requireAuth, requireRole } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));
router.get('/professor-applications', AdminController.listProfessorApplications);
router.patch('/professor-applications/:applicationId/approve', (req, res) =>
    AdminController.reviewProfessorApplication(req, res, true)
);
router.patch('/professor-applications/:applicationId/reject', (req, res) =>
    AdminController.reviewProfessorApplication(req, res, false)
);

export default router;
