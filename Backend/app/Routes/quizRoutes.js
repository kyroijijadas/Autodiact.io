import express from 'express';
import QuizController from '../Controllers/QuizController.js';

const router = express.Router();

// When someone sends a GET request here, trigger getAllQuizzes
router.get('/', QuizController.getAllQuizzes);
router.get('/:id', QuizController.getQuizByID);
router.post('/', QuizController.createQuiz);

export default router;