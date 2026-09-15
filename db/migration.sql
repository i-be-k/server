-- ENABLE CRYPTO FOR UUID GENERATION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DROP EXISTING ENUMS AND TABLES IF THEY EXIST FOR CLEAN RETRIES
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS user_tasks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_level CASCADE;
DROP TYPE IF EXISTS track_specialty CASCADE;

-- 2. DEFINE SYSTEM ENGINE OBJECT ENUMS
CREATE TYPE user_level AS ENUM ('beginner', 'mid-level', 'experienced');
CREATE TYPE track_specialty AS ENUM ('undetermined', 'frontend', 'backend', 'devops', 'fullstack');

-- 3. THE USERS TRACK REGISTRY TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    experience_tier user_level NOT NULL DEFAULT 'beginner',
    assigned_specialty track_specialty NOT NULL DEFAULT 'undetermined',
    hidden_metrics JSONB NOT NULL DEFAULT '{"frontend_points": 0, "backend_points": 0, "devops_points": 0}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. THE INTRANET AUTOMATED TASK POOL
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_tier user_level NOT NULL,
    specialty_tag track_specialty NOT NULL,
    points_worth INT NOT NULL DEFAULT 10,
    unlock_day INT NOT NULL,
    UNIQUE(target_tier, unlock_day) -- Prevents overlapping curriculum slots
);

-- 5. RELATIONAL TASK TRACKER LEDGER 
CREATE TABLE user_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- 'available', 'in_progress', 'submitted', 'passed', 'failed'
    code_submission_url TEXT,
    score INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_id)
);

-- 6. VERIFIABLE INTERNSHIP CERTIFICATE REGISTRY
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specialty_earned track_specialty NOT NULL,
    certificate_url TEXT NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
