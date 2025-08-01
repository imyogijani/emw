import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
    unique: true,
  },
  // monthlyPrice: {
  //   type: String,
  //   required: true,
  // },
  pricing: {
    monthly: {
      type: String,
      required: false,
    },
    yearly: {
      type: String,
      required: false,
    },
    // optional: quarterly, weekly etc.
  },
  includedFeatures: {
    type: [String],
    required: true,
  },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
