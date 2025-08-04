import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true }, // e.g., INV-2025-0001-A
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orders",
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      productName: String, // snapshot of name at time of order
      quantity: Number,
      price: Number,
      discount: Number,
      finalPrice: Number,
    },
  ],

  subTotal: Number, // sum of finalPrice * qty
  deliveryCharge: Number, // from order.items[].deliveryCharge
  totalAmount: Number, // subTotal + deliveryCharge
  paymentMethod: {
    type: String,
    enum: ["COD", "UPI", "QR", "Card", "Wallet", "NetBanking"],
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
  },
  deliveryStatus: {
    type: String,
    enum: ["processing", "shipped", "delivered", "cancelled"],
  },

  filePath: String, // PDF URL/path
  createdAt: { type: Date, default: Date.now },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
