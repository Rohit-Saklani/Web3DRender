# Troubleshooting 500 Error on Registration

## Common Causes and Solutions

### 1. Database Tables Don't Exist

**Symptom:** 500 error when trying to register

**Solution:** Run the database setup script
```bash
# Make sure you're in the Backend directory
cd Backend

# Option 1: Using psql
psql -U postgres -d nira_db -f database.sql

# Option 2: Using the migration script
npm run migrate
```

### 2. Database Connection Issues

**Test the connection:**
```bash
npm run test-db
```

This will show:
- ✅ If connection is successful
- 📊 What tables exist
- ❌ Any connection errors

**Common fixes:**
- Check PostgreSQL is running
- Verify `.env` file has correct credentials
- Ensure database `nira_db` exists

### 3. Wrong Database Credentials

**Check your `.env` file:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nira_db
DB_USER=postgres
DB_PASSWORD=your_actual_password  # ← Make sure this is correct!
```

### 4. Database Doesn't Exist

**Create the database:**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE nira_db;

-- Exit
\q
```

### 5. Check Backend Server Logs

When you run `npm run dev`, check the console output for:
- ✅ "Connected to PostgreSQL database" - Good!
- ❌ "Database connection error" - Problem!

### 6. Verify Tables Were Created

```sql
-- Connect to database
psql -U postgres -d nira_db

-- Check tables
\dt

-- Should show: users, projects, models
```

## Quick Diagnostic Steps

1. **Test database connection:**
   ```bash
   cd Backend
   npm run test-db
   ```

2. **Check if tables exist:**
   ```sql
   psql -U postgres -d nira_db -c "\dt"
   ```

3. **Check backend logs** when making a request - look for detailed error messages

4. **Verify .env file exists** and has correct values

## Still Having Issues?

Check the backend console output when you make a registration request. The improved error handling will now show:
- Detailed error messages (in development mode)
- Database connection status
- Specific error codes

Look for messages like:
- "relation 'users' does not exist" → Tables not created
- "password authentication failed" → Wrong credentials
- "database 'nira_db' does not exist" → Database not created
