import { Router } from 'express';
import { getUserTimelineTasks, startDashboardTask } from '../controllers/taskController';
import { authenticateJWT, requireTier } from '../middleware/authMiddleware';

const router = Router();

// 1. GET Request: Fetches daily roadmap milestones matching the user's active tier
router.get(
    '/timeline', 
    authenticateJWT, 
    requireTier(['beginner', 'mid-level', 'experienced']), 
    getUserTimelineTasks
);

// 2. POST Request: Shifts task status states dynamically to 'in_progress'
router.post(
    '/start', 
    authenticateJWT, 
    startDashboardTask
);

export default router;
