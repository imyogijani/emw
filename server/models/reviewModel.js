import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      maxlength: 100,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],

    verified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
reviewSchema.index({ product: 1 });
export default mongoose.model("Review", reviewSchema);
