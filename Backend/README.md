# Web3DRender Backend API

Node.js backend API for the Web3DRender 3D visualization platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nira_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
```

4. Create the PostgreSQL database:
```sql
CREATE DATABASE nira_db;
```

5. Run migrations to create tables:
```bash
npm run migrate
```

6. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects (Requires Authentication)
- `GET /api/projects` - Get all user projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Models (Requires Authentication)
- `GET /api/models` - Get all user models
- `GET /api/models/:id` - Get single model
- `POST /api/models/upload` - Upload 3D model file
- `DELETE /api/models/:id` - Delete model

### Users (Requires Authentication)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `GET /api/users/stats` - Get user statistics

## Authentication

Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```
