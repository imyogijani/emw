import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
    unique: true,
  },
  pricing: {
    monthly: {
      type: String,
      required: false,
    },
    yearly: {
      type: String,
      required: false,
    },
  },
  includedFeatures: {
    type: [String],
    required: true,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  upiQrCode: {
    type: String, // Base64 encoded image or file path
    required: false,
  },
  upiId: {
    type: String, // UPI ID for payments
    required: false,
  },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
