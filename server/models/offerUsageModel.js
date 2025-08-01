import mongoose from "mongoose";

const offerUsageSchema = new mongoose.Schema(
  {
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
    },
    discountApplied: {
      type: Number,
      required: true,
    },
    appliedOn: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// export default mongoose.model("OfferUsage", offerUsageSchema);
const OfferUsage = mongoose.model("OfferUsage", offerUsageSchema);

export default OfferUsage;
