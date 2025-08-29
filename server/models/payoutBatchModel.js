import mongoose from "mongoose";

const payoutBatchSchema = new mongoose.Schema(
  {
    month: { type: String, required: true, index: true }, // "2025-07"
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    grossSales: { type: Number, required: true },
    commission: { type: Number, required: true },
    netPayout: { type: Number, required: true },
    orderItemIds: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "orders" }],
    razorpayPayoutId: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
    },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

payoutBatchSchema.index({ month: 1, sellerId: 1 });

export default mongoose.model("PayoutBatch", payoutBatchSchema);
