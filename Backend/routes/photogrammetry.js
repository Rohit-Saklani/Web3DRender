import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { photogrammetryService } from '../services/photogrammetryService.js'
import { modelService } from '../services/modelService.js'
import { asyncHandler, createError } from '../utils/errorHandler.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Create photogrammetry project
router.post(
  '/projects',
  [
    body('model_id').isInt().withMessage('Model ID is required'),
    body('reconstruction_method').optional().isString(),
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

    const { model_id, project_id, reconstruction_method, quality_settings, input_images_count } = req.body

    // Verify model ownership
    const modelExists = await modelService.verifyOwnership(model_id, req.user.id)
    if (!modelExists) {
      throw createError('Model not found', 404)
    }

    const project = await photogrammetryService.createProject(
      model_id,
      req.user.id,
      { project_id, reconstruction_method, quality_settings, input_images_count }
    )

    res.status(201).json(project)
  })
)

// Get photogrammetry project by ID
router.get('/projects/:id', asyncHandler(async (req, res) => {
  const project = await photogrammetryService.getProjectById(req.params.id, req.user.id)

  if (!project) {
    throw createError('Photogrammetry project not found', 404)
  }

  res.json(project)
}))

// Get all photogrammetry projects for a model
router.get('/models/:modelId/projects', asyncHandler(async (req, res) => {
  // Verify model ownership
  const modelExists = await modelService.verifyOwnership(req.params.modelId, req.user.id)
  if (!modelExists) {
    throw createError('Model not found', 404)
  }

  const projects = await photogrammetryService.getProjectsByModelId(req.params.modelId, req.user.id)
  res.json(projects)
}))

// Update photogrammetry project
router.put('/projects/:id', asyncHandler(async (req, res) => {
  const { processing_status, output_mesh_path, processing_log } = req.body

  const updated = await photogrammetryService.updateProject(
    req.params.id,
    req.user.id,
    { processing_status, output_mesh_path, processing_log }
  )

  if (!updated) {
    throw createError('Photogrammetry project not found', 404)
  }

  res.json(updated)
}))

// Update camera calibration
router.put(
  '/cameras/:id/calibration',
  [
    body('calibration_matrix').optional().isObject(),
    body('distortion_coefficients').optional().isObject(),
    body('focal_length').optional().isFloat(),
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
      calibration_matrix,
      distortion_coefficients,
      focal_length,
      sensor_width,
      sensor_height,
      image_width,
      image_height
    } = req.body

    const updated = await photogrammetryService.updateCameraCalibration(
      req.params.id,
      req.user.id,
      {
        calibration_matrix,
        distortion_coefficients,
        focal_length,
        sensor_width,
        sensor_height,
        image_width,
        image_height
      }
    )

    if (!updated) {
      throw createError('Camera not found or access denied', 404)
    }

    res.json(updated)
  })
)

export default router
