-- =====================================================
-- GRANT ALL PRIVILEGES TO DATABASE USER
-- =====================================================
-- Run these commands to grant all privileges
-- Replace 'postgres' with your actual database user if different
-- =====================================================

-- Step 1: Grant privileges on the database itself
-- Run this as superuser (postgres) while connected to any database
GRANT ALL PRIVILEGES ON DATABASE nira_db TO postgres;

-- Step 2: Connect to the nira_db database first
-- \c nira_db

-- Step 3: Grant privileges on schema
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Step 4: Grant privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Step 5: Grant privileges on all existing sequences (for SERIAL/auto-increment columns)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Step 6: Grant privileges on future tables (default privileges)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;

-- Step 7: Grant privileges on future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- =====================================================
-- ALTERNATIVE: Grant to a specific user (if different from postgres)
-- =====================================================
-- If you have a different user, replace 'postgres' with your username:
-- 
-- GRANT ALL PRIVILEGES ON DATABASE nira_db TO your_username;
-- \c nira_db
-- GRANT ALL PRIVILEGES ON SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_username;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO your_username;

-- =====================================================
-- VERIFY PRIVILEGES
-- =====================================================
-- To check what privileges are granted, run:
-- \dp  (shows table privileges)
-- \z   (shows access privileges)
