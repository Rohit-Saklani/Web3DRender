# Annotation 3D Positioning Fix

## What Was Fixed

The annotations were appearing as 2D billboards instead of being properly positioned in 3D space on the model surface. This has been fixed by:

1. **Storing Surface Normals**: The database now stores the surface normal vector (normal_x, normal_y, normal_z) for each annotation
2. **Proper 3D Positioning**: Markers are now offset along the surface normal to sit directly on the model surface
3. **Better Orientation**: Markers are oriented to respect the surface while still facing the camera

## Database Migration

Run this SQL script to add the normal columns to your database:

```bash
psql -U postgres -d nira_db -f add_normal_columns.sql
```

Or manually run in PostgreSQL:

```sql
ALTER TABLE annotations 
ADD COLUMN IF NOT EXISTS normal_x DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS normal_y DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS normal_z DECIMAL(10, 4);
```

## Changes Made

### Frontend:
- `AnnotationMarker.jsx`: Now uses surface normals to position markers on the model surface
- `AnnotationViewer.jsx`: Properly captures and transforms surface normals when clicking on the model

### Backend:
- `routes/annotations.js`: Accepts and stores normal_x, normal_y, normal_z when creating annotations

## Testing

1. Run the database migration
2. Restart your backend server
3. Open a 3D model in the viewer
4. Click "Add Marker" and click on the model
5. The marker should now appear directly on the model surface, not floating in 2D space

## Notes

- Existing annotations without normals will use a default up vector (0, 0, 1)
- New annotations will automatically capture and store the surface normal
- The markers still face the camera but are properly positioned in 3D space
