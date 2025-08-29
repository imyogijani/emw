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
    shopAddresses: [
      {
        addressLine1: { type: String },
        addressLine2: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: "India" },
        isDefault: { type: Boolean, default: false }, // main address
        type: {
          type: String,
          enum: ["store", "warehouse", "pickup"],
          default: "store",
        },
      },
    ],
    specialist: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
    onboardingStep: {
      type: Number,
      default: 1,
    },
    isOnboardingComplete: {
      type: Boolean,
      default: false, // jab tak sab steps complete nahi hote
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    gstNumber: {
      type: String,
      default: null,
    },
    kycVerified: {
      type: Boolean,
      default: false,
    },

    razorpayAccountId: String, // Routes Account ID
    //  razorpayFundAccountId: { type: String, default: null }, // 🔑 payout ke liye
    bankDetails: {
      beneficiary_name: String,
      account_number: String,
      ifsc: String,
    },
  },
  { timestamps: true }
);
sellerSchema.index({ shopName: 1 });
sellerSchema.index({ status: 1 });
sellerSchema.index({ createdAt: -1 });

const Seller = mongoose.model("Seller", sellerSchema);
export default Seller;
