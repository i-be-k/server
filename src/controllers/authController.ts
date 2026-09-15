import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthService } from '../services/authService';

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
