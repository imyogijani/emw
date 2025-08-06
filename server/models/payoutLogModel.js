import mongoose from "mongoose";

const payoutLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // For traceability
    amount: { type: Number, required: true },
    commission: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["online", "cod"],
      required: true,
    },
    razorpayTransferId: String,
    isSettled: {
      type: Boolean,
      default: false,
    },
    settledAt: {
      type: Date,
    },
    status: { type: String, enum: ["success", "failed"], required: true },
    cashfreeReferenceId: { type: String },
    reason: { type: String },
    payoutAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("PayoutLog", payoutLogSchema);
