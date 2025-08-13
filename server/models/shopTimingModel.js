import mongoose from "mongoose";

const timeIntervalSchema = new mongoose.Schema(
  {
    openTime: { type: String, required: true }, // "HH:mm" format ideally
    closeTime: { type: String, required: true },
  },
  { _id: false }
);

const shopTimingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      unique: true,
    },
    shopTimingMode: {
      type: String,
      enum: ["24/7", "scheduled", "appointment"],
      default: "scheduled",
    },
    shopTimings: {
      monday: { type: [timeIntervalSchema], default: [] },
      tuesday: { type: [timeIntervalSchema], default: [] },
      wednesday: { type: [timeIntervalSchema], default: [] },
      thursday: { type: [timeIntervalSchema], default: [] },
      friday: { type: [timeIntervalSchema], default: [] },
      saturday: { type: [timeIntervalSchema], default: [] },
      sunday: { type: [timeIntervalSchema], default: [] },
    },
    appointmentDetails: {
      email: { type: String, default: null },
      phone: { type: String, default: null },
      instructions: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const ShopTiming = mongoose.model("ShopTiming", shopTimingSchema);
export default ShopTiming;
