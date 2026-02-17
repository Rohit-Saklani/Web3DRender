-- =====================================================
-- Database Indexes for Performance Optimization
-- =====================================================
-- Run this script to add indexes for frequently queried columns
-- This will significantly improve query performance
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Models table indexes
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_project_id ON models(project_id);
CREATE INDEX IF NOT EXISTS idx_models_file_type ON models(file_type);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at);
CREATE INDEX IF NOT EXISTS idx_models_user_created ON models(user_id, created_at DESC);

-- Annotations table indexes
CREATE INDEX IF NOT EXISTS idx_annotations_model_id ON annotations(model_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON annotations(created_at);
CREATE INDEX IF NOT EXISTS idx_annotations_model_created ON annotations(model_id, created_at DESC);

-- Annotation images table indexes
CREATE INDEX IF NOT EXISTS idx_annotation_images_annotation_id ON annotation_images(annotation_id);
CREATE INDEX IF NOT EXISTS idx_annotation_images_display_order ON annotation_images(annotation_id, display_order);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_models_user_project ON models(user_id, project_id) WHERE project_id IS NOT NULL;

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE projects;
ANALYZE models;
ANALYZE annotations;
ANALYZE annotation_images;

-- =====================================================
-- Index Creation Complete
-- =====================================================
-- These indexes will improve:
-- - User authentication lookups (email)
-- - Model listing by user (user_id)
-- - Annotation queries by model (model_id)
-- - Project filtering (user_id, status)
-- - Date-based sorting (created_at)
-- =====================================================
