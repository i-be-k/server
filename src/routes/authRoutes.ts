import { Router } from 'express';
import { handleUserLogin, handleUserRegistration } from '../controllers/authController.js';

const router = Router();

// Endpoint Route pathways mapping configs: POST /api/v1/auth/login
router.post('/login', handleUserLogin);
router.post('/register', handleUserRegistration);

export default router;
