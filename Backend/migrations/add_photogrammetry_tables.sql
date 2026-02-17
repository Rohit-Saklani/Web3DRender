-- =====================================================
-- PHOTOGRAMMETRY TABLES MIGRATION
-- =====================================================
-- Enhances camera_viewpoints table and adds photogrammetry project support
-- Enables photogrammetry for entertainment & historical preservation
-- =====================================================

-- Enhance existing camera_viewpoints table (if it exists)
DO $$ 
BEGIN
    -- Check if camera_viewpoints table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'camera_viewpoints') THEN
        -- Add photogrammetry-specific columns
        ALTER TABLE camera_viewpoints
        ADD COLUMN IF NOT EXISTS calibration_matrix JSONB, -- 3x3 camera matrix
        ADD COLUMN IF NOT EXISTS distortion_coefficients JSONB, -- k1, k2, p1, p2, k3
        ADD COLUMN IF NOT EXISTS focal_length DECIMAL(10, 4),
        ADD COLUMN IF NOT EXISTS sensor_width DECIMAL(10, 4),
        ADD COLUMN IF NOT EXISTS sensor_height DECIMAL(10, 4),
        ADD COLUMN IF NOT EXISTS image_width INTEGER,
        ADD COLUMN IF NOT EXISTS image_height INTEGER;
    END IF;
END $$;

-- New table for photogrammetry projects
CREATE TABLE IF NOT EXISTS photogrammetry_projects (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reconstruction_method VARCHAR(50), -- SfM, MVS, etc.
    quality_settings JSONB,
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    input_images_count INTEGER,
    output_mesh_path VARCHAR(500),
    processing_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for photogrammetry projects
CREATE INDEX IF NOT EXISTS idx_photogrammetry_model_id ON photogrammetry_projects(model_id);
CREATE INDEX IF NOT EXISTS idx_photogrammetry_project_id ON photogrammetry_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_photogrammetry_user_id ON photogrammetry_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_photogrammetry_status ON photogrammetry_projects(processing_status);

-- Add comments for documentation
COMMENT ON TABLE photogrammetry_projects IS 'Stores photogrammetry reconstruction projects';
COMMENT ON COLUMN photogrammetry_projects.reconstruction_method IS 'Method used: SfM (Structure from Motion), MVS (Multi-View Stereo), etc.';
COMMENT ON COLUMN photogrammetry_projects.quality_settings IS 'Quality and processing settings stored as JSON';
COMMENT ON COLUMN photogrammetry_projects.processing_status IS 'Current status: pending, processing, completed, failed';
