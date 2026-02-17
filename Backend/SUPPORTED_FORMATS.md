# Supported File Formats

## ✅ Fully Supported (Can be loaded and displayed)

### 3D Model Formats
- **.OBJ** - Wavefront OBJ format
- **.FBX** - Autodesk FBX format
- **.GLTF** - GL Transmission Format (text)
- **.GLB** - GL Transmission Format (binary)
- **.STL** - Stereolithography format
- **.DAE** - Collada format
- **.3DS** - 3D Studio format
- **.PLY** - Polygon File Format (mesh or point cloud)

### Point Cloud Formats
- **.XYZ** - Simple text-based point cloud format
- **.PLY** - Can contain point clouds

### Image Formats (displayed as textured planes)
- **.JPG / .JPEG** - JPEG images
- **.PNG** - PNG images
- **.TIFF / .TIF** - TIFF images

## ⚠️ Accepted but Require Conversion

These formats are accepted for upload but need to be converted to supported formats before viewing:

### BIM Formats
- **.IFC** - Industry Foundation Classes (convert to GLB/GLTF)
- **.RVT** - Autodesk Revit (convert to GLB/GLTF/OBJ)
- **.NWD / .NWC** - Autodesk Navisworks (convert to GLB/GLTF)
- **.DWG** - AutoCAD Drawing (convert to GLB/GLTF/OBJ)

### Advanced Point Cloud Formats
- **.LAS / .LAZ** - LiDAR point cloud (convert to PLY or XYZ)
- **.E57** - ASTM E57 point cloud (convert to PLY or XYZ)
- **.PTS** - Point cloud format (convert to PLY or XYZ)
- **.RCP / .RCS** - Autodesk ReCap (convert to PLY or XYZ)

### Advanced 3D Formats
- **.USD / .USDZ** - Universal Scene Description (convert to GLB/GLTF)

## 📄 Metadata & Documentation Formats

These formats are accepted for upload and can be linked to annotations:

- **.CSV** - Comma-separated values (metadata, inspection data)
- **.JSON** - JSON format (annotations, structured data)
- **.PDF** - PDF documents (reports & documentation)

## 🔄 Recommended Conversion Tools

For formats that require conversion:

1. **IFC to GLB**: Use IfcConvert or Blender
2. **RVT to GLB**: Use Autodesk Revit export or Blender
3. **LAS/LAZ to PLY**: Use CloudCompare or PDAL
4. **USD/USDZ to GLB**: Use Blender or USD tools
5. **Point Clouds**: Use CloudCompare, MeshLab, or PDAL

## 📝 Notes

- Large files may need optimization before upload
- Point clouds with millions of points may need decimation
- BIM files typically need conversion to mesh formats
- Image files are displayed as textured planes, not 3D models
- Metadata files (CSV, JSON, PDF) are stored but not rendered as 3D models
