import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        experienceTier: 'beginner' | 'mid-level' | 'experienced';
        assignedSpecialty: string;
    };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Missing token profile.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
            id: string; experienceTier: 'beginner' | 'mid-level' | 'experienced'; assignedSpecialty: string
        };
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ error: 'Invalid or expired payload token session.' });
    }
};

// Role-Based Tier Access guard verification logic
export const requireTier = (allowedTiers: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedTiers.includes(req.user.experienceTier)) {
            return res.status(403).json({ error: 'Unauthorized. Higher experience tier required.' });
        }
        next();
    };
};
