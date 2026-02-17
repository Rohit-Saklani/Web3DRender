import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { projectService } from '../services/projectService.js'
import { asyncHandler, createError } from '../utils/errorHandler.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all projects for user (with pagination)
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 50
  
  const result = await projectService.getByUserId(req.user.id, { page, limit })
  res.json(result)
}))

// Get single project
router.get('/:id', asyncHandler(async (req, res) => {
  const project = await projectService.getById(req.params.id, req.user.id)

  if (!project) {
    throw createError('Project not found', 404)
  }

  res.json(project)
}))

// Create project
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      })
    }

    const { name, description } = req.body

    const project = await projectService.create({
      name,
      description,
      user_id: req.user.id,
    })

    res.status(201).json(project)
  })
)

// Update project
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, description, status } = req.body

  const project = await projectService.update(req.params.id, req.user.id, {
    name,
    description,
    status,
  })

  if (!project) {
    throw createError('Project not found', 404)
  }

  res.json(project)
}))

// Delete project
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await projectService.delete(req.params.id, req.user.id)

  if (!deleted) {
    throw createError('Project not found', 404)
  }

  res.json({ message: 'Project deleted successfully' })
}))

export default router
