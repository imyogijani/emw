import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true }, // for snapshotting
  title: { type: String }, // optional
  image: { type: String }, // optional
  discount: { type: Number }, // optional
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.model("cart", cartSchema);

export default Cart;