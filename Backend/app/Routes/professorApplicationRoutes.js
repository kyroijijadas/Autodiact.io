import express from 'express';
import ProfessorApplicationController from '../Controllers/ProfessorApplicationController.js';
import { requireAuth, requireAnyRole } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth, requireAnyRole('student', 'professor'));
router.get('/me', ProfessorApplicationController.getMine);
router.post('/', ProfessorApplicationController.create);

export default router;
