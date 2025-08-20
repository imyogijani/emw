import CategoryImage from "../models/categoryImageModel.js";
import SellerImage from "../models/sellerImageModel.js";
import AdminImage from "../models/adminImageModel.js";
import fs from "fs";
import path from "path";

// Get images by category ID
export const getCategoryImages = async (categoryId) => {
  try {
    const images = await CategoryImage.find({
      categoryId,
      isActive: true
    }).sort({ createdAt: -1 });
    return images;
  } catch (error) {
    console.error('Error fetching category images:', error);
    return [];
  }
};

// Get images by seller ID and type
export const getSellerImages = async (sellerId, imageType = null, entityId = null) => {
  try {
    const query = {
      sellerId,
      isActive: true
    };
    
    if (imageType) query.imageType = imageType;
    if (entityId) query.entityId = entityId;
    
    const images = await SellerImage.find(query)
      .sort({ isPrimary: -1, 'metadata.displayOrder': 1, createdAt: -1 });
    return images;
  } catch (error) {
    console.error('Error fetching seller images:', error);
    return [];
  }
};

// Get admin images by type
export const getAdminImages = async (imageType = null, entityId = null) => {
  try {
    const query = {
      isActive: true,
      isPublic: true
    };
    
    if (imageType) query.imageType = imageType;
    if (entityId) query.entityId = entityId;
    
    const images = await AdminImage.find(query)
      .sort({ 'metadata.displayOrder': 1, createdAt: -1 })
      .populate('uploadedBy', 'name email');
    return images;
  } catch (error) {
    console.error('Error fetching admin images:', error);
    return [];
  }
};

// Delete image (soft delete)
export const deleteImage = async (imageId, imageType) => {
  try {
    let Model;
    switch (imageType) {
      case 'category':
        Model = CategoryImage;
        break;
      case 'seller':
        Model = SellerImage;
        break;
      case 'admin':
        Model = AdminImage;
        break;
      default:
        throw new Error('Invalid image type');
    }
    
    const image = await Model.findByIdAndUpdate(
      imageId,
      { isActive: false },
      { new: true }
    );
    
    return image;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Permanently delete image and file
export const permanentDeleteImage = async (imageId, imageType) => {
  try {
    let Model;
    switch (imageType) {
      case 'category':
        Model = CategoryImage;
        break;
      case 'seller':
        Model = SellerImage;
        break;
      case 'admin':
        Model = AdminImage;
        break;
      default:
        throw new Error('Invalid image type');
    }
    
    const image = await Model.findById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }
    
    // Delete physical file
    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }
    
    // Delete database record
    await Model.findByIdAndDelete(imageId);
    
    return { success: true, message: 'Image permanently deleted' };
  } catch (error) {
    console.error('Error permanently deleting image:', error);
    throw error;
  }
};

// Update image metadata
export const updateImageMetadata = async (imageId, imageType, metadata) => {
  try {
    let Model;
    switch (imageType) {
      case 'category':
        Model = CategoryImage;
        break;
      case 'seller':
        Model = SellerImage;
        break;
      case 'admin':
        Model = AdminImage;
        break;
      default:
        throw new Error('Invalid image type');
    }
    
    const image = await Model.findByIdAndUpdate(
      imageId,
      { $set: { metadata } },
      { new: true }
    );
    
    return image;
  } catch (error) {
    console.error('Error updating image metadata:', error);
    throw error;
  }
};

// Set primary image for seller images
export const setPrimaryImage = async (imageId, sellerId, entityId) => {
  try {
    // Remove primary flag from other images of the same entity
    await SellerImage.updateMany(
      { sellerId, entityId, isPrimary: true },
      { isPrimary: false }
    );
    
    // Set the specified image as primary
    const image = await SellerImage.findByIdAndUpdate(
      imageId,
      { isPrimary: true },
      { new: true }
    );
    
    return image;
  } catch (error) {
    console.error('Error setting primary image:', error);
    throw error;
  }
};

// Get image by filename (for backward compatibility)
export const getImageByFilename = async (filename) => {
  try {
    // Search across all image models
    const categoryImage = await CategoryImage.findOne({ filename, isActive: true });
    if (categoryImage) return { ...categoryImage.toObject(), type: 'category' };
    
    const sellerImage = await SellerImage.findOne({ filename, isActive: true });
    if (sellerImage) return { ...sellerImage.toObject(), type: 'seller' };
    
    const adminImage = await AdminImage.findOne({ filename, isActive: true });
    if (adminImage) return { ...adminImage.toObject(), type: 'admin' };
    
    return null;
  } catch (error) {
    console.error('Error fetching image by filename:', error);
    return null;
  }
};

// Cleanup orphaned images (images without associated entities)
export const cleanupOrphanedImages = async () => {
  try {
    const results = {
      category: 0,
      seller: 0,
      admin: 0
    };
    
    // Find and delete orphaned category images
    const orphanedCategoryImages = await CategoryImage.find({
      categoryId: null,
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
    });
    
    for (const image of orphanedCategoryImages) {
      if (fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
      }
      await CategoryImage.findByIdAndDelete(image._id);
      results.category++;
    }
    
    // Similar cleanup for seller and admin images can be added here
    
    return results;
  } catch (error) {
    console.error('Error cleaning up orphaned images:', error);
    throw error;
  }
};