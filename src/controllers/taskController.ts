import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { TaskService } from '../services/taskService';

export const getUserTimelineTasks = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // These details are automatically unpacked from the secure JWT middleware layer
        const userId = req.user?.id;
        const userTier = req.user?.experienceTier;

        if (!userId || !userTier) {
            return res.status(401).json({ error: 'Session execution parameters dropped or corrupt.' });
        }

        console.log(`[Task Router] Fetching tasks for user profile: ${userId} [Tier: ${userTier}]`);
        const timelineData = await TaskService.getTasksByTier(userId, userTier);

        return res.status(200).json({
            success: true,
            count: timelineData.length,
            data: timelineData
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('❌ Timeline execution error exception:', errorMessage);
        return res.status(500).json({ error: 'Internal system data retrieval runtime error.' });
    }
};

export const startDashboardTask = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { taskId } = req.body;

        if (!userId || !taskId) {
            return res.status(400).json({ error: 'Missing mandatory tracking parameters.' });
        }

        const taskProgressRecord = await TaskService.updateTaskStatus(userId, taskId, 'in_progress');
    
        return res.status(200).json({
            success: true,
            message: 'Task progression shifted cleanly into an active execution state.',
            data: taskProgressRecord
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: errorMessage });
    }
};
