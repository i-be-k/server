import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthService } from '../services/authService';

export const handleUserRegistration = async (req: Request, res: Response) => {
    try {
        const { fullName, email, password, experienceTier } = req.body;

        // 1. Baseline Request Body Validation
        if (!fullName || !email || !password || !experienceTier) {
            return res.status(400).json({ error: 'All configuration payload fields are mandatory.' });
        }

        const allowedTiers = ['beginner', 'mid-level', 'experienced'];
        if (!allowedTiers.includes(experienceTier)) {
            return res.status(400).json({ error: 'Invalid experience tier target profile mapped.' });
        }

        // 2. Invoke the Business Registration Service Layer
        const newUserProfile = await AuthService.registerNewUser(fullName, email, password, experienceTier);

        // 3. AUTO-LOGIN EXECUTIONS: Sign an instant JWT token so they don't have to re-login right away
        const jwtPayload = {
            id: newUserProfile.id,
            experienceTier: newUserProfile.experienceTier,
            assignedSpecialty: newUserProfile.assignedSpecialty
        };

        const sessionToken = jwt.sign(jwtPayload, String(config.auth.jwtSecret), {
            expiresIn: Number(config.auth.jwtExpiresIn),
        });

        console.log(`[Auth Engine] Account deployed successfully. Registered User ID: ${newUserProfile.id}`);

        return res.status(201).json({
            success: true,
            message: 'Developer account successfully enrolled into track matrix ecosystem.',
            token: sessionToken,
            user: newUserProfile
        });

    } catch (error: any) {
        console.error('❌ Registration system tracing crash exception:', error.message);
    
        // Check if the thrown error stems from business logic or database crashes
        const statusCode = error.message.includes('exists') ? 409 : 500;
        return res.status(statusCode).json({ error: error.message || 'Internal enrollment engine exception error.' });
    }
};


export const handleUserLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password configuration fields are mandatory.' });
        }

        // Call internal verification infrastructure layers
        const validatedUser = await AuthService.verifyUserCredentials(email, password);

        if (!validatedUser) {
            return res.status(401).json({ error: 'Access Denied. Invalid email or password signatures.' });
        }

        // 🔒 CONSTRUCT SECURITY PAYLOAD FOR COOKIE/TOKEN SESSIONS
        const jwtPayload = {
            id: validatedUser.id,
            experienceTier: validatedUser.experienceTier,
            assignedSpecialty: validatedUser.assignedSpecialty
        };

        // Sign and issue immutable cryptographically signed JWT strings
        const sessionToken = jwt.sign(jwtPayload, String(config.auth.jwtSecret), {
            expiresIn: Number(config.auth.jwtExpiresIn),
        });

        console.log(`[Auth Engine] Token successfully compiled for User: ${validatedUser.id} [Tier: ${validatedUser.experienceTier}]`);

        return res.status(200).json({
            success: true,
            message: 'Authentication check validated successfully.',
            token: sessionToken,
            user: {
                id: validatedUser.id,
                fullName: validatedUser.fullName,
                email: validatedUser.email,
                experienceTier: validatedUser.experienceTier,
                assignedSpecialty: validatedUser.assignedSpecialty,
                hiddenMetrics: validatedUser.hiddenMetrics
            }
        });

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('❌ Authentication controller exception trace:', error.message);
        } else {
            console.error('❌ Authentication controller encountered an unknown error.');
        }
        return res.status(500).json({ error: 'Internal system authentication service execution error.' });
    }
};
