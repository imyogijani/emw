import Waybill from "../models/wayBillModel.js";
import Seller from "../models/sellerModel.js";
import Order from "../models/orderModel.js";

// GET waybill by seller & order
export const getWaybill = async (req, res) => {
  try {
    const { sellerId, orderId } = req.query;

    const waybill = await Waybill.findOne({ sellerId, orderId });

    if (waybill) {
      return res.json({ success: true, waybill: waybill.waybill });
    } else {
      return res.json({ success: false, message: "Waybill not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST: create new waybill
export const createWaybill = async (req, res) => {
  try {
    const { sellerId, orderId, waybill } = req.body;

    // 1️⃣ Check if seller and order exist
    const seller = await Seller.findById(sellerId);
    const order = await Order.findById(orderId);

    if (!seller || !order) {
      return res
        .status(400)
        .json({ success: false, message: "Seller or Order not found" });
    }

    // 2️⃣ Check if waybill already exists
    let existing = await Waybill.findOne({ sellerId, orderId });
    if (existing) {
      return res.json({ success: true, waybill: existing.waybill });
    }

    //  Save waybill in DB
    const cleanWaybill = waybill.replace(/"/g, "").trim();
    const waybillDoc = new Waybill({
      sellerId,
      orderId,
      waybill: cleanWaybill,
    });
    await waybillDoc.save();

    res.json({ success: true, waybill: waybill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
