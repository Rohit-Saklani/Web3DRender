# Database Setup Instructions

## Quick Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE nira_db;
   ```

2. **Connect to the database:**
   ```sql
   \c nira_db
   ```

3. **Run the complete setup script:**
   ```sql
   \i database.sql
   ```
   
   Or if using psql command line:
   ```bash
   psql -U postgres -d nira_db -f database.sql
   ```

## What the Script Creates

### Tables:
- **users** - User accounts with authentication
- **projects** - User projects for organizing 3D models
- **models** - 3D model files and metadata

### Indexes:
- Optimized indexes for fast queries on:
  - User email lookups
  - User projects
  - Project models
  - File types
  - Created dates

### Triggers:
- Automatic `updated_at` timestamp updates on all tables

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password (bcrypt)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### Projects Table
- `id` - Primary key
- `name` - Project name
- `description` - Project description
- `status` - Project status (active, completed, etc.)
- `user_id` - Foreign key to users table
- `created_at` - Project creation timestamp
- `updated_at` - Last update timestamp

### Models Table
- `id` - Primary key
- `name` - Model name
- `description` - Model description
- `file_path` - Path to uploaded file
- `file_size` - File size in bytes
- `file_type` - File extension/type
- `project_id` - Foreign key to projects (nullable)
- `user_id` - Foreign key to users table
- `created_at` - Model upload timestamp
- `updated_at` - Last update timestamp

## Verification

After running the script, verify tables were created:
```sql
\dt
```

Verify indexes:
```sql
\di
```

## Notes

- All foreign keys have CASCADE delete for users
- Projects are set to NULL when parent project is deleted (models table)
- All tables have automatic timestamp management
- The script is idempotent - safe to run multiple times (drops tables first)
