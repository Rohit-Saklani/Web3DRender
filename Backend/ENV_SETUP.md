# Environment Variables Setup

Create a `.env` file in the Backend directory with the following variables:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nira_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=1073741824
```

## Instructions

1. Copy this content into a new file named `.env` in the Backend directory
2. Replace `your_password` with your PostgreSQL password
3. Replace `your_super_secret_jwt_key_change_this_in_production` with a secure random string
4. Adjust other values as needed for your environment
