import asyncHandler from "express-async-handler";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import Seller from "../models/sellerModel.js";
import { createCashfreeOrder, verifyWebhook } from "../utils/cashfreeAPI.js";
import { settleOrderPayout } from "./payoutController.js"; // Import the payout function
import Subscription from "../models/sellerModel.js";
import { assignSubscriptionToUser } from "../utils/subscriptionHelper.js";

export const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId, method } = req.body;
  const order = await Order.findById(orderId).populate("items.productId");
  console.log("User:", req.userId); //  Add this

  if (!order) return res.status(404).json({ message: "Order not found" });

  if (method === "COD") {
    // just create record and exit
    const payment = await Payment.create({
      userId: req.userId,
      orderId: order._id,
      amount: order.totalAmount,
      method: "COD",
      gateway: "COD",
      status: "pending",
    });

    order.paymentMethod = "COD";
    order.paymentStatus = "pending";
    order.isPaid = false;
    order.timeline.push({ status: "processing" });
    order.paymentId = payment._id;
    await order.save();
    return res.json({ cod: true, message: "COD order initiated" });
  }

  //  Calculate seller splits
  const sellerSplitMap = {}; // { sellerId: totalAmount }

  for (const item of order.items) {
    const sellerId = item.productId.seller.toString();
    const price = item.totalPrice || item.finalPrice * item.quantity;

    sellerSplitMap[sellerId] = (sellerSplitMap[sellerId] || 0) + price;
    console.log("Seller Id ", sellerId);
  }

  const splits = await Promise.all(
    Object.entries(sellerSplitMap).map(async ([sellerId, amt]) => {
      const seller = await Seller.findById(sellerId);
      if (!seller || !seller.cashfreeBeneId)
        throw new Error("Seller not onboarded");
      return {
        vendor_id: seller.cashfreeBeneId,
        amount: amt.toFixed(2),
      };
    })
  );
  console.log("Splits:", splits);
  console.log(
    "user email and phone",
    req.user.email,
    req.user.phone,
    req.user._id
  );
  //  Create Cashfree Order with splits
  const cfOrder = await createCashfreeOrder({
    orderId: order._id.toString(),
    amount: order.totalAmount,
    currency: "INR",
    customer: {
      customer_id: req.user._id.toString(),
      customer_email: req.user.email,
      customer_phone: req.user.phone,
    },
    splits,
  });

  //  Save Payment
  const payment = await Payment.create({
    userId: req.user._id,
    orderId: order._id,
    amount: order.totalAmount,
    method,
    gateway: "Cashfree",
    // purpose:"order",
    providerOrderId: cfOrder.order_id,
  });

  res.json({
    paymentSessionId: cfOrder.payment_session_id,
    amount: order.totalAmount,
  });
});

export const paymentWebhook = asyncHandler(async (req, res) => {
  const valid = verifyWebhook(req.headers, req.body);
  if (!valid) return res.status(400).send("Invalid signature");

  const { order_id, order_status, order_amount, payment_id } = req.body;
  const payment = await Payment.findOne({ providerOrderId: order_id });

  if (!payment) return res.status(404).send("Payment not found");

  if (order_status === "PAID") {
    payment.status = "success";
    payment.providerPaymentId = payment_id;
    payment.paidAt = new Date();
    await payment.save();

    const order = await Order.findById(payment.orderId);
    order.paymentStatus = "paid";
    order.isPaid = true;
    order.orderStatus = "confirmed";
    // order.orderStatus = "confirmed";
    order.timeline.push({ status: "confirmed", time: new Date() });
    // await order.save();
    await order.save();

    //  Trigger async seller payout

    await settleOrderPayout(
      { params: { orderId: order._id } },
      { status: () => ({ json: () => {} }) }
    );
  } else {
    payment.status = "failed";
    await payment.save();
  }

  res.status(200).send("Webhook handled");
});

export const initiateSubscriptionPayment = asyncHandler(async (req, res) => {
  const { planId, billingCycle } = req.body;
  const user = req.user;

  const subscription = await Subscription.findById(planId);
  if (!subscription) {
    return res.status(404).json({ message: "Plan not found" });
  }

  const amount =
    billingCycle === "monthly"
      ? parseFloat(subscription.pricing.monthly)
      : parseFloat(subscription.pricing.yearly);

  const orderId = `sub_${Date.now()}`;

  const order = await createCashfreeOrder({
    orderId,
    amount,
    currency: "INR",
    customer: {
      customer_id: user._id.toString(),
      customer_email: user.email,
      customer_phone: user.phone,
    },
  });

  await Payment.create({
    userId: user._id,
    planId,
    billingCycle,
    purpose: "subscription",
    amount,
    currency: "INR",
    method: "Online",
    gateway: "Cashfree",
    providerOrderId: order.order_id,
    status: "pending",
  });

  res.json({
    success: true,
    paymentSessionId: order.payment_session_id,
    orderId: order.order_id,
    amount,
  });
});

export const subscriptionWebhook = asyncHandler(async (req, res) => {
  const valid = verifyWebhook(req.headers, req.body);
  if (!valid) return res.status(400).send("Invalid signature");

  const { order_id, order_status, payment_id } = req.body;

  const payment = await Payment.findOne({ providerOrderId: order_id });
  if (!payment) return res.status(404).send("Payment not found");

  if (order_status === "PAID") {
    payment.status = "success";
    payment.providerPaymentId = payment_id;
    payment.paidAt = new Date();
    await payment.save();

    // Assign subscription to user after payment
    await assignSubscriptionToUser(
      payment.userId,
      payment.planId,
      payment.billingCycle,
      "paid"
    );
  } else {
    payment.status = "failed";
    await payment.save();
  }

  res.status(200).send("OK");
});

// After deliveried boy conform status COD recive after settel payment seller by admin or delievry partener any webhook use to automatic
// PATCH /api/payment/mark-cod-paid/:orderId
export const markCodAsPaid = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order || order.paymentMethod !== "COD")
    return res.status(400).json({ message: "Invalid COD order" });

  const payment = await Payment.findOne({ orderId: order._id });
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  //  Update status
  payment.status = "success";
  payment.paidAt = new Date();
  await payment.save();

  order.paymentStatus = "paid";
  order.isPaid = true;
  order.orderStatus = "confirmed";
  order.timeline.push({ status: "confirmed", time: new Date() });
  await order.save();

  //  Trigger payout now
  await settleOrderPayout(
    { params: { orderId: order._id } },
    { status: () => ({ json: () => {} }) }
  );

  res.json({ success: true, message: "COD marked as paid and payout done" });
});
