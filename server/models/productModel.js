import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false, // Subcategory is optional
    },
    image: {
      type: [String], // Array of image URLs
      validate: [(arr) => arr.length <= 10, "Max 10 images allowed"],
      required: true,
    },
    // VARIANTS ARRAY
    // variants: [
    //   {
    //     name: { type: String, required: true }, // "Default", "Premium", etc.
    //     price: { type: Number, required: true },
    //     inStock: { type: Boolean, default: true },
    //   },
    // ],
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Variant" }],
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      // required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    location: {
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    status: {
      type: String,
      required: true,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    technicalDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TechnicalDetails",
      // required: true,
    },
    activeDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "deals",
      default: null,
    },
    finalPrice: { type: Number },
    isPremium: {
      type: Boolean,
      default: false,
    },
    gstPercentage: {
      type: Number,
      default: 0, // Default 0% GST if not specified
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
productSchema.index({ seller: 1 }); // Seller wise product find fast
productSchema.index({ createdAt: -1 });
productSchema.pre("save", function (next) {
  this.finalPrice = this.price - (this.price * this.discount) / 100;
  console.log("Produc schema", this.finalPrice);
  next();
});

productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  const price = update.price;
  const discount = update.discount;
  const stock = update.stock !== undefined ? update.stock : update.$set?.stock;

  if (price !== undefined || discount !== undefined) {
    // Use $set to ensure proper MongoDB behavior
    const currentPrice =
      price !== undefined ? price : this.getUpdate().$set?.price;
    const currentDiscount =
      discount !== undefined ? discount : this.getUpdate().$set?.discount || 0;

    const final = currentPrice - (currentPrice * currentDiscount) / 100;

    if (!update.$set) {
      update.$set = {};
    }

    update.$set.finalPrice = final;
  }

  if (stock !== undefined) {
    if (!update.$set) update.$set = {};

    if (stock === 0) {
      update.$set.status = "Out of Stock";
    } else if (stock <= 5) {
      update.$set.status = "Low Stock";
    } else {
      update.$set.status = "In Stock";
    }
  }

  next();
});

const Product = mongoose.model("products", productSchema);
export default Product;
