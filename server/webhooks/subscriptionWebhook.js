import express from "express";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import { settleOrderPayout } from "../controllers/payoutController.js";
import { assignSubscriptionToUser } from "../utils/subscriptionHelper.js";

export const subscriptionWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RP_WEBHOOK_SECRET;

  const crypto = await import("crypto");
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;

  if (event === "subscription.charged") {
    const {
      payload: {
        payment: { entity: paymentEntity },
        subscription: { entity: subEntity },
      },
    } = req.body;

    const razorpaySubId = subEntity.id;

    const payment = await Payment.findOne({
      providerOrderId: razorpaySubId,
    });

    if (!payment) return res.status(404).send("Payment not found");

    payment.status = "success";
    payment.providerPaymentId = paymentEntity.id;
    payment.paidAt = new Date();
    await payment.save();

    await assignSubscriptionToUser(
      payment.userId,
      payment.planId,
      payment.billingCycle,
      "paid"
    );
  } else if (event === "payment.failed") {
    const { subscription_id } = req.body.payload.payment.entity;

    const payment = await Payment.findOne({
      providerOrderId: subscription_id,
    });

    if (payment) {
      payment.status = "failed";
      await payment.save();
    }
  }

  res.status(200).send("Webhook handled");
});

// This is  use one time not use razorpay subscription

// export const paymentWebhook = asyncHandler(async (req, res) => {
//   const secret = process.env.RP_WEBHOOK_SECRET;
//   const signature = req.headers["x-razorpay-signature"];
//   const body = JSON.stringify(req.body);

//   const expectedSignature = crypto
//     .createHmac("sha256", secret)
//     .update(body)
//     .digest("hex");

//   if (signature !== expectedSignature) {
//     return res.status(400).send("Invalid signature");
//   }

//   const event = req.body.event;

//   if (event === "payment.captured") {
//     const paymentEntity = req.body.payload.payment.entity;

//     const payment = await Payment.findOne({
//       providerOrderId: paymentEntity.order_id,
//     });

//     if (!payment) return res.status(404).send("Payment not found");

//     payment.status = "success";
//     payment.providerPaymentId = paymentEntity.id;
//     payment.paidAt = new Date();
//     await payment.save();

//     await assignSubscriptionToUser(
//       payment.userId,
//       payment.planId,
//       payment.billingCycle,
//       "paid"
//     );
//   } else if (event === "payment.failed") {
//     const paymentEntity = req.body.payload.payment.entity;

//     const payment = await Payment.findOne({
//       providerOrderId: paymentEntity.order_id,
//     });

//     if (payment) {
//       payment.status = "failed";
//       await payment.save();
//     }
//   }

//   res.status(200).send("Webhook handled");
// });

export const subscriptionPaymentWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RP_WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== expectedSignature)
    return res.status(400).send("Invalid signature");

  const event = req.body.event;
  const paymentEntity = req.body.payload?.payment?.entity || {};

  if (event === "payment.captured") {
    const payment = await Payment.findOne({
      providerOrderId: paymentEntity.order_id || paymentEntity.subscription_id,
    });
    if (!payment) return res.status(404).send("Payment not found");

    payment.status = "success";
    payment.providerPaymentId = paymentEntity.id;
    payment.paidAt = new Date();
    await payment.save();

    const isAutopay = payment.method === "autopay";
    await assignSubscriptionToUser(
      payment.userId,
      payment.planId,
      payment.billingCycle,
      isAutopay,
      payment.providerOrderId
    );
  } else if (event === "payment.failed") {
    const payment = await Payment.findOne({
      providerOrderId: paymentEntity.order_id,
    });
    if (payment) {
      payment.status = "failed";
      await payment.save();
    }
  }

  res.status(200).send("Webhook handled");
});
