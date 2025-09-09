import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import CategoryImage from "../models/categoryImageModel.js";
import SellerImage from "../models/sellerImageModel.js";
import AdminImage from "../models/adminImageModel.js";

import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, "../public/uploads"),
    path.join(__dirname, "../public/uploads/avatars"),
    path.join(__dirname, "../public/uploads/products"),
    path.join(__dirname, "../public/uploads/categories"),
    path.join(__dirname, "../public/uploads/shopowner"),
    path.join(__dirname, "../public/uploads/brands"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Always store category images in categories folder for any category route
    if (
      req.baseUrl.includes("category") ||
      req.originalUrl.includes("category")
    ) {
      const dest = path.join(__dirname, "../public/uploads/categories");
      cb(null, dest);
    } else if (
      file.fieldname === "shopImage" ||
      file.fieldname === "shopImages"
    ) {
      const dest = path.join(__dirname, "../public/uploads/shopowner");
      cb(null, dest);
    } else if (
      req.baseUrl.includes("brand") ||
      req.originalUrl.includes("brand")
    ) {
      const dest = path.join(__dirname, "../public/uploads/brands");
      cb(null, dest);
    } else if (
      req.baseUrl.includes("avatar") ||
      req.originalUrl.includes("avatar")
    ) {
      const dest = path.join(__dirname, "../public/uploads/avatars");
      cb(null, dest);
    } else if (req.baseUrl.includes("product")) {
      const dest = path.join(__dirname, "../public/uploads/products");
      cb(null, dest);
    } else {
      // fallback
      const dest = path.join(__dirname, "../public/uploads");
      cb(null, dest);
    }
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // extension (e.g. .jpg)
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    //  always unique
    const finalName = `${base}-${Date.now()}-${Math.round(
      Math.random() * 1e6
    )}${ext}`;
    cb(null, finalName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Only allow specific image types
  if (!file.mimetype.match(/^image\/(jpeg|png|gif)$/)) {
    return cb(new Error("Only JPG, PNG and GIF files are allowed!"), false);
  }
  cb(null, true);
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware after multer
// export const optimizeImage = async (req, res, next) => {
//   try {
//     if (!req.file) return next();

//     const filePath = req.file.path; // original upload
//     const ext = path.extname(filePath);
//     const optimizedPath = filePath.replace(ext, `-optimized${ext}`);

//     // optimize
//     await sharp(filePath)
//       .resize(800, 800, { fit: "inside" })
//       .toFormat("jpeg", { quality: 90 })
//       .toFile(optimizedPath);

//     // log sizes
//     console.log(
//       "📦 Original size:",
//       formatFileSize(fs.statSync(filePath).size)
//     );
//     console.log(
//       "✨ Optimized size:",
//       formatFileSize(fs.statSync(optimizedPath).size)
//     );

//     // 🗑 delete original high MB file
//     await fs.promises.unlink(filePath);

//     // update multer file info
//     req.file.path = optimizedPath;
//     req.file.filename = path.basename(optimizedPath);

//     console.log("✅ Original deleted, optimized stored:", req.file.filename);

//     next();
//   } catch (err) {
//     console.error("Sharp processing error:", err);
//     next(err);
//   }
// };

// IMPROVED: Optimize image while maintaining quality
export const optimizeImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filePath = req.file.path;
    const ext = path.extname(filePath).toLowerCase();
    const optimizedPath = filePath.replace(ext, `-optimized${ext}`);

    // Get original image metadata
    const metadata = await sharp(filePath).metadata();
    console.log(
      `📸 Original: ${metadata.width}x${metadata.height}, ${
        metadata.format
      }, ${formatFileSize(fs.statSync(filePath).size)}`
    );

    let sharpInstance = sharp(filePath);

    // QUALITY PRESERVATION STRATEGIES:

    // 1. Smart resizing - only resize if image is very large
    if (metadata.width > 2048 || metadata.height > 2048) {
      // Only resize if really necessary, maintain aspect ratio
      sharpInstance = sharpInstance.resize(2048, 2048, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // 2. Format-specific optimization
    switch (metadata.format) {
      case "jpeg":
      case "jpg":
        // High quality JPEG compression
        sharpInstance = sharpInstance.jpeg({
          quality: 95, // Very high quality
          progressive: true, // Progressive loading
          mozjpeg: true, // Better compression
        });
        break;

      case "png":
        // PNG optimization - lossless compression
        sharpInstance = sharpInstance.png({
          compressionLevel: 9, // Maximum compression
          adaptiveFiltering: true,
          palette: metadata.channels === 4 ? false : true, // Use palette for non-transparent PNGs
        });
        break;

      case "webp":
        // WEBP with high quality
        sharpInstance = sharpInstance.webp({
          quality: 95,
          effort: 6, // Maximum effort for better compression
        });
        break;

      case "gif":
        // For GIF, convert to PNG or keep as is
        if (metadata.pages && metadata.pages > 1) {
          // Animated GIF - keep as is
          await fs.promises.copyFile(filePath, optimizedPath);
          break;
        } else {
          // Static GIF - convert to PNG for better compression
          sharpInstance = sharpInstance.png({ compressionLevel: 9 });
        }
        break;

      default:
        // Convert unknown formats to JPEG
        sharpInstance = sharpInstance.jpeg({ quality: 95, progressive: true });
    }

    // Process the image (skip if it's an animated GIF)
    if (!(metadata.format === "gif" && metadata.pages > 1)) {
      await sharpInstance.toFile(optimizedPath);
    }

    // Compare file sizes
    const originalSize = fs.statSync(filePath).size;
    const optimizedSize = fs.statSync(optimizedPath).size;
    const compressionRatio = (
      ((originalSize - optimizedSize) / originalSize) *
      100
    ).toFixed(1);

    console.log(`📦 Original size: ${formatFileSize(originalSize)}`);
    console.log(`✨ Optimized size: ${formatFileSize(optimizedSize)}`);
    console.log(`🎯 Compression: ${compressionRatio}% smaller`);

    // Only replace original if optimization actually reduced size significantly
    if (optimizedSize < originalSize * 0.95) {
      // If at least 5% smaller
      await fs.promises.unlink(filePath);
      req.file.path = optimizedPath;
      req.file.filename = path.basename(optimizedPath);
      console.log("✅ Original replaced with optimized version");
    } else {
      // Keep original if no significant improvement
      await fs.promises.unlink(optimizedPath);
      console.log("📋 Keeping original - no significant size reduction");
    }

    next();
  } catch (err) {
    console.error("Sharp processing error:", err);
    // If optimization fails, continue with original file
    next();
  }
};

// helper to format KB / MB
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

// // Middleware to save image metadata to database
export const saveImageToDatabase = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.VITE_API_BASE_URL_PROD
        : `http://localhost:${process.env.PORT || 8080}`;

    const imageUrl = `${baseUrl}/uploads/${getImageCategory(req)}/${
      req.file.filename
    }`;

    let imageModel;
    const imageData = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      url: imageUrl,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user?._id || null,
      isActive: true,
    };

    // Determine which model to use based on route
    if (
      req.baseUrl.includes("category") ||
      req.originalUrl.includes("category")
    ) {
      imageData.categoryId = req.body.categoryId || null;
      imageModel = new CategoryImage(imageData);
    } else if (
      req.baseUrl.includes("seller") ||
      req.originalUrl.includes("seller")
    ) {
      imageData.imageType = req.body.imageType || "product";
      imageData.entityId = req.body.entityId || null;
      imageData.entityType = req.body.entityType || "Product";
      imageData.sellerId = req.user?._id || req.body.sellerId;
      imageModel = new SellerImage(imageData);
    } else {
      // Admin images
      imageData.imageType = req.body.imageType || "system";
      imageData.entityId = req.body.entityId || null;
      imageData.entityType = req.body.entityType || null;
      imageModel = new AdminImage(imageData);
    }

    const savedImage = await imageModel.save();
    req.imageRecord = savedImage;
    next();
  } catch (error) {
    console.error("Error saving image to database:", error);
    next(); // Continue even if DB save fails
  }
};

// Helper function to determine image category from request
const getImageCategory = (req) => {
  if (
    req.baseUrl.includes("category") ||
    req.originalUrl.includes("category")
  ) {
    return "categories";
  } else if (
    req.baseUrl.includes("brand") ||
    req.originalUrl.includes("brand")
  ) {
    return "brands";
  } else if (req.baseUrl.includes("product")) {
    return "products";
  } else if (
    req.baseUrl.includes("avatar") ||
    req.originalUrl.includes("avatar")
  ) {
    return "avatars";
  } else if (
    req.file?.fieldname === "shopImage" ||
    req.file?.fieldname === "shopImages"
  ) {
    return "shopowner";
  }
  return "uploads";
};

export default upload;
