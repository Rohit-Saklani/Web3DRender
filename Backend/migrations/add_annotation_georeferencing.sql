-- =====================================================
-- GEOREFERENCING MIGRATION FOR ANNOTATIONS TABLE
-- =====================================================
-- Adds georeferencing support to existing annotations table
-- Enables annotations to have both 3D coordinates and geographic coordinates
-- =====================================================

-- Add georeferencing columns to annotations table
ALTER TABLE annotations
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS altitude DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS georeferenced BOOLEAN DEFAULT false;

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_annotations_lat_lon ON annotations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_annotations_georeferenced ON annotations(georeferenced);

-- Add comment for documentation
COMMENT ON COLUMN annotations.latitude IS 'Geographic latitude in decimal degrees';
COMMENT ON COLUMN annotations.longitude IS 'Geographic longitude in decimal degrees';
COMMENT ON COLUMN annotations.altitude IS 'Altitude above sea level in meters';
COMMENT ON COLUMN annotations.georeferenced IS 'Whether this annotation has geographic coordinates';
