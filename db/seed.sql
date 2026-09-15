-- 1. SEED SYSTEM USER PROFILES AT DIFFERENT TIERS
INSERT INTO users (full_name, email, experience_tier, assigned_specialty) VALUES
('Chidi Obi', 'chidi@intranet.io', 'beginner', 'undetermined'),
('Amina Yusuf', 'amina@intranet.io', 'mid-level', 'undetermined'),
('Tunde Bakare', 'tunde@intranet.io', 'experienced', 'fullstack');

-- 2. SEED SYSTEM TASKS POOL MATRIX
INSERT INTO tasks (title, description, target_tier, specialty_tag, points_worth, unlock_day) VALUES
-- Beginner Track
('Shell, Basics: Navigation Grid', 'Learn terminal navigation strings, file parsing, and directories manipulation.', 'beginner', 'devops', 10, 1),
('HTML/CSS Foundations: Responsive Box', 'Build semantic grid layout structures utilizing modern element parameters.', 'beginner', 'frontend', 15, 2),
('JavaScript Basics: Functional Loops', 'Write evaluation algorithms executing baseline iteration structures.', 'beginner', 'backend', 15, 3),

-- Mid-Level Track
('Advanced React Context Engineering', 'Optimize complex component re-renders through modular hook structures.', 'mid-level', 'frontend', 30, 1),
('Relational DB Index Optimization', 'Refactor query schemas, decouple relationships, and mitigate N+1 constraints.', 'mid-level', 'backend', 40, 2),
('Multi-Stage Container Compilations', 'Construct optimized micro-images dropping compilation footprint limits.', 'mid-level', 'devops', 45, 3),

-- Experienced Track
('Distributed Event-Driven Architecture', 'Design pub/sub message relays using cluster transaction paradigms.', 'experienced', 'backend', 80, 1),
('Blue/Green Infrastructure Deployments', 'Declaratively provision pipeline states via declarative cloud profiles.', 'experienced', 'devops', 100, 2),
('Micro-Frontend Web Federation Core', 'Resolve runtime module loading layers cleanly across domain dashboards.', 'experienced', 'frontend', 95, 3);
