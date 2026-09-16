import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

export class AuthService {
    /**
     * Validates requirements, hashes password, and creates a secure user profile record
     */
    static async registerNewUser(
        fullName: string, email: string, passwordPlain: string, selectedTier: 'beginner' | 'mid-level' | 'experienced'
    ) {
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Defend against duplicate email registration
        const duplicateCheck = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1;', [normalizedEmail]);
        if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
            throw new Error('An account with this email address already exists.');
        }

        // 2. Hash the raw password securely (10 rounds of salt iteration)
        const passwordHash = await bcrypt.hash(passwordPlain, 10);

        // 3. Commit new account profile row to PostgreSQL database
        const insertQueryStr = `
            INSERT INTO users (full_name, email, password_hash, experience_tier)
            VALUES ($1, $2, $3, $4)
            RETURNING id,
            full_name AS "fullName",
            email,
            experience_tier AS "experienceTier",
            assigned_specialty AS "assignedSpecialty",
            hidden_metrics AS "hiddenMetrics";
        `;

        const result = await pool.query(insertQueryStr, [
            fullName.trim(),
            normalizedEmail,
            passwordHash,
            selectedTier
        ]);

        return result.rows[0];
    }
    
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
