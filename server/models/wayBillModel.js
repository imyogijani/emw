import mongoose from "mongoose";

const waybillSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orders",
    required: true,
  },
  waybill: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// module.exports = mongoose.model("Waybill", WaybillSchema);

const Waybill = mongoose.model("Waybill", waybillSchema);
export default Waybill;
