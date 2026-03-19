import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileService {
  constructor() {
    // Base uploads directory
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureDirectories();
  }

  /**
   * Ensure all upload directories exist
   */
  ensureDirectories() {
    const dirs = [
      'qr-codes',
      'files/images',
      'files/videos',
      'files/documents',
      'files/audio',
      'logos',
    ];

    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    dirs.forEach(dir => {
      const fullPath = path.join(this.uploadsDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Get file category from mimetype
   */
  getFileCategory(mimetype) {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'documents';
  }

  /**
   * Upload file and return metadata
   */
  async uploadFile(file, options = {}) {
    const { folder = 'files', userId = 'general' } = options;
    const fileCategory = this.getFileCategory(file.mimetype);
    
    // Create user-specific directory
    const userDir = path.join(this.uploadsDir, folder, userId, fileCategory);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(userDir, fileName);

    // Process and save file
    let buffer = file.buffer;
    let finalMimeType = file.mimetype;
    let metadata = {};

    if (fileCategory === 'images') {
      if (file.mimetype === 'image/gif') {
        finalMimeType = 'image/gif';
        try {
          const image = sharp(buffer);
          const meta = await image.metadata();
          metadata = { width: meta.width, height: meta.height, format: 'gif' };
        } catch(e) { metadata = {}; }
      } else {
        const result = await this.processImage(buffer);
        buffer = result.buffer;
        finalMimeType = 'image/webp';
        metadata = result.metadata;
      }
    }

    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    // Get file stats
    const stats = fs.statSync(filePath);

    // Return relative path and metadata
    const relativePath = path.join(folder, userId, fileCategory, fileName);
    
    return {
      url: `/uploads/${relativePath.replace(/\\/g, '/')}`,
      path: relativePath.replace(/\\/g, '/'),
      fileName: file.originalname,
      storedFileName: fileName,
      fileSize: stats.size,
      mimeType: finalMimeType,
      fileType: fileCategory.slice(0, -1), // Remove 's' (images -> image)
      width: metadata.width,
      height: metadata.height,
      uploadedAt: new Date(),
    };
  }

  /**
   * Process and optimize images
   */
  async processImage(buffer) {
    let image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if too large
    if (metadata.width > 2000 || metadata.height > 2000) {
      image = image.resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to WebP for better compression
    const processedBuffer = await image
      .webp({ quality: 85 })
      .toBuffer();

    const finalMetadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      metadata: {
        width: finalMetadata.width,
        height: finalMetadata.height,
        format: 'webp',
      },
    };
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath) {
    if (!filePath) return;

    const fullPath = path.join(this.uploadsDir, filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`Deleted file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
      }
    }
  }

  /**
   * Get file stats
   */
  getFileStats(filePath) {
    const fullPath = path.join(this.uploadsDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    return fs.statSync(fullPath);
  }

  /**
   * Check if file exists
   */
  fileExists(filePath) {
    const fullPath = path.join(this.uploadsDir, filePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Get full path for a file
   */
  getFullPath(filePath) {
    return path.join(this.uploadsDir, filePath);
  }

  /**
   * Clean up old files (optional - for maintenance)
   */
  async cleanupOldFiles(daysOld = 30) {
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          scanDirectory(filePath);
        } else {
          const age = now - stats.mtimeMs;
          if (age > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        }
      });
    };

    scanDirectory(this.uploadsDir);
  }
}

export default new FileService();