# Grant Database Privileges - Quick Guide

## Quick Commands

### Option 1: Using psql (Command Line)

```bash
# Connect as postgres superuser
psql -U postgres

# Grant privileges on database
GRANT ALL PRIVILEGES ON DATABASE nira_db TO postgres;

# Connect to the database
\c nira_db

# Grant privileges on schema and objects
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
```

### Option 2: Run the SQL File

```bash
# First, connect to postgres database
psql -U postgres -d postgres -f grant_privileges.sql

# Then connect to nira_db and run the schema-level grants
psql -U postgres -d nira_db -f grant_privileges.sql
```

### Option 3: One-Line Command (Windows PowerShell)

```powershell
# Grant database privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE nira_db TO postgres;"

# Grant schema and table privileges (after connecting to nira_db)
psql -U postgres -d nira_db -c "GRANT ALL PRIVILEGES ON SCHEMA public TO postgres; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;"
```

## What Each Command Does

1. **`GRANT ALL PRIVILEGES ON DATABASE nira_db TO postgres;`**
   - Grants all privileges on the database itself
   - Must be run as superuser while connected to any database

2. **`GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;`**
   - Grants privileges on the public schema
   - Must be run while connected to nira_db

3. **`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;`**
   - Grants privileges on all existing tables

4. **`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;`**
   - Grants privileges on all sequences (used by SERIAL columns)

5. **`ALTER DEFAULT PRIVILEGES ...`**
   - Sets default privileges for future tables and sequences
   - Ensures new objects automatically get the right privileges

## Verify Privileges

To check if privileges were granted correctly:

```sql
-- Check table privileges
\dp

-- Check all privileges
\z

-- Or query the system tables
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public';
```

## For Different User

If you're using a different database user (not 'postgres'), replace `postgres` with your username in all commands.

Example for user 'myuser':
```sql
GRANT ALL PRIVILEGES ON DATABASE nira_db TO myuser;
\c nira_db
GRANT ALL PRIVILEGES ON SCHEMA public TO myuser;
-- ... and so on
```
