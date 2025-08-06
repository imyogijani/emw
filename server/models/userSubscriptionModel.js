import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  billingCycle: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true,
  },
  featuresUsed: {
    type: Map, // more efficient for dynamic usage tracking
    of: Number,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  paymentStatus: {
    type: String,
    enum: ["paid", "failed", "pending"],
    default: "pending",
  },
  isAutopay: { type: Boolean, default: false },
  razorpaySubscriptionId: { type: String },
});

userSubscriptionSchema.index({ user: 1, isActive: 1, endDate: -1 });

const UserSubscription = mongoose.model(
  "UserSubscription",
  userSubscriptionSchema
);
export default UserSubscription;
