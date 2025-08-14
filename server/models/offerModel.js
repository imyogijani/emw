import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["CART", "CATEGORY", "BRAND", "PRODUCT"],
      required: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscountAmount: {
      type: Number,
      default: 0,
    },
    minCartValue: {
      type: Number,
      default: 0,
    },

    //CATEGORY & SUBCATEGORY will be from same "Category" model
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "products" }],

    usageLimit: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    userUsage: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        count: { type: Number, default: 0 },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
