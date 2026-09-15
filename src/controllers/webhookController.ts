import { Request, Response } from 'express';
import { Pool } from 'pg';
import { executeUserCodeInSandbox } from '../utils/sandboxManager';
import { generateInternshipCertificate } from '../utils/certGenerator';

const pool = new Pool(); // Picks up variables directly from environment config

export const handleGitHubWebhook = async (req: Request, res: Response) => {
    // Acknowledge the GitHub hook instantly to prevent timeout errors
    res.status(202).json({ status: 'Processing submission payload inside Docker sandbox...' });

    const { repository, pusher } = req.body;
    if (!repository || !pusher) return;

    try {
        // 1. Resolve User and Task info from DB
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [pusher.email]);
        if (userResult.rowCount === 0) return;
        const user = userResult.rows[0];

        // 2. Identify the active task linked to this repo layout framework
        const taskResult = await pool.query(
            'SELECT * FROM tasks WHERE target_tier = $1 AND unlock_day = $2 LIMIT 1',
            [user.experience_tier, 1] // Adjust target dynamically based on tracker data
        );
        if (taskResult.rowCount === 0) return;
        const task = taskResult.rows[0];

        // 3. Fetch Code Artifacts
        // In production, fetch the raw file via GitHub API using: repository.contents_url
        const userCodeStr = `def hello(): return "world"`; // Mocking incoming script
        const hiddenTestStr = `
            import unittest
            from app import hello
            class TestSuite(unittest.TestCase):
                def test_hello(self): self.assertEqual(hello(), "world")
            if __name__ == "__main__": unittest.main()
            `;
        
        // EXECUTE SAFELY IN DOCKER
        const submissionId = crypto.randomUUID();
        console.log(`[Sandbox] Deploying container for submission: ${submissionId}`);
    
        const result = await executeUserCodeInSandbox(
            submissionId, 
            userCodeStr, 
            hiddenTestStr, 
            task.specialty_tag === 'frontend' ? 'javascript' : 'python'
        );

        console.log(`[Sandbox] Result received: Status=${result.status}, Score=${result.score}`);

        // 4. Update the user progress logs in the database
        await pool.query(
            `INSERT INTO user_tasks (user_id, task_id, status, code_submission_url, score)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, task_id) DO UPDATE SET status = $3, score = $5`,
            [user.id, task.id, result.status, repository.html_url, result.score]
        );

        // 5. Track behind-the-scenes metrics on pass
        if (result.status === 'passed') {
            const metricField = `${task.specialty_tag}_points`; // dynamically maps to frontend_points etc.
            await pool.query(
                `UPDATE users SET 
                    hidden_metrics = jsonb_set(hidden_metrics, $1, (COALESCE((hidden_metrics->>$2)::int, 0) + $3)::text::jsonb)
                WHERE id = $4`,
                [[metricField], metricField, result.score, user.id]
            );
        }

        // 6. MILESTONE CHECK: Check if track is completely satisfied to issue certificate
        const totalPassedResult = await pool.query(
            "SELECT COUNT(*) FROM user_tasks WHERE user_id = $1 AND status = 'passed'",
            [user.id]
        );
    
        if (parseInt(totalPassedResult.rows[0].count) >= 12) { // Target cap milestone requirement met
            const certId = crypto.randomUUID();
            // Execute the generator utility to output dynamic artifacts natively
            const secureS3Url = await generateInternshipCertificate(user.full_name, user.assigned_specialty, certId);

            await pool.query(
                'INSERT INTO certificates (id, user_id, specialty_earned, certificate_url) VALUES ($1, $2, $3, $4)',
                [certId, user.id, user.assigned_specialty, secureS3Url]
            );
        }

    } catch (error) {
        console.error('Webhook orchestrator processing failure:', error);
    }
};
