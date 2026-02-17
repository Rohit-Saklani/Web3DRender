# Annotations & Markers Setup

## Quick Setup

Run this SQL file in your PostgreSQL database:

```sql
-- Copy and paste the contents of annotations_schema.sql
```

Or use psql:

```bash
psql -U postgres -d nira_db -f Backend/annotations_schema.sql
```

## Tables Created

### 1. `annotations`
Stores markers/annotations on 3D models:
- **Position**: 3D coordinates (x, y, z)
- **Visual**: Color, marker type, size
- **Details**: Title, description, type (marker, callout, measurement)
- **Status**: active, resolved, archived
- **Priority**: low, normal, high, critical

### 2. `annotation_images`
Links images/photos to annotations:
- **Image path**: Location of the image file
- **Thumbnail**: Optional thumbnail path
- **Camera position**: 3D position where photo was taken
- **Image identifier**: Unique ID (e.g., P0002111)
- **Display order**: Order for showing images

### 3. `camera_viewpoints`
Stores camera positions for photogrammetry:
- **Camera position**: Where the photo was taken from
- **Camera rotation**: Direction camera was facing
- **Image link**: Related image file
- **Primary view**: Mark main viewpoints

## Usage Examples

### Create an Annotation
```sql
INSERT INTO annotations (
    model_id, 
    user_id, 
    title, 
    description, 
    position_x, 
    position_y, 
    position_z, 
    color, 
    annotation_type,
    measurement_value,
    measurement_unit
) VALUES (
    1,  -- model_id
    1,  -- user_id
    'Crack Detection',
    'Found crack on right silo',
    5.2,  -- x position
    10.5, -- y position
    3.1,  -- z position
    '#FF0000', -- red color
    'marker',
    10.81, -- measurement
    'm'     -- meters
);
```

### Link Images to Annotation
```sql
INSERT INTO annotation_images (
    annotation_id,
    image_path,
    image_name,
    image_identifier,
    camera_position_x,
    camera_position_y,
    camera_position_z,
    display_order
) VALUES (
    1, -- annotation_id
    '/uploads/images/crack_photo_1.jpg',
    'Crack Photo 1',
    'P0002111',
    5.5,  -- camera x
    11.0, -- camera y
    4.0,  -- camera z
    1     -- display order
);
```

### Get Annotation with Images
```sql
SELECT 
    a.id,
    a.title,
    a.description,
    a.position_x,
    a.position_y,
    a.position_z,
    a.color,
    a.measurement_value,
    a.measurement_unit,
    json_agg(
        json_build_object(
            'id', ai.id,
            'image_path', ai.image_path,
            'image_name', ai.image_name,
            'image_identifier', ai.image_identifier,
            'display_order', ai.display_order
        ) ORDER BY ai.display_order
    ) as images
FROM annotations a
LEFT JOIN annotation_images ai ON a.id = ai.annotation_id
WHERE a.model_id = 1
GROUP BY a.id
ORDER BY a.created_at DESC;
```

## Features Supported

✅ Mark points on 3D models  
✅ Link multiple images to each annotation  
✅ Store 3D positions (x, y, z coordinates)  
✅ Color-coded markers (red, orange, etc.)  
✅ Measurements (with units)  
✅ Camera viewpoints for photogrammetry  
✅ Image thumbnails  
✅ Display ordering  
✅ Status tracking (active, resolved, archived)  
✅ Priority levels  

## Next Steps

After running the SQL:
1. Update your backend API to handle annotations
2. Create frontend components for:
   - Adding markers on 3D models
   - Displaying annotation images
   - Camera viewpoint navigation
3. Add image upload functionality for annotation images
