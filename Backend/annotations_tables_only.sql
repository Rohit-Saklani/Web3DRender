-- =====================================================
-- ANNOTATIONS TABLES - COPY & PASTE THIS
-- =====================================================
-- Run this in your PostgreSQL query tool
-- =====================================================

-- Annotations Table
CREATE TABLE IF NOT EXISTS annotations (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    annotation_type VARCHAR(50) DEFAULT 'marker',
    position_x DECIMAL(10, 4) NOT NULL,
    position_y DECIMAL(10, 4) NOT NULL,
    position_z DECIMAL(10, 4) NOT NULL,
    color VARCHAR(7) DEFAULT '#FF0000',
    marker_type VARCHAR(50) DEFAULT 'circle',
    size DECIMAL(5, 2) DEFAULT 1.0,
    measurement_value DECIMAL(10, 2),
    measurement_unit VARCHAR(20) DEFAULT 'm',
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Annotation Images Table
CREATE TABLE IF NOT EXISTS annotation_images (
    id SERIAL PRIMARY KEY,
    annotation_id INTEGER NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    image_name VARCHAR(255),
    thumbnail_path VARCHAR(500),
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    file_type VARCHAR(50),
    camera_position_x DECIMAL(10, 4),
    camera_position_y DECIMAL(10, 4),
    camera_position_z DECIMAL(10, 4),
    camera_rotation_x DECIMAL(10, 4),
    camera_rotation_y DECIMAL(10, 4),
    camera_rotation_z DECIMAL(10, 4),
    image_identifier VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES users(id)
);

-- Camera Viewpoints Table
CREATE TABLE IF NOT EXISTS camera_viewpoints (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    position_x DECIMAL(10, 4) NOT NULL,
    position_y DECIMAL(10, 4) NOT NULL,
    position_z DECIMAL(10, 4) NOT NULL,
    rotation_x DECIMAL(10, 4) DEFAULT 0,
    rotation_y DECIMAL(10, 4) DEFAULT 0,
    rotation_z DECIMAL(10, 4) DEFAULT 0,
    fov DECIMAL(5, 2),
    focal_length DECIMAL(8, 2),
    image_path VARCHAR(500),
    image_identifier VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_annotations_model_id ON annotations(model_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotation_images_annotation_id ON annotation_images(annotation_id);
CREATE INDEX IF NOT EXISTS idx_camera_viewpoints_model_id ON camera_viewpoints(model_id);

-- Trigger for updated_at
CREATE TRIGGER update_annotations_updated_at 
    BEFORE UPDATE ON annotations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
