import mongoose from "mongoose";

// Base schema for all image types
const imageBaseSchema = {
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
    enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  size: {
    type: Number,
    required: true,
  },
  dimensions: {
    width: Number,
    height: Number,
  },
  hash: { // For duplicate detection
    type: String,
    index: true,
  },
  uploadedBy: {
    type: mongoose.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isOptimized: {
    type: Boolean,
    default: false,
  },
  metadata: {
    description: String,
    alt: String,
    tags: [String],
    displayOrder: {
      type: Number,
      default: 0,
    },
    customFields: mongoose.Schema.Types.Mixed,
  },
  versions: [{
    url: String,
    width: Number,
    height: Number,
    size: Number,
    format: String,
  }],
};

export const createImageSchema = (additionalFields = {}) => {
  return new mongoose.Schema(
    {
      ...imageBaseSchema,
      ...additionalFields,
    },
    {
      timestamps: true,
      discriminatorKey: 'imageType'
    }
  );
};

export default createImageSchema;
