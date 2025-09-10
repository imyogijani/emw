import mongoose from "mongoose";

const adminImageSchema = mongoose.Schema(
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
      enum: ["category", "brand", "banner", "promotion", "system", "deal"],
    },
    entityId: {
      type: mongoose.ObjectId,
      required: false, // Optional for system images
    },
    entityType: {
      type: String,
      required: false,
      enum: ["Category", "Brand", "Deal", "Promotion"],
    },
    uploadedBy: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true, // Whether image is publicly accessible
    },
    metadata: {
      width: Number,
      height: Number,
      description: String,
      alt: String,
      tags: [String],
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
adminImageSchema.index({ uploadedBy: 1, imageType: 1 });
adminImageSchema.index({ entityId: 1, entityType: 1 });
adminImageSchema.index({ filename: 1 });
adminImageSchema.index({ isActive: 1 });
adminImageSchema.index({ isPublic: 1 });

const AdminImage = mongoose.model("AdminImage", adminImageSchema);
export default AdminImage;
