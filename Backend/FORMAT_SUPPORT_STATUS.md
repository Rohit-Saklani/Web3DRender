# Format Support Status - FULLY SUPPORTED

## ✅ Fully Supported Formats (Can be loaded and displayed directly)

### 3D Model Formats
- **.OBJ** ✅ - Wavefront OBJ (with MTL material support)
- **.FBX** ✅ - Autodesk FBX format
- **.GLTF** ✅ - GL Transmission Format (text)
- **.GLB** ✅ - GL Transmission Format (binary)
- **.STL** ✅ - Stereolithography format
- **.DAE** ✅ - Collada format
- **.3DS** ✅ - 3D Studio format
- **.PLY** ✅ - Polygon File Format (mesh or point cloud)

### BIM Formats
- **.IFC** ✅ - Industry Foundation Classes (using web-ifc library)

### Point Cloud Formats
- **.LAS** ✅ - LiDAR point cloud (uncompressed)
- **.XYZ** ✅ - Simple text-based point cloud
- **.PLY** ✅ - Can contain point clouds
- **.PTS** ✅ - Point cloud format with RGB
- **.E57** ✅ - ASTM E57 format (XML-based, binary requires conversion)

### Image Formats
- **.JPG / .JPEG** ✅ - JPEG images (displayed as textured planes)
- **.PNG** ✅ - PNG images (displayed as textured planes)
- **.TIFF / .TIF** ✅ - TIFF images (displayed as textured planes)

## ⚠️ Formats Requiring Conversion (Accepted but need preprocessing)

### Point Cloud Formats
- **.LAZ** ⚠️ - Compressed LAS (needs decompression - convert to LAS first)
- **.RCP** ⚠️ - Autodesk ReCap Project (export as RCS, PLY, or LAS)
- **.RCS** ⚠️ - Autodesk ReCap Scan (attempts parsing, but export recommended)

### BIM Formats
- **.RVT** ⚠️ - Autodesk Revit (export as IFC, GLB, GLTF, or OBJ)
- **.NWD / .NWC** ⚠️ - Autodesk Navisworks (export as GLB, GLTF, or OBJ)
- **.DWG** ⚠️ - AutoCAD Drawing (export as GLB, GLTF, OBJ, or DXF)

### Advanced 3D Formats
- **.USD / .USDZ** ⚠️ - Universal Scene Description (convert to GLB/GLTF)

## 📄 Metadata Formats (Stored, not rendered as 3D)

- **.CSV** ✅ - Comma-separated values (metadata, inspection data)
- **.JSON** ✅ - JSON format (annotations, structured data)
- **.PDF** ✅ - PDF documents (reports & documentation)

## Implementation Details

### Direct Loaders (Three.js)
- GLTFLoader for GLB/GLTF
- OBJLoader for OBJ
- FBXLoader for FBX
- STLLoader for STL
- ColladaLoader for DAE
- TDSLoader for 3DS
- PLYLoader for PLY

### Custom Parsers
- LAS parser (reads LAS header and point data)
- XYZ parser (text-based point cloud)
- PTS parser (point cloud with RGB)
- E57 parser (XML-based E57 files)
- RCS parser (basic binary parsing attempt)

### Specialized Libraries
- web-ifc / web-ifc-three for IFC files

### Performance Optimizations
- Point clouds are sampled if they exceed 500,000 points
- Large models are automatically centered and scaled
- Materials are optimized for web rendering

## Conversion Recommendations

For formats that require conversion:

1. **LAZ → LAS**: Use PDAL, CloudCompare, or laszip
2. **RVT → IFC/GLB**: Use Autodesk Revit export
3. **NWD/NWC → GLB**: Use Autodesk Navisworks export
4. **DWG → GLB**: Use AutoCAD export or conversion tools
5. **USD/USDZ → GLB**: Use Blender (with USD addon) or USD Composer
6. **RCP/RCS → PLY/LAS**: Use Autodesk ReCap export

## Notes

- All formats are accepted for upload
- Formats with native loaders display immediately
- Formats requiring conversion show helpful error messages
- Point clouds with millions of points are automatically sampled for performance
- Image files are displayed as textured planes (not 3D models)
- Metadata files are stored and can be linked to annotations
