-- =====================================================
-- VOLUMETRIC VIDEO TABLES MIGRATION
-- =====================================================
-- Adds support for volumetric video sequences
-- Enables volumetric video playback in 3D viewer
-- =====================================================

-- Table for volumetric video sequences
CREATE TABLE IF NOT EXISTS volumetric_videos (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_path VARCHAR(500) NOT NULL,
    frame_count INTEGER,
    fps DECIMAL(5, 2),
    resolution_width INTEGER,
    resolution_height INTEGER,
    format VARCHAR(50), -- MVK, PLY_SEQUENCE, etc.
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for volumetric video frames
CREATE TABLE IF NOT EXISTS volumetric_video_frames (
    id SERIAL PRIMARY KEY,
    volumetric_video_id INTEGER NOT NULL REFERENCES volumetric_videos(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    frame_path VARCHAR(500),
    timestamp DECIMAL(10, 4), -- Time in seconds
    UNIQUE(volumetric_video_id, frame_number)
);

-- Indexes for volumetric videos
CREATE INDEX IF NOT EXISTS idx_volumetric_video_model_id ON volumetric_videos(model_id);
CREATE INDEX IF NOT EXISTS idx_volumetric_video_user_id ON volumetric_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_volumetric_frames_video_id ON volumetric_video_frames(volumetric_video_id);
CREATE INDEX IF NOT EXISTS idx_volumetric_frames_frame_number ON volumetric_video_frames(volumetric_video_id, frame_number);

-- Add comments for documentation
COMMENT ON TABLE volumetric_videos IS 'Stores volumetric video sequences';
COMMENT ON TABLE volumetric_video_frames IS 'Stores individual frames of volumetric videos';
COMMENT ON COLUMN volumetric_videos.format IS 'Video format: MVK, PLY_SEQUENCE, etc.';
COMMENT ON COLUMN volumetric_videos.metadata IS 'Additional video metadata stored as JSON';
COMMENT ON COLUMN volumetric_video_frames.timestamp IS 'Frame timestamp in seconds from video start';
