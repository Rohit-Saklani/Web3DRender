-- =====================================================
-- GEOREFERENCING MIGRATION FOR MODELS TABLE
-- =====================================================
-- Adds georeferencing support to existing models table
-- Run this migration to enable georeferenced inspection & surveying
-- =====================================================

-- Add georeferencing columns to models table
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS crs VARCHAR(50), -- Coordinate Reference System (WGS84, UTM, etc.)
ADD COLUMN IF NOT EXISTS origin_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS origin_lon DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS origin_altitude DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS transform_matrix JSONB, -- 4x4 transformation matrix
ADD COLUMN IF NOT EXISTS model_type VARCHAR(50) DEFAULT 'static', -- static, volumetric_video, photogrammetry
ADD COLUMN IF NOT EXISTS metadata JSONB; -- Flexible metadata storage

-- Add indexes for geospatial queries
CREATE INDEX IF NOT EXISTS idx_models_crs ON models(crs);
CREATE INDEX IF NOT EXISTS idx_models_origin_lat_lon ON models(origin_lat, origin_lon);
CREATE INDEX IF NOT EXISTS idx_models_model_type ON models(model_type);

-- Add comment for documentation
COMMENT ON COLUMN models.crs IS 'Coordinate Reference System (e.g., WGS84, UTM Zone 33N)';
COMMENT ON COLUMN models.origin_lat IS 'Latitude of model origin point';
COMMENT ON COLUMN models.origin_lon IS 'Longitude of model origin point';
COMMENT ON COLUMN models.origin_altitude IS 'Altitude of model origin point in meters';
COMMENT ON COLUMN models.transform_matrix IS '4x4 transformation matrix for coordinate conversion (stored as JSON)';
COMMENT ON COLUMN models.model_type IS 'Type of model: static, volumetric_video, or photogrammetry';
COMMENT ON COLUMN models.metadata IS 'Additional metadata stored as JSON';
