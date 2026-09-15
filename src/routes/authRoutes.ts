import { Router } from 'express';
import { handleUserLogin } from '../controllers/authController';

const router = Router();

// Endpoint Route mapping pathway: POST /api/v1/auth/login
router.post('/login', handleUserLogin);

export default router;
