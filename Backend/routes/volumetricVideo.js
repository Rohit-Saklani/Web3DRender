import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { volumetricVideoService } from '../services/volumetricVideoService.js'
import { modelService } from '../services/modelService.js'
import { asyncHandler, createError } from '../utils/errorHandler.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Create volumetric video
router.post(
  '/videos',
  [
    body('model_id').isInt().withMessage('Model ID is required'),
    body('video_path').isString().withMessage('Video path is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      })
    }

    const {
      model_id,
      video_path,
      frame_count,
      fps,
      resolution_width,
      resolution_height,
      format,
      metadata
    } = req.body

    // Verify model ownership
    const modelExists = await modelService.verifyOwnership(model_id, req.user.id)
    if (!modelExists) {
      throw createError('Model not found', 404)
    }

    const video = await volumetricVideoService.createVideo(
      model_id,
      req.user.id,
      { video_path, frame_count, fps, resolution_width, resolution_height, format, metadata }
    )

    res.status(201).json(video)
  })
)

// Get volumetric video by ID
router.get('/videos/:id', asyncHandler(async (req, res) => {
  const video = await volumetricVideoService.getVideoById(req.params.id, req.user.id)

  if (!video) {
    throw createError('Volumetric video not found', 404)
  }

  res.json(video)
}))

// Get volumetric video by model ID
router.get('/models/:modelId/video', asyncHandler(async (req, res) => {
  // Verify model ownership
  const modelExists = await modelService.verifyOwnership(req.params.modelId, req.user.id)
  if (!modelExists) {
    throw createError('Model not found', 404)
  }

  const video = await volumetricVideoService.getVideoByModelId(req.params.modelId, req.user.id)

  if (!video) {
    throw createError('Volumetric video not found for this model', 404)
  }

  res.json(video)
}))

// Get frames for volumetric video
router.get('/videos/:id/frames', asyncHandler(async (req, res) => {
  const videoId = req.params.id
  const startFrame = req.query.startFrame ? parseInt(req.query.startFrame) : undefined
  const endFrame = req.query.endFrame ? parseInt(req.query.endFrame) : undefined
  const limit = req.query.limit ? parseInt(req.query.limit) : 100

  // Verify video ownership
  const video = await volumetricVideoService.getVideoById(videoId, req.user.id)
  if (!video) {
    throw createError('Volumetric video not found', 404)
  }

  const frames = await volumetricVideoService.getFrames(videoId, {
    startFrame,
    endFrame,
    limit
  })

  res.json(frames)
}))

// Add frame to volumetric video
router.post(
  '/videos/:id/frames',
  [
    body('frame_number').isInt().withMessage('Frame number is required'),
    body('frame_path').isString().withMessage('Frame path is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      })
    }

    const videoId = req.params.id
    const { frame_number, frame_path, timestamp } = req.body

    // Verify video ownership
    const video = await volumetricVideoService.getVideoById(videoId, req.user.id)
    if (!video) {
      throw createError('Volumetric video not found', 404)
    }

    const frame = await volumetricVideoService.addFrame(videoId, {
      frame_number,
      frame_path,
      timestamp
    })

    res.status(201).json(frame)
  })
)

// Delete volumetric video
router.delete('/videos/:id', asyncHandler(async (req, res) => {
  const deleted = await volumetricVideoService.deleteVideo(req.params.id, req.user.id)

  if (!deleted) {
    throw createError('Volumetric video not found', 404)
  }

  res.json({ message: 'Volumetric video deleted successfully' })
}))

export default router
