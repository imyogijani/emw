import mongoose from "mongoose";

const technicalDetailsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    modelNumber: { type: String },
    material: { type: String },
    // weight: { type: String },
    // dimensions: { type: String },
    dimensions: {
      length: {
        type: Number,
        required: [true, "Length is required"],
        min: [1, "Length must be greater than 0"],
      },
      width: {
        type: Number,
        required: [true, "Width is required"],
        min: [1, "Width must be greater than 0"],
      },
      height: {
        type: Number,
        required: [true, "Height is required"],
        min: [1, "Height must be greater than 0"],
      },
      unit: { type: String, enum: ["cm", "mm", "inch"], default: "cm" },
    },

    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [1, "Weight must be greater than 0"], // grams
    },

    warranty: { type: String },
    originCountry: { type: String },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },
    isReturnable: { type: Boolean, default: true },
    careInstructions: { type: String },
    usageInstructions: { type: String },
    certification: { type: [String] },
    compatibleDevices: { type: [String] },
    batteryCapacity: { type: String },
    screenSize: { type: String },
    refreshRate: { type: String },
    processor: { type: String },
    ram: { type: String },
    storage: { type: String },
    graphicsCard: { type: String },
    brand: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Seller
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TechnicalDetails", technicalDetailsSchema);

// const technicalDetailsSchema = new mongoose.Schema({
//   brand: String,
//   modelNumber: String,
//   material: String,
//   color: [String],
//   size: [String],
//   weight: String,
//   dimensions: String,
//   warranty: String,
//   originCountry: String,
//   manufacturingDate: Date,
//   expiryDate: Date,
//   isReturnable: { type: Boolean, default: true },
//   careInstructions: String,
//   usageInstructions: String,
//   certification: [String],
//   compatibleDevices: [String],
//   batteryCapacity: String,
//   screenSize: String,
//   refreshRate: String,
//   processor: String,
//   ram: String,
//   storage: String,
//   graphicsCard: String,
// });
