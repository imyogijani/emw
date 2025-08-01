import asyncHandler from "express-async-handler";
import axios from "axios";
import Seller from "../models/sellerModel.js";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";
import PayoutLog from "../models/payoutLogModel.js";

export const settleOrderPayout = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId).populate("items.productId");
  if (!order) return res.status(404).json({ message: "Order not found" });

  const payment = await Payment.findOne({ orderId });
  if (!payment || payment.status !== "success")
    return res.status(400).json({ message: "Payment not successful" });

  const results = [];

  for (const item of order.items) {
    const seller = await Seller.findById(item.sellerId);
    if (!seller || !seller.cashfreeBeneId) {
      results.push({
        item: item._id,
        status: "FAILED",
        reason: "No cashfreeBeneId",
      });

      await PayoutLog.create({
        orderId: order._id,
        sellerId: item.sellerId,
        itemId: item._id,
        amount: item.finalPrice * item.quantity,
        status: "failed",
        reason: "No cashfreeBeneId",
        payoutAt: new Date(),
        paymentMethod: payment.method, //  required
        isSettled: false,
        settledAt: null,
      });

      continue;
    }

    const netAmount = item.finalPrice * item.quantity; // No commission yet
    const transferId = `${order._id}_${item._id}`;

    try {
      const payoutRes = await axios.post(
        "https://payout-api.cashfree.com/payout/v1.2/requestTransfer",
        {
          beneId: seller.cashfreeBeneId,
          amount: netAmount,
          transferId,
          remarks: `Payout for Order ${order._id}`,
        },
        {
          headers: {
            "X-Client-Id": process.env.CASHFREE_CLIENT_ID,
            "X-Client-Secret": process.env.CASHFREE_CLIENT_SECRET,
            "Content-Type": "application/json",
          },
        }
      );

      results.push({
        item: item._id,
        status: "SUCCESS",
        cf_response: payoutRes.data,
      });
      await PayoutLog.create({
        orderId: order._id,
        sellerId: item.sellerId,
        itemId: item._id,
        amount: netAmount,
        commission: item.commission || 0,
        status: "success",
        cashfreeReferenceId: payoutRes.data.data?.referenceId || "",
        payoutAt: new Date(),
        paymentMethod: payment.method, //  "online" or "cod"
        isSettled: true,
        settledAt: new Date(),
      });
    } catch (err) {
      results.push({ item: item._id, status: "FAILED", reason: err.message });

      await PayoutLog.create({
        orderId: order._id,
        sellerId: item.sellerId,
        itemId: item._id,
        amount: netAmount,
        commission: item.commission || 0,
        status: "failed",
        reason: err.message,
        payoutAt: new Date(),
        paymentMethod: payment.method, //  required
        isSettled: false,
      });
    }
  }

  res.status(200).json({ message: "Payouts attempted", results });
});
