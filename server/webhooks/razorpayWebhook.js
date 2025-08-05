import express from "express";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import { settleOrderPayout } from "../controllers/payoutController.js";

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

    payment.status = "success";
    payment.providerPaymentId = paymentEntity.id;
    payment.paidAt = new Date();
    await payment.save();

    const order = await Order.findById(payment.orderId).populate(
      "items.productId"
    );
    order.paymentStatus = "paid";
    order.isPaid = true;
    order.orderStatus = "confirmed";
    order.timeline.push({ status: "confirmed", time: new Date() });
    await order.save();

    await settleOrderPayout(
      { params: { orderId: order._id } },
      { status: () => ({ json: () => {} }) }
    );
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
