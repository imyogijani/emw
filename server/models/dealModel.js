import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    dealPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "active", "expired", "ended"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    featuredInOffers: {
      type: Boolean,
      default: false,
    },
    maxQuantity: {
      type: Number,
      required: false,
      min: 1,
    },
    currentSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    termsAndConditions: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
dealSchema.index({ seller: 1, status: 1 });
dealSchema.index({ status: 1, startDate: 1, endDate: 1 });
dealSchema.index({ product: 1 });



// Virtual for checking if deal is currently active
dealSchema.virtual("isActive").get(function () {
  const now = new Date();
  return (
    this.status === "active" && this.startDate <= now && this.endDate >= now
  );
});

// Pre-save middleware to calculate deal price
dealSchema.pre("save", function (next) {
  if (this.originalPrice && this.discountPercentage) {
    this.dealPrice =
      this.originalPrice - (this.originalPrice * this.discountPercentage) / 100;
  }
  next();
});

const Deal = mongoose.model("deals", dealSchema);

export default Deal;
