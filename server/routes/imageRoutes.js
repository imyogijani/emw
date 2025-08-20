import express from "express";
import {
  getCategoryImages,
  getSellerImages,
  getAdminImages,
  deleteImage,
  permanentDeleteImage,
  updateImageMetadata,
  setPrimaryImage,
  getImageByFilename,
  cleanupOrphanedImages
} from "../services/imageService.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get category images
router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const images = await getCategoryImages(categoryId);
    res.json({
      success: true,
      images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching category images",
      error: error.message
    });
  }
});

// Get seller images
router.get("/seller/:sellerId", authenticateToken, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { imageType, entityId } = req.query;
    
    // Check if user is the seller or admin
    if (req.user._id.toString() !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const images = await getSellerImages(sellerId, imageType, entityId);
    res.json({
      success: true,
      images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller images",
      error: error.message
    });
  }
});

// Get admin images
router.get("/admin", async (req, res) => {
  try {
    const { imageType, entityId } = req.query;
    const images = await getAdminImages(imageType, entityId);
    res.json({
      success: true,
      images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching admin images",
      error: error.message
    });
  }
});

// Get image by filename (for backward compatibility)
router.get("/filename/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const image = await getImageByFilename(filename);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }
    
    res.json({
      success: true,
      image
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching image",
      error: error.message
    });
  }
});

// Update image metadata
router.put("/metadata/:imageId", authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const { imageType, metadata } = req.body;
    
    if (!imageType || !metadata) {
      return res.status(400).json({
        success: false,
        message: "Image type and metadata are required"
      });
    }
    
    const image = await updateImageMetadata(imageId, imageType, metadata);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }
    
    res.json({
      success: true,
      message: "Image metadata updated successfully",
      image
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating image metadata",
      error: error.message
    });
  }
});

// Set primary image (for seller images)
router.put("/primary/:imageId", authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const { sellerId, entityId } = req.body;
    
    // Check if user is the seller or admin
    if (req.user._id.toString() !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const image = await setPrimaryImage(imageId, sellerId, entityId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }
    
    res.json({
      success: true,
      message: "Primary image set successfully",
      image
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error setting primary image",
      error: error.message
    });
  }
});

// Soft delete image
router.delete("/soft/:imageId", authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const { imageType } = req.body;
    
    if (!imageType) {
      return res.status(400).json({
        success: false,
        message: "Image type is required"
      });
    }
    
    const image = await deleteImage(imageId, imageType);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }
    
    res.json({
      success: true,
      message: "Image deleted successfully",
      image
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting image",
      error: error.message
    });
  }
});

// Permanently delete image (admin only)
router.delete("/permanent/:imageId", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { imageId } = req.params;
    const { imageType } = req.body;
    
    if (!imageType) {
      return res.status(400).json({
        success: false,
        message: "Image type is required"
      });
    }
    
    const result = await permanentDeleteImage(imageId, imageType);
    
    res.json({
      success: true,
      message: "Image permanently deleted",
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error permanently deleting image",
      error: error.message
    });
  }
});

// Cleanup orphaned images (admin only)
router.post("/cleanup", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const results = await cleanupOrphanedImages();
    
    res.json({
      success: true,
      message: "Orphaned images cleaned up successfully",
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cleaning up orphaned images",
      error: error.message
    });
  }
});

export default router;