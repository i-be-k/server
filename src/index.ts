import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateJWT, requireTier } from './middleware/authMiddleware';
import { handleGitHubWebhook } from './controllers/webhookController';
import taskRoutes from './routes/taskRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Essential parser payload parameter requirement hook
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/auth', authRoutes);

// GitHub Webhook payload receiver bypasses JWT header rules securely
app.post('/api/v1/grading-webhook', handleGitHubWebhook);

// Protected Core Intranet routes
app.get('/api/v1/tasks/timeline', authenticateJWT, requireTier(['beginner', 'mid-level', 'experienced']), (req, res) => {
    // Queries DB tasks table filtered explicitly by req.user.experienceTier details
    res.json({ message: "Dashboard timeline data layers loaded successfully." });
});

app.listen(PORT, () => {
    console.log(`🚀 Intranet infrastructure microservice listening securely on port matches: ${PORT}`);
});
