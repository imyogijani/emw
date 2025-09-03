// models/Variant.js
import mongoose from "mongoose";
import Product from "./productModel.js";

const variantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },

    color: { type: String, required: true },
    size: { type: String, required: false },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    status: {
      type: String,
      //   required: true,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
    finalPrice: { type: Number },
    image: String, // Variant-specific image
    commissionRate: { type: Number, default: 4 },
  },
  { timestamps: true }
);

variantSchema.pre("save", async function (next) {
  //   if (!this.isModified("price")) return next();

  try {
    // const product = await mongoose.model("products").findById(this.productId);
    const product = await Product.findById(this.productId);
    const discount = product?.discount ?? 0;

    this.finalPrice = this.price - (this.price * discount) / 100;

    // Commission auto calculate (same as Product)
    if (this.finalPrice >= 10000) {
      this.commissionRate = 4;
    } else {
      this.commissionRate = 7;
    }

    //  Stock-based status
    if (this.stock === 0) {
      this.status = "Out of Stock";
    } else if (this.stock <= 5) {
      this.status = "Low Stock";
    } else {
      this.status = "In Stock";
    }
    // console.log("Fetching product for discount:", this.productId);
    // console.log("Found product:", product);
    // console.log("Product discount:", product?.discount);
    // console.log("Calculated finalPrice:", this.finalPrice);
    next();
  } catch (error) {
    next(error);
  }
});

variantSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const stock = update.stock ?? update.$set?.stock;

  const docToUpdate = await this.model.findOne(this.getQuery());
  if (!docToUpdate) return next();

  const product = await Product.findById(docToUpdate.productId);
  if (!product) return next();

  //  Safe finalPrice calculation
  if (update.price !== undefined) {
    const basePrice = update.price;
    const discount = product.discount || 0;

    const finalPrice = basePrice - (basePrice * discount) / 100;

    if (!update.$set) update.$set = {};
    update.$set.finalPrice = finalPrice;

    // Commission auto calculate (same as Product)
    if (finalPrice >= 10000) {
      update.$set.commissionRate = 4;
    } else {
      update.$set.commissionRate = 7;
    }

    this.setUpdate(update);
  }

  //  Stock Status Update
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

const Variant = mongoose.model("Variant", variantSchema);
export default Variant;
