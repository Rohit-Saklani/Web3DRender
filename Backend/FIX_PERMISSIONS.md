# Fix "Permission Denied" Error

## Quick Fix Commands

The error "permission denied for table users" means your database user doesn't have the right privileges.

### Option 1: Using psql (Recommended)

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Connect to your database
\c nira_db

# Run these commands (replace 'postgres' with your DB_USER if different)
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

# Exit
\q
```

### Option 2: One-Line Command

```bash
# Replace 'postgres' with your DB_USER from .env if different
psql -U postgres -d nira_db -c "GRANT ALL PRIVILEGES ON SCHEMA public TO postgres; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;"
```

### Option 3: Using SQL File

```bash
# First, make sure you're connected to nira_db, then:
psql -U postgres -d nira_db -f fix_permissions.sql
```

## If Your DB_USER is Different

If your `.env` file has a different user (not 'postgres'), replace `postgres` with your actual username in all commands above.

Example if your user is 'myuser':
```sql
GRANT ALL PRIVILEGES ON SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;
-- etc.
```

## Verify It Worked

After running the commands, test your registration again. The error should be gone.

You can also verify privileges:
```sql
\dp users
\dp projects
\dp models
```

This should show your user has all privileges (SELECT, INSERT, UPDATE, DELETE, etc.)
