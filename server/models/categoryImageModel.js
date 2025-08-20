import mongoose from "mongoose";

const categoryImageSchema = mongoose.Schema(
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
    categoryId: {
      type: mongoose.ObjectId,
      ref: 'Category',
      required: true,
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
categoryImageSchema.index({ categoryId: 1 });
categoryImageSchema.index({ filename: 1 });
categoryImageSchema.index({ isActive: 1 });

const CategoryImage = mongoose.model('CategoryImage', categoryImageSchema);
export default CategoryImage;