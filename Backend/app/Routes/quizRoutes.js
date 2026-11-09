import express from 'express';
import QuizController from '../Controllers/QuizController.js';
import QuizAttemptController from '../Controllers/QuizAttemptController.js';
import QuizAccessRequestController from '../Controllers/QuizAccessRequestController.js';
import { requireAuth, requireRole } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.get('/', QuizController.getAllQuizzes);
router.get('/mine', requireAuth, requireRole('professor'), QuizController.getMine);
router.get('/access/mine', requireAuth, requireRole('student'), QuizAccessRequestController.getMine);
router.post('/:quizId/access-requests', requireAuth, requireRole('student'), QuizAccessRequestController.create);
router.get('/access-requests', requireAuth, requireRole('professor'), QuizAccessRequestController.getForProfessor);
router.patch('/access-requests/:requestId/:action', requireAuth, requireRole('professor'), QuizAccessRequestController.review);
router.post('/:quizId/attempts', requireAuth, requireRole('student'), QuizAttemptController.start);
router.get('/attempts/:attemptId', requireAuth, requireRole('student'), QuizAttemptController.get);
router.put('/attempts/:attemptId/answers', requireAuth, requireRole('student'), QuizAttemptController.saveAnswers);
router.post('/', requireAuth, requireRole('professor'), QuizController.createQuiz);

export default router;