import mongoose from "mongoose";

const sellerImageSchema = mongoose.Schema(
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
    url: {
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
    imageType: {
      type: String,
      required: true,
      enum: ['product', 'shop', 'profile', 'document', 'banner'],
    },
    entityId: {
      type: mongoose.ObjectId,
      required: true, // Product ID, Shop ID, etc.
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Product', 'Shop', 'Seller', 'Document'],
    },
    sellerId: {
      type: mongoose.ObjectId,
      ref: 'users',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false, // For marking primary image among multiple images
    },
    metadata: {
      width: Number,
      height: Number,
      description: String,
      alt: String,
      displayOrder: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
sellerImageSchema.index({ sellerId: 1, imageType: 1 });
sellerImageSchema.index({ entityId: 1, entityType: 1 });
sellerImageSchema.index({ filename: 1 });
sellerImageSchema.index({ isActive: 1 });
sellerImageSchema.index({ isPrimary: 1 });

const SellerImage = mongoose.model('SellerImage', sellerImageSchema);
export default SellerImage;