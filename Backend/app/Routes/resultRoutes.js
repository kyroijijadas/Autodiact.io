import express from 'express';
import ResultController from '../Controllers/ResultController.js';
import { requireAuth, requireRole } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', ResultController.getUserResults);
router.post('/', requireRole('student'), ResultController.submitResult);

export default router;
