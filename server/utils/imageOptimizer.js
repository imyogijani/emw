import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

class ImageOptimizer {
  constructor(config = {}) {
    this.config = {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: {
        jpeg: 80,
        webp: 75
      },
      sizes: {
        thumbnail: { width: 150, height: 150 },
        small: { width: 300, height: 300 },
        medium: { width: 600, height: 600 },
        large: { width: 1200, height: 1200 }
      },
      ...config
    };
  }

  async optimize(inputPath, outputPath, options = {}) {
    const {
      format = 'webp',
      quality = this.config.quality[format] || 80,
      width = null,
      height = null,
      fit = 'inside',
      withMetadata = true
    } = options;

    try {
      let pipeline = sharp(inputPath);
      
      // Get original metadata
      const metadata = await pipeline.metadata();
      
      // Resize if dimensions are provided
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit,
          withoutEnlargement: true
        });
      }

      // Convert format and set quality
      pipeline = pipeline.toFormat(format, { quality });

      // Keep metadata if requested
      if (withMetadata) {
        pipeline = pipeline.withMetadata();
      }

      // Process the image
      await pipeline.toFile(outputPath);

      return {
        path: outputPath,
        format,
        width: width || metadata.width,
        height: height || metadata.height,
        size: fs.statSync(outputPath).size
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error('Failed to optimize image');
    }
  }

  async generateVersions(inputPath, outputDir, options = {}) {
    const versions = {};
    const basename = path.basename(inputPath, path.extname(inputPath));

    // Generate versions for each size
    for (const [size, dimensions] of Object.entries(this.config.sizes)) {
      const outputPath = path.join(outputDir, `${basename}-${size}.webp`);
      versions[size] = await this.optimize(inputPath, outputPath, {
        ...dimensions,
        ...options
      });
    }

    return versions;
  }

  async getImageMetadata(inputPath) {
    try {
      const metadata = await sharp(inputPath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      throw new Error('Failed to get image metadata');
    }
  }

  async calculateImageHash(inputPath) {
    try {
      // Generate a perceptual hash using the image data
      const imageBuffer = await sharp(inputPath)
        .resize(32, 32, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();

      return crypto.createHash('sha256')
        .update(imageBuffer)
        .digest('hex');
    } catch (error) {
      console.error('Failed to calculate image hash:', error);
      throw new Error('Failed to calculate image hash');
    }
  }

  getPublicUrl(filepath, baseUrl) {
    const relativePath = filepath.split('public')[1];
    return `${baseUrl}${relativePath}`;
  }
}

export default new ImageOptimizer();
