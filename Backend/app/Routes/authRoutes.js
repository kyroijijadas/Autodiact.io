import express from 'express';
import AuthController from '../Controllers/AuthController.js';
import { requireAuth } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.getCurrentUser);

export default router;