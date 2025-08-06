import asyncHandler from "express-async-handler";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import Seller from "../models/sellerModel.js";
import { settleOrderPayout } from "./payoutController.js"; // Import the payout function
import Subscription from "../models/subscriptionModel.js";
import { assignSubscriptionToUser } from "../utils/subscriptionHelper.js";
import razorpay from "../utils/razorpayClient.js";
import crypto from "crypto";

// export const initiatePayment = asyncHandler(async (req, res) => {
//   const { orderId, method } = req.body;
//   const order = await Order.findById(orderId).populate("items.productId");
//   console.log("User:", req.userId); //  Add this

//   if (!order) return res.status(404).json({ message: "Order not found" });

//   if (method === "COD") {
//     // just create record and exit
//     const payment = await Payment.create({
//       userId: req.userId,
//       orderId: order._id,
//       amount: order.totalAmount,
//       method: "COD",
//       gateway: "COD",
//       status: "pending",
//     });

//     order.paymentMethod = "COD";
//     order.paymentStatus = "pending";
//     order.isPaid = false;
//     order.timeline.push({ status: "processing" });
//     order.paymentId = payment._id;
//     await order.save();
//     return res.json({ cod: true, message: "COD order initiated" });
//   }

//   //  Calculate seller splits
//   const sellerSplitMap = {}; // { sellerId: totalAmount }

//   for (const item of order.items) {
//     const sellerId = item.productId.seller.toString();
//     // const price = item.totalPrice || item.finalPrice * item.quantity;
//     const price = item.finalPrice * item.quantity;

//     sellerSplitMap[sellerId] = (sellerSplitMap[sellerId] || 0) + price;
//     console.log("Seller Id ", sellerId);
//   }

//   const splits = await Promise.all(
//     Object.entries(sellerSplitMap).map(async ([sellerId, amt]) => {
//       const seller = await Seller.findById(sellerId);
//       if (!seller || !seller.cashfreeBeneId)
//         throw new Error("Seller not onboarded");
//       return {
//         vendor_id: seller.cashfreeBeneId,
//         amount: amt.toFixed(2),
//       };
//     })
//   );
//   console.log("Splits:", splits);
//   console.log(
//     "user email and phone",
//     req.user.email,
//     req.user.phone,
//     req.user._id
//   );
//   //  Create Cashfree Order with splits
//   const cfOrder = await createCashfreeOrder({
//     orderId: order._id.toString(),
//     amount: order.totalAmount,
//     currency: "INR",
//     customer: {
//       customer_id: req.user._id.toString(),
//       customer_email: req.user.email,
//       customer_phone: req.user.phone,
//     },
//     splits,
//   });

//   //  Save Payment
//   const payment = await Payment.create({
//     userId: req.user._id,
//     orderId: order._id,
//     amount: order.totalAmount,
//     method,
//     gateway: "Cashfree",
//     // purpose:"order",
//     providerOrderId: cfOrder.order_id,
//   });

//   res.json({
//     paymentSessionId: cfOrder.payment_session_id,
//     amount: order.totalAmount,
//   });
// });

// export const paymentWebhook = asyncHandler(async (req, res) => {
//   const valid = verifyWebhook(req.headers, req.body);
//   if (!valid) return res.status(400).send("Invalid signature");

//   const { order_id, order_status, order_amount, payment_id } = req.body;
//   const payment = await Payment.findOne({ providerOrderId: order_id });

//   if (!payment) return res.status(404).send("Payment not found");

//   if (order_status === "PAID") {
//     payment.status = "success";
//     payment.providerPaymentId = payment_id;
//     payment.paidAt = new Date();
//     await payment.save();

//     const order = await Order.findById(payment.orderId);
//     order.paymentStatus = "paid";
//     order.isPaid = true;
//     order.orderStatus = "confirmed";
//     // order.orderStatus = "confirmed";
//     order.timeline.push({ status: "confirmed", time: new Date() });
//     // await order.save();
//     await order.save();

//     //  Trigger async seller payout

//     await settleOrderPayout(
//       { params: { orderId: order._id } },
//       { status: () => ({ json: () => {} }) }
//     );
//   } else {
//     payment.status = "failed";
//     await payment.save();
//   }

//   res.status(200).send("Webhook handled");
// });

// export const initiateSubscriptionPayment = asyncHandler(async (req, res) => {
//   const { planId, billingCycle } = req.body;
//   const user = req.user;

//   const subscription = await Subscription.findById(planId);
//   if (!subscription) {
//     return res.status(404).json({ message: "Plan not found" });
//   }

//   const amount =
//     billingCycle === "monthly"
//       ? parseFloat(subscription.pricing.monthly)
//       : parseFloat(subscription.pricing.yearly);

//   const orderId = `sub_${Date.now()}`;

//   const order = await createCashfreeOrder({
//     orderId,
//     amount,
//     currency: "INR",
//     customer: {
//       customer_id: user._id.toString(),
//       customer_email: user.email,
//       customer_phone: user.phone,
//     },
//   });

//   await Payment.create({
//     userId: user._id,
//     planId,
//     billingCycle,
//     purpose: "subscription",
//     amount,
//     currency: "INR",
//     method: "Online",
//     gateway: "Cashfree",
//     providerOrderId: order.order_id,
//     status: "pending",
//   });

//   res.json({
//     success: true,
//     paymentSessionId: order.payment_session_id,
//     orderId: order.order_id,
//     amount,
//   });
// });

// export const subscriptionWebhook = asyncHandler(async (req, res) => {
//   const valid = verifyWebhook(req.headers, req.body);
//   if (!valid) return res.status(400).send("Invalid signature");

//   const { order_id, order_status, payment_id } = req.body;

//   const payment = await Payment.findOne({ providerOrderId: order_id });
//   if (!payment) return res.status(404).send("Payment not found");

//   if (order_status === "PAID") {
//     payment.status = "success";
//     payment.providerPaymentId = payment_id;
//     payment.paidAt = new Date();
//     await payment.save();

//     // Assign subscription to user after payment
//     await assignSubscriptionToUser(
//       payment.userId,
//       payment.planId,
//       payment.billingCycle,
//       "paid"
//     );
//   } else {
//     payment.status = "failed";
//     await payment.save();
//   }

//   res.status(200).send("OK");
// });

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

// RazorPay

// Create Razorpay contact and fund account

export const initiatePayment = asyncHandler(async (req, res) => {
  try {
    const { orderId, method } = req.body;
    console.log(
      "Initiating payment for orderId:",
      orderId,
      "with method:",
      method
    );

    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) {
      console.error("Order not found:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if payment already exists
    // const existingPayment = await Payment.findOne({ orderId: order._id });

    // if (existingPayment) {
    //   if (existingPayment.status === "success") {
    //     return res.status(400).json({ message: "Payment already completed." });
    //   } else if (existingPayment.status === "pending") {
    //     return res.status(400).json({ message: "Payment already in process." });
    //   }
    //   // If failed, allow to continue
    // }

    // If COD payment
    if (method === "COD") {
      console.log("Processing COD payment for user:", req.user._id);

      const payment = await Payment.create({
        userId: req.user._id,
        orderId: order._id,
        amount: order.totalAmount,
        method: "COD",
        gateway: "COD",
        status: "pending",
      });

      order.paymentMethod = "COD";
      order.paymentStatus = "pending";
      order.isPaid = false;
      order.timeline.push({ status: "processing", time: new Date() });
      order.paymentId = payment._id;
      await order.save();

      console.log("COD order created with paymentId:", payment._id);
      return res.json({ cod: true, message: "COD order initiated" });
    }

    // For Razorpay or online payments
    const amountPaise = Math.round(order.totalAmount * 100);
    console.log("Creating Razorpay order. Amount in paise:", amountPaise);

    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: orderId.toString(),
      payment_capture: 1,
    });

    console.log("Razorpay order created:", rpOrder);

    const userId = req.user?._id || req.userId; // fallback for userId if not directly available
    console.log("Using userId for payment:", userId);

    const payment = await Payment.create({
      userId: userId,
      orderId: order._id,
      amount: order.totalAmount,
      method,
      gateway: "Razorpay",
      providerOrderId: rpOrder.id,
      status: "pending",
    });

    console.log("Online payment record created with paymentId:", payment._id);

    res.json({
      orderId: rpOrder.id,
      amount: order.totalAmount,
      key: process.env.RP_KEY_ID, // Needed on frontend
    });
  } catch (error) {
    console.error("Error in initiatePayment:", error.message, error.stack);
    console.error(error.stack);
    res
      .status(500)
      .json({ message: "Failed to initiate payment", error: error.message });
  }
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RP_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  res.json({ success: true, message: "Payment verified successfully" });
});

// export const initiateSubscriptionPayment = asyncHandler(async (req, res) => {
//   try {
//     const { planId, billingCycle } = req.body;
//     const user = req.user;

//     console.log("👉 Request body:", req.body);
//     console.log("👉 Authenticated user:", user);

//     // Fetch subscription plan
//     const subscriptionPlan = await Subscription.findById(planId);
//     if (!subscriptionPlan) {
//       console.error("❌ Plan not found:", planId);
//       return res.status(404).json({ message: "Plan not found" });
//     }

//     // Razorpay Plan ID selection
//     const razorpayPlanId =
//       billingCycle === "monthly"
//         ? subscriptionPlan.razorpayMonthlyPlanId
//         : subscriptionPlan.razorpayYearlyPlanId;

//     console.log("📌 Razorpay Plan ID selected:", razorpayPlanId);

//     // Create Razorpay customer
//     const customer = await razorpay.customers.create({
//       name: user.name,
//       email: user.email,
//       contact: user.phone,
//     });

//     console.log("✅ Razorpay customer created:", customer.id);

//     // Create Razorpay subscription
//     const razorpaySubscription = await razorpay.subscriptions.create({
//       plan_id: razorpayPlanId,
//       customer_notify: 1,
//       total_count: billingCycle === "monthly" ? 12 : 1, // Adjust as per billingCycle
//       customer_id: customer.id,
//       notes: {
//         userId: user._id.toString(),
//       },
//     });

//     console.log("✅ Razorpay subscription created:", razorpaySubscription.id);

//     // Save payment info to DB
//     const paymentData = {
//       userId: user._id,
//       planId,
//       billingCycle,
//       purpose: "subscription",
//       amount:
//         billingCycle === "monthly"
//           ? parseFloat(subscriptionPlan.pricing.monthly)
//           : parseFloat(subscriptionPlan.pricing.yearly),
//       currency: "INR",
//       method: "Online",
//       gateway: "Razorpay",
//       providerOrderId: razorpaySubscription.id,
//       status: "pending",
//     };

//     await Payment.create(paymentData);

//     console.log("✅ Payment entry saved in DB:", paymentData);

//     // Send response
//     res.json({
//       success: true,
//       subscriptionId: razorpaySubscription.id,
//       short_url: razorpaySubscription.short_url,
//       amount: paymentData.amount,
//     });
//   } catch (error) {
//     console.error("🔥 Error in initiateSubscriptionPayment:", error);
//     res
//       .status(500)
//       .json({ message: "Payment initiation failed", error: error.message });
//   }
// });

// export const initiateSubscriptionPayment = asyncHandler(async (req, res) => {
//   try {
//     const { planId, billingCycle } = req.body;
//     const user = req.user;

//     console.log("🔁 Plan ID:", planId);
//     console.log("🔁 Billing Cycle:", billingCycle);
//     console.log("🔁 User ID:", user?._id);

//     // 1. Find the Subscription Plan
//     const subscriptionPlan = await Subscription.findById(planId);
//     console.log("📦 Subscription Plan:", subscriptionPlan);

//     if (!subscriptionPlan) {
//       console.log("❌ Plan not found");
//       return res.status(404).json({ message: "Plan not found" });
//     }

//     // 2. Calculate Amount
//     const amount =
//       billingCycle === "monthly"
//         ? parseFloat(subscriptionPlan.pricing.monthly)
//         : parseFloat(subscriptionPlan.pricing.yearly);

//     console.log("💰 Final Amount:", amount);

//     // 3. Create Razorpay Order
//     const razorpayOrder = await razorpay.orders.create({
//       amount: amount * 100, // paise
//       currency: "INR",
//       receipt: `receipt_order_${Date.now()}`,
//       payment_capture: 1,
//       notes: {
//         userId: user._id.toString(),
//         planId,
//         billingCycle,
//       },
//     });

//     console.log("📄 Razorpay Order Created:", razorpayOrder);

//     // 4. Save in Payment DB
//     const savedPayment = await Payment.create({
//       userId: user._id,
//       planId,
//       billingCycle,
//       purpose: "subscription",
//       amount,
//       currency: "INR",
//       method: "Online",
//       gateway: "Razorpay",
//       providerOrderId: razorpayOrder.id,
//       status: "pending",
//     });

//     console.log("🗃️ Payment Entry Saved:", savedPayment);

//     // 5. Respond to Frontend
//     res.json({
//       success: true,
//       orderId: razorpayOrder.id,
//       amount,
//       currency: "INR",
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (error) {
//     console.error("❌ Error in initiateSubscriptionPayment:", error);
//     res
//       .status(500)
//       .json({ message: "Internal Server Error", error: error.message });
//   }
// });

export const initiateSubscriptionPayment = asyncHandler(async (req, res) => {
  const { planId, billingCycle, autopay } = req.body;
  const user = req.user;

  const subscriptionPlan = await Subscription.findById(planId);
  if (!subscriptionPlan)
    return res.status(404).json({ message: "Plan not found" });

  const amount =
    billingCycle === "monthly"
      ? parseFloat(subscriptionPlan.pricing.monthly)
      : parseFloat(subscriptionPlan.pricing.yearly);

  if (autopay) {
    const razorpayPlan = await razorpay.plans.create({
      period: billingCycle === "monthly" ? "monthly" : "yearly",
      interval: 1,
      item: {
        name: subscriptionPlan.planName,
        amount: amount * 100,
        currency: "INR",
      },
    });

    const razorpaySub = await razorpay.subscriptions.create({
      plan_id: razorpayPlan.id,
      customer_notify: 1,
      total_count: 12,
      notes: { userId: user._id.toString(), planId, billingCycle },
    });

    await Payment.create({
      userId: user._id,
      planId,
      billingCycle,
      amount,
      purpose: "subscription",
      method: "autopay",
      status: "pending",
      gateway: "Razorpay",
      providerOrderId: razorpaySub.id,
    });

    return res.json({
      success: true,
      autopay: true,
      subscriptionId: razorpaySub.id,
      short_url: razorpaySub.short_url,
    });
  } else {
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: { userId: user._id.toString(), planId, billingCycle },
    });

    await Payment.create({
      userId: user._id,
      planId,
      billingCycle,
      amount,
      purpose: "subscription",
      method: "manual",
      status: "pending",
      gateway: "Razorpay",
      providerOrderId: razorpayOrder.id,
    });

    res.json({
      success: true,
      autopay: false,
      orderId: razorpayOrder.id,
      amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  }
});

export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const userId = req.user._id;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  res.json({
    success: true,
    message: "Payment verified and subscription activated",
  });
});
