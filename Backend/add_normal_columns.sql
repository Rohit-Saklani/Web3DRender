-- Add normal vector columns to annotations table for proper 3D positioning
ALTER TABLE annotations 
ADD COLUMN IF NOT EXISTS normal_x DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS normal_y DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS normal_z DECIMAL(10, 4);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_annotations_normal ON annotations(normal_x, normal_y, normal_z) WHERE normal_x IS NOT NULL;
