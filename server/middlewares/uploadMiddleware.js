import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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
      req.baseUrl.includes("shop") ||
      req.originalUrl.includes("shopowner")
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
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "-").toLowerCase()
    );
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
export default upload;
