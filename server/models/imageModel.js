import mongoose from "mongoose";

const imageSchema = mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['category', 'product', 'seller', 'admin', 'brand', 'avatar', 'shop'],
    },
    entityId: {
      type: mongoose.ObjectId,
      required: false, // Optional for cases where image isn't linked to specific entity yet
    },
    entityType: {
      type: String,
      required: false,
      enum: ['Category', 'Product', 'User', 'Seller', 'Brand', 'Shop'],
    },
    uploadedBy: {
      type: mongoose.ObjectId,
      ref: 'User',
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      width: Number,
      height: Number,
      description: String,
      alt: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
imageSchema.index({ category: 1, entityId: 1 });
imageSchema.index({ filename: 1 });
imageSchema.index({ isActive: 1 });

const Image = mongoose.model('Image', imageSchema);
export default Image;