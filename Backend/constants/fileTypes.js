import path from 'path'

// Supported file extensions for 3D models, BIM, point clouds, images, and volumetric videos
export const ALLOWED_EXTENSIONS = [
  // 3D Model Formats
  '.obj', '.fbx', '.gltf', '.glb', '.stl', '.usd', '.usdz', '.dae', '.3ds', '.3dm', '.ply',
  // BIM Formats (may require conversion)
  '.ifc', '.rvt', '.nwd', '.nwc', '.dwg',
  // Point Cloud Formats
  '.las', '.laz', '.e57', '.xyz', '.pts', '.rcp', '.rcs',
  // Image Formats (for textures/annotations)
  '.jpg', '.jpeg', '.png', '.tiff', '.tif',
  // Volumetric Video Formats
  '.mp4', '.mov', '.mvk', '.m4v', '.webm', '.avi',
  // Other Supported Files
  '.csv', '.json', '.pdf'
]

// Maximum file size (1GB default)
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 1073741824

// File type categories
export const FILE_CATEGORIES = {
  MODEL_3D: ['.obj', '.fbx', '.gltf', '.glb', '.stl', '.dae', '.3ds', '.ply'],
  BIM: ['.ifc', '.rvt', '.nwd', '.nwc', '.dwg'],
  POINT_CLOUD: ['.las', '.laz', '.e57', '.xyz', '.pts', '.rcp', '.rcs'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.tiff', '.tif'],
  VOLUMETRIC_VIDEO: ['.mp4', '.mov', '.mvk', '.m4v', '.webm', '.avi'],
  METADATA: ['.csv', '.json', '.pdf']
}

// Helper function to check if file is volumetric video
export const isVolumetricVideo = (filename) => {
  const ext = path.extname(filename).toLowerCase()
  return FILE_CATEGORIES.VOLUMETRIC_VIDEO.includes(ext)
}
