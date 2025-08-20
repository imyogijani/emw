import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import CategoryImage from "../models/categoryImageModel.js";
import SellerImage from "../models/sellerImageModel.js";
import AdminImage from "../models/adminImageModel.js";

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
    // Preserve original filename with sanitization
    const sanitizedName = file.originalname
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "");
    
    // Add timestamp only if file already exists to avoid conflicts
    const finalName = sanitizedName;
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

// Middleware to save image metadata to database
export const saveImageToDatabase = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.VITE_API_BASE_URL_PROD 
      : `http://localhost:${process.env.PORT || 8080}`;
    
    const imageUrl = `${baseUrl}/uploads/${getImageCategory(req)}/${req.file.filename}`;
    
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
    if (req.baseUrl.includes('category') || req.originalUrl.includes('category')) {
      imageData.categoryId = req.body.categoryId || null;
      imageModel = new CategoryImage(imageData);
    } else if (req.baseUrl.includes('seller') || req.originalUrl.includes('seller')) {
      imageData.imageType = req.body.imageType || 'product';
      imageData.entityId = req.body.entityId || null;
      imageData.entityType = req.body.entityType || 'Product';
      imageData.sellerId = req.user?._id || req.body.sellerId;
      imageModel = new SellerImage(imageData);
    } else {
      // Admin images
      imageData.imageType = req.body.imageType || 'system';
      imageData.entityId = req.body.entityId || null;
      imageData.entityType = req.body.entityType || null;
      imageModel = new AdminImage(imageData);
    }

    const savedImage = await imageModel.save();
    req.imageRecord = savedImage;
    next();
  } catch (error) {
    console.error('Error saving image to database:', error);
    next(); // Continue even if DB save fails
  }
};

// Helper function to determine image category from request
const getImageCategory = (req) => {
  if (req.baseUrl.includes('category') || req.originalUrl.includes('category')) {
    return 'categories';
  } else if (req.baseUrl.includes('brand') || req.originalUrl.includes('brand')) {
    return 'brands';
  } else if (req.baseUrl.includes('product')) {
    return 'products';
  } else if (req.baseUrl.includes('avatar') || req.originalUrl.includes('avatar')) {
    return 'avatars';
  } else if (req.file?.fieldname === 'shopImage' || req.file?.fieldname === 'shopImages') {
    return 'shopowner';
  }
  return 'uploads';
};

export default upload;
