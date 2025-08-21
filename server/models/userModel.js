/* eslint-disable no-dupe-keys */
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "shopowner", "client"],
      default: null, // Will be set during onboarding
    },
    avatar: {
      type: String,
      default: null,
    },
    names: {
      type: String,
      required: false, // Will be computed from firstName + lastName
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: "Please enter a valid 10-digit mobile number starting with 6-9"
      }
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    address: {
      addressLine: { type: String, required: false },
      addressLine2: { type: String, required: false },
      city: { type: String, required: false },
      state: { type: String, required: false },
      pincode: { type: String, required: false },
      country: { type: String, required: false, default: "India" },
    },
    phone: {
      type: String,
      required: false, // Will be collected during onboarding
    },
    avatar: {
      type: String,
      default: null,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    subscriptionFeatures: {
      type: [String],
      default: [],
    },
    notification: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    pushToken: { type: String, default: null },
  },
  { timestamps: true }
);

const userModel = mongoose.model("users", userSchema);
export default userModel;
