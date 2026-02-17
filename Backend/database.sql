-- =====================================================
-- Nira Database Schema - Complete Setup Script
-- =====================================================
-- This script creates all tables, indexes, and initial setup
-- Run this script in PostgreSQL to set up the entire database
-- =====================================================

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MODELS TABLE
-- =====================================================
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on users email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on projects user_id for fast user project queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Index on projects status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Index on models user_id for fast user model queries
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);

-- Index on models project_id for fast project model queries
CREATE INDEX IF NOT EXISTS idx_models_project_id ON models(project_id);

-- Index on models file_type for filtering by file type
CREATE INDEX IF NOT EXISTS idx_models_file_type ON models(file_type);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMP
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for models table
CREATE TRIGGER update_models_updated_at 
    BEFORE UPDATE ON models 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (OPTIONAL - COMMENT OUT IF NOT NEEDED)
-- =====================================================

-- Insert a test user (password is 'password123' hashed with bcrypt)
-- Password hash for 'password123': $2a$10$rOzJqZqZqZqZqZqZqZqZqO
-- Note: In production, use proper password hashing
-- INSERT INTO users (name, email, password) VALUES 
-- ('Test User', 'test@example.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqO');

-- =====================================================
-- VERIFICATION QUERIES (OPTIONAL)
-- =====================================================

-- Uncomment to verify tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Uncomment to verify indexes were created:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- =====================================================
-- GRANT PRIVILEGES
-- =====================================================
-- Grant all privileges to the database user
-- Replace 'postgres' with your actual database user if different

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE nira_db TO postgres;

-- Connect to the database first, then run these:
-- \c nira_db

-- Grant all privileges on schema
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Grant all privileges on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Grant all privileges on all sequences (for SERIAL columns)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Grant privileges on future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- =====================================================
-- END OF DATABASE SETUP SCRIPT
-- =====================================================
