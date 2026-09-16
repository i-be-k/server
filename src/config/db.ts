import pg from "pg";
import { config } from './env.js';

export const pool = new pg.Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    max: 20, // Max structural pipeline pools
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log(`✅ PostgreSQL pool connected cleanly to database: ${config.db.name}`);
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database pool connection failure:', err);
});
