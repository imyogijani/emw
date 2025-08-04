import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "deal_request",
        "deal_ended",
        "deal_approved",
        "deal_rejected",
        "system",
        "order",
        "user_activity",
        "subscription_change",
        "user",
        "admin",
        "seller",
      ],
      default: "system",
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Can reference deals, orders, etc.
    },
    relatedModel: {
      type: String,
      required: false,
      enum: ["deals", "orders", "products", "users", "payment"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    actionUrl: {
      type: String,
      required: false, // URL to navigate when notification is clicked
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false, // Additional data specific to notification type
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ relatedId: 1, relatedModel: 1 });

const Notification = mongoose.model("notifications", notificationSchema);

export default Notification;
