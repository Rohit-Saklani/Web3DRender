-- =====================================================
-- FIX PERMISSIONS - Run this to fix "permission denied" error
-- =====================================================
-- Replace 'fariyad' with your DB_USER from .env file if different
-- =====================================================

-- Step 1: Connect to nira_db database first
-- \c nira_db

-- Step 2: Grant all privileges on schema
GRANT ALL PRIVILEGES ON SCHEMA public TO fariyad;

-- Step 3: Grant privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fariyad;

-- Step 4: Grant privileges on all existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fariyad;

-- Step 5: Grant privileges on future tables (default privileges)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fariyad;

-- Step 6: Grant privileges on future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fariyad;

-- Step 7: Make sure the user owns the schema (optional but recommended)
-- ALTER SCHEMA public OWNER TO fariyad;

-- =====================================================
-- VERIFY: Check privileges after running
-- =====================================================
-- \dp users
-- \dp projects
-- \dp models
