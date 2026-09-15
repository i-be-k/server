import { pool } from '../config/db';

export class TaskService {
    /**
        * Fetches all tasks targeted for a specific experience tier, 
        * merging the individual user's progress state metrics.
        */
        static async getTasksByTier(userId: string, tier: 'beginner' | 'mid-level' | 'experienced') {
            const queryStr = `
                SELECT 
                    t.id,
                    t.title,
                    t.description,
                    t.target_tier AS "targetTier",
                    t.specialty_tag AS "specialtyTag",
                    t.points_worth AS "pointsWorth",
                    t.unlock_day AS "unlockDay",
                    COALESCE(ut.status, 'available') AS "status",
                    COALESCE(ut.score, 0) AS "score",
                    ut.code_submission_url AS "submissionUrl"
                FROM tasks t
                LEFT JOIN user_tasks ut 
                    ON t.id = ut.task_id AND ut.user_id = $1
                WHERE t.target_tier = $2
                ORDER BY t.unlock_day ASC;
            `;

            const result = await pool.query(queryStr, [userId, tier]);
            return result.rows;
        }

        /**
         * Safe status transition management layer (e.g. tracking when a user starts working on a project)
         */
        static async updateTaskStatus(userId: string, taskId: string, status: string) {
        const queryStr = `
            INSERT INTO user_tasks (user_id, task_id, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, task_id) 
            DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await pool.query(queryStr, [userId, taskId, status]);
        return result.rows[0];
    }
}
