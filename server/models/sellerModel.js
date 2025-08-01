// models/sellerModel.js
import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // reference to the main users table
      required: true,
    },
    shopName: {
      type: String,
      required: true,
    },
    shopImage: {
      type: String, // Main shop image
      default: null,
    },
    shopImages: {
      type: [String], // Optional: Array of additional shop images
      default: [],
    },
    ownerName: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    location: {
      type: String,
      default: "",
    },
    address: {
      type: String, // Full address of the shop
      default: "",
    },
    specialist: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    cashfreeBeneId: String // Optional: For integration with Cashfree or similar payment gateways
  },
  { timestamps: true }
);
sellerSchema.index({ shopName: 1 });
sellerSchema.index({ shopownerName: 1 });
sellerSchema.index({ status: 1 });
sellerSchema.index({ createdAt: -1 });

const Seller = mongoose.model("Seller", sellerSchema);
export default Seller;
