import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'
import { authenticate } from '../middleware/auth.js'
import { modelService } from '../services/modelService.js'
import { georeferencingService } from '../services/georeferencingService.js'
import { volumetricVideoService } from '../services/volumetricVideoService.js'
import { videoProcessor } from '../services/videoProcessor.js'
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE, FILE_CATEGORIES } from '../constants/fileTypes.js'
import { asyncHandler, createError } from '../utils/errorHandler.js'
import { validateFileContent, sanitizeFilename } from '../utils/fileValidator.js'
import pool from '../config/database.js' // Needed for project verification

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const sanitizedName = sanitizeFilename(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(sanitizedName))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Get file extension
    const fileExt = path.extname(file.originalname).toLowerCase()
    
    // Check if extension is allowed
    const isAllowed = ALLOWED_EXTENSIONS.includes(fileExt)
    
    if (isAllowed) {
      return cb(null, true)
    } else {
      cb(new Error(`Invalid file type. Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`))
    }
  },
})

// All routes require authentication
router.use(authenticate)

// Get all models for user (with pagination)
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 50
  
  const result = await modelService.getByUserId(req.user.id, { page, limit })
  res.json(result)
}))

// Get single model
router.get('/:id', asyncHandler(async (req, res) => {
  const model = await modelService.getById(req.params.id, req.user.id)
  
  if (!model) {
    throw createError('Model not found', 404)
  }

  res.json(model)
}))

// Upload model
router.post('/upload', upload.single('model'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No file uploaded', 400)
  }

  // Validate file content (MIME type check)
  const validation = await validateFileContent(req.file.path, req.file.originalname)
  if (!validation.valid) {
    // Delete uploaded file if validation fails
    try {
      await fs.unlink(req.file.path)
    } catch (error) {
      console.error('Error deleting invalid file:', error)
    }
    throw createError(validation.error || 'File validation failed', 400)
  }

  const { project_id, name, description, crs, origin_lat, origin_lon, origin_altitude, transform_matrix, model_type, metadata } = req.body

  // Project ID is now required
  if (!project_id) {
    // Delete uploaded file if project_id is missing
    try {
      await fs.unlink(req.file.path)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
    throw createError('Project ID is required. Please create a project first.', 400)
  }

  // Verify project belongs to user
  const projectCheck = await pool.query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [project_id, req.user.id]
  )
  if (projectCheck.rows.length === 0) {
    // Delete uploaded file if project validation fails
    try {
      await fs.unlink(req.file.path)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
    throw createError('Project not found or you do not have access to it', 404)
  }

  // Store only the filename for serving via /uploads route
  const fileName = path.basename(req.file.path)
  const fileExt = path.extname(req.file.originalname).toLowerCase()
  
  // Auto-detect model type if volumetric video file
  let detectedModelType = model_type || 'static'
  if (FILE_CATEGORIES.VOLUMETRIC_VIDEO.includes(fileExt)) {
    detectedModelType = 'volumetric_video'
  }

  const model = await modelService.create({
    name: name || req.file.originalname,
    description: description || null,
    file_path: fileName,
    file_size: req.file.size,
    file_type: fileExt,
    project_id: project_id, // Required now
    user_id: req.user.id,
    crs: crs || null,
    origin_lat: origin_lat || null,
    origin_lon: origin_lon || null,
    origin_altitude: origin_altitude || null,
    transform_matrix: transform_matrix || null,
    model_type: detectedModelType,
    metadata: metadata || null
  })

  // If volumetric video, process it automatically in background
  if (detectedModelType === 'volumetric_video' && FILE_CATEGORIES.VOLUMETRIC_VIDEO.includes(fileExt)) {
    try {
      // Process video in background (don't wait for completion)
      processVolumetricVideoAsync(model.id, req.file.path, req.user.id).catch(error => {
        console.error('Error processing volumetric video:', error)
      })
    } catch (error) {
      console.error('Error starting volumetric video processing:', error)
      // Don't fail the upload if processing fails
    }
  }

  res.status(201).json(model)
}))

// Delete model
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await modelService.delete(req.params.id, req.user.id)

  if (!deleted) {
    throw createError('Model not found', 404)
  }

  // Delete physical file from filesystem
  if (deleted.file_path) {
    try {
      const filePath = join(__dirname, '../uploads', deleted.file_path)
      await fs.unlink(filePath)
    } catch (error) {
      // Log error but don't fail the request if file deletion fails
      // (file might already be deleted or not exist)
      console.error('Error deleting file:', error.message)
    }
  }

  res.json({ message: 'Model deleted successfully' })
}))

// Helper function to process volumetric video asynchronously
async function processVolumetricVideoAsync(modelId, videoPath, userId) {
  try {
    // Process the video
    const result = await videoProcessor.processVolumetricVideo(videoPath, modelId, {
      maxFrames: 1000 // Limit to 1000 frames for initial processing
    })

    // Get video metadata
    const metadata = await videoProcessor.getVideoMetadata(videoPath)

    // Create volumetric video record
    const video = await volumetricVideoService.createVideo(
      modelId,
      userId,
      {
        video_path: path.basename(videoPath),
        frame_count: result.frameCount,
        fps: metadata.fps,
        resolution_width: metadata.resolution_width,
        resolution_height: metadata.resolution_height,
        format: metadata.format,
        metadata: {
          processing_status: 'completed',
          processed_at: new Date().toISOString()
        }
      }
    )

    // Add frames to database
    for (let i = 0; i < result.framePaths.length; i++) {
      const framePath = result.framePaths[i]
      const frameNumber = i + 1
      const timestamp = frameNumber / metadata.fps

      await volumetricVideoService.addFrame(video.id, {
        frame_number: frameNumber,
        frame_path: framePath,
        timestamp: timestamp
      })
    }

    console.log(`✅ Volumetric video processed: ${result.frameCount} frames extracted for model ${modelId}`)
  } catch (error) {
    console.error(`❌ Error processing volumetric video for model ${modelId}:`, error)
    // Optionally update model with error status
  }
}

// Update model georeferencing
router.put('/:id/georeferencing', asyncHandler(async (req, res) => {
  const { crs, origin_lat, origin_lon, origin_altitude, transform_matrix } = req.body
  
  const updated = await georeferencingService.updateGeoreferencing(
    req.params.id,
    req.user.id,
    { crs, origin_lat, origin_lon, origin_altitude, transform_matrix }
  )
  
  if (!updated) {
    throw createError('Model not found or access denied', 404)
  }
  
  res.json(updated)
}))

// Convert coordinates (3D to geographic or vice versa)
router.post('/:id/convert-coordinates', asyncHandler(async (req, res) => {
  const { x, y, z, lat, lon, altitude, direction } = req.body
  
  // Verify model ownership
  const modelExists = await modelService.verifyOwnership(req.params.id, req.user.id)
  if (!modelExists) {
    throw createError('Model not found', 404)
  }
  
  let result = null
  
  if (direction === 'to-geographic' && x !== undefined && y !== undefined && z !== undefined) {
    // Convert 3D coordinates to geographic
    result = await georeferencingService.convertToGeographic(req.params.id, x, y, z)
  } else if (direction === 'to-local' && lat !== undefined && lon !== undefined) {
    // Convert geographic coordinates to 3D
    result = await georeferencingService.convertToLocal(req.params.id, lat, lon, altitude || 0)
  } else {
    throw createError('Invalid conversion parameters', 400)
  }
  
  if (!result) {
    throw createError('Model is not georeferenced', 400)
  }
  
  res.json(result)
}))

export default router
