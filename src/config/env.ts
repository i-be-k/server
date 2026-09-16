import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// ✅ Re-create __dirname safely for modern ES Module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load variables from the local environment file safely
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnvVariables = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "JWT_SECRET",
];

// Crash early if a critical system key is missing
for (const envVar of requiredEnvVariables) {
    if (!process.env[envVar]) {
        throw new Error(
            `💥 System Setup Error: Missing critical environment configuration variable: ${envVar}`
        );
    }
}

export const config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5000", 10),
    db: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432", 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || "fallback_secret",
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
        githubSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
    },
    sandbox: {
        memory: process.env.MAX_SANDBOX_MEMORY || "256m",
        cpus: process.env.MAX_SANDBOX_CPUS || "0.5",
    },
} as const; // Make settings completely immutable
