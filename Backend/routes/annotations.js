import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { annotationService } from '../services/annotationService.js'
import { modelService } from '../services/modelService.js'
import { asyncHandler, createError } from '../utils/errorHandler.js'
import pool from '../config/database.js' // Still needed for model verification

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all annotations for a model
router.get('/model/:modelId', asyncHandler(async (req, res) => {
  // Verify model belongs to user
  const modelExists = await modelService.verifyOwnership(req.params.modelId, req.user.id)
  
  if (!modelExists) {
    throw createError('Model not found', 404)
  }

  const annotations = await annotationService.getByModelId(req.params.modelId)
  res.json(annotations)
}))

// Get single annotation with all images
router.get('/:id', asyncHandler(async (req, res) => {
  const annotation = await annotationService.getById(req.params.id, req.user.id)

  if (!annotation) {
    throw createError('Annotation not found', 404)
  }

  res.json(annotation)
}))

// Create annotation
router.post(
  '/',
  [
    body('model_id').isInt().withMessage('Model ID is required'),
    body('position_x').isFloat().withMessage('Position X is required'),
    body('position_y').isFloat().withMessage('Position Y is required'),
    body('position_z').isFloat().withMessage('Position Z is required'),
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
      title,
      description,
      position_x,
      position_y,
      position_z,
      normal_x,
      normal_y,
      normal_z,
      color,
      annotation_type,
      measurement_value,
      measurement_unit,
      priority,
      latitude,
      longitude,
      altitude,
      georeferenced
    } = req.body

    // Verify model belongs to user
    const modelExists = await modelService.verifyOwnership(model_id, req.user.id)
    if (!modelExists) {
      throw createError('Model not found', 404)
    }

    const annotation = await annotationService.create({
      model_id,
      user_id: req.user.id,
      title,
      description,
      position_x,
      position_y,
      position_z,
      normal_x,
      normal_y,
      normal_z,
      color,
      annotation_type,
      measurement_value,
      measurement_unit,
      priority,
    })

    res.status(201).json(annotation)
  })
)

// Update annotation
router.put('/:id', asyncHandler(async (req, res) => {
  const {
    title,
    description,
    position_x,
    position_y,
    position_z,
    color,
    status,
    priority,
    measurement_value,
    measurement_unit,
  } = req.body

  const annotation = await annotationService.update(req.params.id, req.user.id, {
    title,
    description,
    position_x,
    position_y,
    position_z,
    color,
    status,
    priority,
    measurement_value,
    measurement_unit,
  })

  if (!annotation) {
    throw createError('Annotation not found', 404)
  }

  res.json(annotation)
}))

// Delete annotation
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await annotationService.delete(req.params.id, req.user.id)

  if (!deleted) {
    throw createError('Annotation not found', 404)
  }

  res.json({ message: 'Annotation deleted successfully' })
}))

// Add image to annotation
router.post(
  '/:id/images',
  [
    body('image_path').notEmpty().withMessage('Image path is required'),
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

    // Verify annotation belongs to user
    const annotationExists = await annotationService.verifyOwnership(req.params.id, req.user.id)
    if (!annotationExists) {
      throw createError('Annotation not found', 404)
    }

    const {
      image_path,
      image_name,
      thumbnail_path,
      image_identifier,
      camera_position_x,
      camera_position_y,
      camera_position_z,
      display_order,
    } = req.body

    const result = await pool.query(
      `INSERT INTO annotation_images (
        annotation_id, image_path, image_name, thumbnail_path,
        image_identifier, camera_position_x, camera_position_y, camera_position_z,
        display_order, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.params.id,
        image_path,
        image_name || null,
        thumbnail_path || null,
        image_identifier || null,
        camera_position_x || null,
        camera_position_y || null,
        camera_position_z || null,
        display_order || 0,
        req.user.id,
      ]
    )

    res.status(201).json(result.rows[0])
  })
)

// Delete image from annotation
router.delete('/images/:imageId', asyncHandler(async (req, res) => {
  // Verify image belongs to user's annotation
  const imageCheck = await pool.query(
    `SELECT ai.id FROM annotation_images ai
     JOIN annotations a ON ai.annotation_id = a.id
     WHERE ai.id = $1 AND a.user_id = $2`,
    [req.params.imageId, req.user.id]
  )

  if (imageCheck.rows.length === 0) {
    throw createError('Image not found', 404)
  }

  await pool.query('DELETE FROM annotation_images WHERE id = $1', [req.params.imageId])

  res.json({ message: 'Image deleted successfully' })
}))

export default router
