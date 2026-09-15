import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

export class AuthService {
    /**
     * Evaluates user credentials and returns full database row profile if valid
     */
    static async verifyUserCredentials(email: string, passwordPlain: string) {
        const queryStr = `
            SELECT 
                id, 
                full_name AS "fullName", 
                email, 
                password_hash AS "passwordHash", 
                experience_tier AS "experienceTier", 
                assigned_specialty AS "assignedSpecialty",
                hidden_metrics AS "hiddenMetrics"
            FROM users 
            WHERE email = $1 LIMIT 1;
        `;
    
        const result = await pool.query(queryStr, [email.toLowerCase().trim()]);
    
        if (result.rowCount === 0) {
            return null; // User profile footprint completely absent
        }

        const user = result.rows[0];
    
        // Validate the incoming text parameter against the salted bcrypt record hash
        const isPasswordMatching = await bcrypt.compare(passwordPlain, user.passwordHash);
        if (!isPasswordMatching) {
            return null; // Credential alignment mismatch
        }

        // Strip password hash block out before returning the metadata profile object
        const { ...safeUserProfile } = user;
        return safeUserProfile;
    }
}
