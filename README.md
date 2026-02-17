# Web3DRender - 3D Visualization Platform

A full-stack web application for collaborative 3D model visualization, Web3DRender

## Project Structure

```
3dView/
├── Frontend/          # React.js frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
│   └── package.json
│
└── Backend/           # Node.js backend
    ├── routes/        # API routes
    ├── middleware/    # Auth middleware
    ├── config/        # Database config
    ├── migrations/    # Database migrations
    └── package.json
```

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Axios
- Three.js / @react-three/fiber
- @react-three/drei

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Multer (File uploads)

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp env.template .env
```

4. Update `.env` with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Web3DRender_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
```

5. Create the PostgreSQL database:
```sql
CREATE DATABASE Web3DRender_db;
```

6. Run migrations:
```bash
# Run all migrations in Backend/migrations/
psql -U postgres -d Web3DRender_db -f migrations/add_georeferencing.sql
psql -U postgres -d Web3DRender_db -f migrations/add_annotation_georeferencing.sql
psql -U postgres -d Web3DRender_db -f migrations/add_photogrammetry_tables.sql
psql -U postgres -d Web3DRender_db -f migrations/add_volumetric_video_tables.sql
```

7. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

- ✅ User Authentication (Register/Login)
- ✅ Project Management
- ✅ 3D Model Upload & Visualization
- ✅ 3D Annotations with Surface Normals
- ✅ Dashboard with Statistics
- ✅ Responsive UI matching Nira.app design
- ✅ Multiple pages: Home, About, Pricing, Contact
- ✅ Georeferencing Support
- ✅ Photogrammetry Support
- ✅ Volumetric Video Support
- ✅ Multiple 3D Format Support (OBJ, FBX, GLTF, GLB, STL, IFC, etc.)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects (Requires Auth)
- `GET /api/projects` - Get all projects (with pagination)
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Models (Requires Auth)
- `GET /api/models` - Get all models (with pagination)
- `GET /api/models/:id` - Get single model
- `POST /api/models/upload` - Upload 3D model
- `PUT /api/models/:id/georeferencing` - Update model georeferencing
- `POST /api/models/:id/convert-coordinates` - Convert coordinates
- `DELETE /api/models/:id` - Delete model

### Annotations (Requires Auth)
- `GET /api/annotations` - Get all annotations
- `GET /api/annotations/:id` - Get single annotation
- `POST /api/annotations` - Create annotation
- `PUT /api/annotations/:id` - Update annotation
- `DELETE /api/annotations/:id` - Delete annotation

### Users (Requires Auth)
- `GET /api/users/me` - Get user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/stats` - Get user statistics

### Photogrammetry (Requires Auth)
- `POST /api/photogrammetry/projects` - Create photogrammetry project
- `GET /api/photogrammetry/projects/:id` - Get project status
- `PUT /api/photogrammetry/projects/:id/calibration` - Update calibration

### Volumetric Video (Requires Auth)
- `GET /api/volumetric-video/:modelId` - Get volumetric video
- `GET /api/volumetric-video/:modelId/frames/:frameNumber` - Get frame

## Development

### Backend
- Development: `npm run dev` (uses nodemon)
- Production: `npm start`

### Frontend
- Development: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## License

MIT
