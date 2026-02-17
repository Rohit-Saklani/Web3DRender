import express from 'express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { errorHandler, notFoundHandler } from './utils/errorHandler.js'
import { sanitizeMiddleware } from './utils/sanitizer.js'

// Import routes
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import modelRoutes from './routes/models.js'
import userRoutes from './routes/users.js'
import annotationRoutes from './routes/annotations.js'
import photogrammetryRoutes from './routes/photogrammetry.js'
import volumetricVideoRoutes from './routes/volumetricVideo.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Ensure uploads directory exists
const uploadsDir = join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('✅ Created uploads directory')
}

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow loading resources from different origins
  contentSecurityPolicy: false, // Disable CSP for 3D model loading flexibility
}))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'http://localhost:5173'], // Default Vite and React ports
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply rate limiting to all API requests
app.use('/api/', limiter)

// Middleware
app.use(compression()) // Enable gzip compression for all responses
app.use(express.json({ limit: '50mb' })) // Increase limit for large file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(sanitizeMiddleware) // Sanitize all inputs to prevent XSS

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/models', modelRoutes)
app.use('/api/users', userRoutes)
app.use('/api/annotations', annotationRoutes)
app.use('/api/photogrammetry', photogrammetryRoutes)
app.use('/api/volumetric-video', volumetricVideoRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Web3DRender API is running' })
})

// 404 handler (must be before error handler)
app.use(notFoundHandler)

// Error handling middleware (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
