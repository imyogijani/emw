import express from "express";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import { settleOrderPayout } from "../controllers/payoutController.js";
import Seller from "../models/sellerModel.js";
import PayoutLog from "../models/payoutLogModel.js";

// export const razorpayWebhook = express.Router();

// razorpayWebhook.post(
//   "/razorpay",
//   express.json(),
//   asyncHandler(async (req, res) => {
//     const sig = req.headers["x-razorpay-signature"];
//     const body = JSON.stringify(req.body);
//     const expected = crypto
//       .createHmac("sha256", process.env.RP_WEBHOOK_SECRET)
//       .update(body)
//       .digest("hex");

//     if (sig !== expected) return res.status(400).send("Invalid signature");

//     const event = req.body.event;
//     const payload = req.body.payload;

//     if (event === "payment.captured") {
//       const paymentEntity = payload.payment.entity;
//       const payment = await Payment.findOne({
//         providerOrderId: paymentEntity.order_id,
//       });
//       if (!payment) return res.status(404).send("Payment record not found");

//       payment.status = "success";
//       payment.providerPaymentId = paymentEntity.id;
//       payment.paidAt = new Date();
//       await payment.save();

//       const order = await Order.findById(payment.orderId).populate(
//         "items.productId"
//       );
//       order.paymentStatus = "paid";
//       order.isPaid = true;
//       order.orderStatus = "confirmed";
//       order.timeline.push({ status: "confirmed", time: new Date() });
//       await order.save();

//       await settleOrderPayout(
//         { params: { orderId: order._id } },
//         { status: () => ({ json: () => {} }) }
//       );
//     } else if (event === "payment.failed") {
//       const paymentEntity = payload.payment.entity;
//       const payment = await Payment.findOne({
//         providerOrderId: paymentEntity.order_id,
//       });
//       if (payment) {
//         payment.status = "failed";
//         payment.failureReason =
//           paymentEntity.error_description || "Payment failed";
//         await payment.save();
//       }
//     }

//     res.status(200).send("Webhook handled");
//   })
// );

export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", process.env.RP_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (sig !== expected) return res.status(400).send("Invalid signature");

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === "payment.captured") {
    const paymentEntity = payload.payment.entity;
    const payment = await Payment.findOne({
      providerOrderId: paymentEntity.order_id,
    });
    if (!payment) return res.status(404).send("Payment record not found");

    const orderId = payload.payment.order_id;
    const amount = payload.payment.amount;

    // Find your system's payment
    // const payment = await Payment.findOne({ providerOrderId: orderId });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const order = await Order.findById(payment.orderId).populate(
      "items.productId"
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Assume seller info from first item (or store per order)
    const seller = await Seller.findById(order.items[0].productId.sellerId);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Create Transfer to seller's Razorpay Sub-Account
    const capturedPayment = await razorpay.payments.fetch(paymentEntity.id);

    const transfers = [];

    for (const item of order.items) {
      const seller = await Seller.findById(item.productId.sellerId);
      if (!seller || !seller.razorpayAccountId) continue;

      const amount = Math.round(item.finalPrice * item.quantity * 100);

      transfers.push({
        account: seller.razorpayAccountId,
        amount: amount,
        currency: "INR",
        notes: {
          orderId: order._id.toString(),
          itemId: item._id.toString(),
        },
        on_hold: false,
      });
    }

    // Now make all transfers in 1 call
    const transferResponse = await razorpay.payments.transfer(
      paymentEntity.id,
      {
        transfers,
      }
    );

    console.log("Transfer success:", transferResponse);

    payment.status = "success";
    payment.providerPaymentId = paymentEntity.id;
    payment.paidAt = new Date();
    // payment.transferId = transferRes.data.id;
    await payment.save();

    // const order = await Order.findById(payment.orderId).populate(
    //   "items.productId"
    // );
    order.paymentStatus = "paid";
    order.isPaid = true;
    order.orderStatus = "confirmed";
    order.timeline.push({ status: "confirmed", time: new Date() });
    await order.save();

    // await settleOrderPayout(
    //   { params: { orderId: order._id } },
    //   { status: () => ({ json: () => {} }) }
    // );

    // Optional: Log transfer per item
    for (const [index, item] of order.items.entries()) {
      const seller = await Seller.findById(item.productId.sellerId);
      if (!seller) continue;

      await PayoutLog.create({
        orderId: order._id,
        sellerId: seller._id,
        itemId: item._id,
        amount: item.finalPrice * item.quantity,
        status: "success",
        razorpayTransferId: transferResponse.items[index]?.id,
        isSettled: true,
        settledAt: new Date(),
      });
    }
  } else if (event === "payment.failed") {
    const paymentEntity = payload.payment.entity;
    const payment = await Payment.findOne({
      providerOrderId: paymentEntity.order_id,
    });
    if (payment) {
      payment.status = "failed";
      payment.failureReason =
        paymentEntity.error_description || "Payment failed";
      await payment.save();
    }
  }

  res.status(200).send("Webhook handled");
});
