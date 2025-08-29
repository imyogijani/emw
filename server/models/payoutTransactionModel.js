import mongoose from "mongoose";

const payoutTransactionSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayoutBatch",
    },
    orderItemIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order.items",
      },
    ],
    grossSales: Number, // total sales
    commission: Number, // company commission
    netPayout: Number, // seller ka actual paisa
    status: {
      type: String,
      enum: ["pending", "processed", "failed", "reversed"],
      default: "pending",
    },
    utr: { type: String }, // Bank UTR if processed
    failure_reason: { type: String },
    providerPayoutId: String, // Razorpay ka payout_id (transaction id)
    providerResponse: mongoose.Schema.Types.Mixed, // full response JSON
    settledAt: Date,
  },
  { timestamps: true }
);

const PayoutTransaction = mongoose.model(
  "PayoutTransaction",
  payoutTransactionSchema
);

export default PayoutTransaction;
