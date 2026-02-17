-- =====================================================
-- ANNOTATIONS & MARKERS SCHEMA
-- =====================================================
-- This script adds tables for marking points on 3D models
-- and linking them to related images
-- =====================================================

-- =====================================================
-- ANNOTATIONS TABLE
-- =====================================================
-- Stores markers/annotations on 3D models
CREATE TABLE IF NOT EXISTS annotations (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Annotation details
    title VARCHAR(255),
    description TEXT,
    annotation_type VARCHAR(50) DEFAULT 'marker', -- marker, callout, measurement, etc.
    
    -- 3D Position (world coordinates)
    position_x DECIMAL(10, 4) NOT NULL,
    position_y DECIMAL(10, 4) NOT NULL,
    position_z DECIMAL(10, 4) NOT NULL,
    
    -- Visual properties
    color VARCHAR(7) DEFAULT '#FF0000', -- Hex color (red, orange, etc.)
    marker_type VARCHAR(50) DEFAULT 'circle', -- circle, pin, arrow, etc.
    size DECIMAL(5, 2) DEFAULT 1.0,
    
    -- Measurement data (optional)
    measurement_value DECIMAL(10, 2), -- e.g., 10.81 m
    measurement_unit VARCHAR(20) DEFAULT 'm', -- m, cm, ft, etc.
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, archived
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- =====================================================
-- ANNOTATION IMAGES TABLE
-- =====================================================
-- Links images/photos to specific annotations
CREATE TABLE IF NOT EXISTS annotation_images (
    id SERIAL PRIMARY KEY,
    annotation_id INTEGER NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    
    -- Image details
    image_path VARCHAR(500) NOT NULL,
    image_name VARCHAR(255),
    thumbnail_path VARCHAR(500), -- Optional thumbnail
    
    -- Image metadata
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    file_type VARCHAR(50), -- jpg, png, etc.
    
    -- Camera/viewpoint information (for photogrammetry)
    camera_position_x DECIMAL(10, 4),
    camera_position_y DECIMAL(10, 4),
    camera_position_z DECIMAL(10, 4),
    camera_rotation_x DECIMAL(10, 4),
    camera_rotation_y DECIMAL(10, 4),
    camera_rotation_z DECIMAL(10, 4),
    
    -- Image identifier (e.g., P0002111 from the reference)
    image_identifier VARCHAR(100),
    
    -- Display order
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES users(id)
);

-- =====================================================
-- CAMERA VIEWPOINTS TABLE
-- =====================================================
-- Stores camera positions for photogrammetry models
-- (for syncing 3D view with source images)
CREATE TABLE IF NOT EXISTS camera_viewpoints (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    
    -- Camera position in 3D space
    position_x DECIMAL(10, 4) NOT NULL,
    position_y DECIMAL(10, 4) NOT NULL,
    position_z DECIMAL(10, 4) NOT NULL,
    
    -- Camera rotation
    rotation_x DECIMAL(10, 4) DEFAULT 0,
    rotation_y DECIMAL(10, 4) DEFAULT 0,
    rotation_z DECIMAL(10, 4) DEFAULT 0,
    
    -- Camera properties
    fov DECIMAL(5, 2), -- Field of view
    focal_length DECIMAL(8, 2),
    
    -- Related image
    image_path VARCHAR(500),
    image_identifier VARCHAR(100), -- e.g., P0002111
    
    -- View settings
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Annotations indexes
CREATE INDEX IF NOT EXISTS idx_annotations_model_id ON annotations(model_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_type ON annotations(annotation_type);
CREATE INDEX IF NOT EXISTS idx_annotations_status ON annotations(status);
CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON annotations(created_at);

-- Annotation images indexes
CREATE INDEX IF NOT EXISTS idx_annotation_images_annotation_id ON annotation_images(annotation_id);
CREATE INDEX IF NOT EXISTS idx_annotation_images_display_order ON annotation_images(display_order);
CREATE INDEX IF NOT EXISTS idx_annotation_images_identifier ON annotation_images(image_identifier);

-- Camera viewpoints indexes
CREATE INDEX IF NOT EXISTS idx_camera_viewpoints_model_id ON camera_viewpoints(model_id);
CREATE INDEX IF NOT EXISTS idx_camera_viewpoints_primary ON camera_viewpoints(is_primary);
CREATE INDEX IF NOT EXISTS idx_camera_viewpoints_display_order ON camera_viewpoints(display_order);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMP
-- =====================================================

-- Trigger for annotations table
CREATE TRIGGER update_annotations_updated_at 
    BEFORE UPDATE ON annotations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (OPTIONAL - COMMENT OUT IF NOT NEEDED)
-- =====================================================

-- Example: Create a sample annotation
-- INSERT INTO annotations (model_id, user_id, title, description, position_x, position_y, position_z, color, annotation_type)
-- VALUES (1, 1, 'Crack Detection', 'Found crack on right silo', 5.2, 10.5, 3.1, '#FF0000', 'marker');

-- Example: Link an image to annotation
-- INSERT INTO annotation_images (annotation_id, image_path, image_name, image_identifier, display_order)
-- VALUES (1, '/uploads/images/crack_photo_1.jpg', 'Crack Photo 1', 'P0002111', 1);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all annotations for a model with image count
-- SELECT 
--     a.*,
--     COUNT(ai.id) as image_count
-- FROM annotations a
-- LEFT JOIN annotation_images ai ON a.id = ai.annotation_id
-- WHERE a.model_id = 1
-- GROUP BY a.id
-- ORDER BY a.created_at DESC;

-- Get annotation with all related images
-- SELECT 
--     a.*,
--     ai.id as image_id,
--     ai.image_path,
--     ai.image_name,
--     ai.image_identifier,
--     ai.display_order
-- FROM annotations a
-- LEFT JOIN annotation_images ai ON a.id = ai.annotation_id
-- WHERE a.id = 1
-- ORDER BY ai.display_order;

-- Get camera viewpoints for a model
-- SELECT * FROM camera_viewpoints
-- WHERE model_id = 1
-- ORDER BY display_order;

-- =====================================================
-- END OF ANNOTATIONS SCHEMA
-- =====================================================
