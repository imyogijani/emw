import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: true,
  },
  quantity: { type: Number, required: true, default: 1 },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant" },
  price: { type: Number, required: true }, // for snapshotting
  finalPrice: { type: Number },
  title: { type: String }, // optional
  image: { type: String }, // optional
  discount: { type: Number }, // optional
  color: String, // optional
  size: String, // optional
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.model("cart", cartSchema);

export default Cart;
