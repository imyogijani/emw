import asyncHandler from "express-async-handler";
import axios from "axios";
import Seller from "../models/sellerModel.js";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";
import PayoutLog from "../models/payoutLogModel.js";
import razorpay from "../utils/razorpayClient.js";

// export const settleOrderPayout = asyncHandler(async (req, res) => {
//   const { orderId } = req.params;

//   const order = await Order.findById(orderId).populate("items.productId");
//   if (!order) return res.status(404).json({ message: "Order not found" });

//   const payment = await Payment.findOne({ orderId });
//   if (!payment || payment.status !== "success")
//     return res.status(400).json({ message: "Payment not successful" });

//   const results = [];

//   for (const item of order.items) {
//     const seller = await Seller.findById(item.sellerId);
//     if (!seller || !seller.cashfreeBeneId) {
//       results.push({
//         item: item._id,
//         status: "FAILED",
//         reason: "No cashfreeBeneId",
//       });

//       await PayoutLog.create({
//         orderId: order._id,
//         sellerId: item.sellerId,
//         itemId: item._id,
//         amount: item.finalPrice * item.quantity,
//         status: "failed",
//         reason: "No cashfreeBeneId",
//         payoutAt: new Date(),
//         paymentMethod: payment.method, //  required
//         isSettled: false,
//         settledAt: null,
//       });

//       continue;
//     }

//     const netAmount = item.finalPrice * item.quantity; // No commission yet
//     const transferId = `${order._id}_${item._id}`;

//     try {
//       const payoutRes = await axios.post(
//         "https://payout-api.cashfree.com/payout/v1.2/requestTransfer",
//         {
//           beneId: seller.cashfreeBeneId,
//           amount: netAmount,
//           transferId,
//           remarks: `Payout for Order ${order._id}`,
//         },
//         {
//           headers: {
//             "X-Client-Id": process.env.CASHFREE_CLIENT_ID,
//             "X-Client-Secret": process.env.CASHFREE_CLIENT_SECRET,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       results.push({
//         item: item._id,
//         status: "SUCCESS",
//         cf_response: payoutRes.data,
//       });
//       await PayoutLog.create({
//         orderId: order._id,
//         sellerId: item.sellerId,
//         itemId: item._id,
//         amount: netAmount,
//         commission: item.commission || 0,
//         status: "success",
//         cashfreeReferenceId: payoutRes.data.data?.referenceId || "",
//         payoutAt: new Date(),
//         paymentMethod: payment.method, //  "online" or "cod"
//         isSettled: true,
//         settledAt: new Date(),
//       });
//     } catch (err) {
//       results.push({ item: item._id, status: "FAILED", reason: err.message });

//       await PayoutLog.create({
//         orderId: order._id,
//         sellerId: item.sellerId,
//         itemId: item._id,
//         amount: netAmount,
//         commission: item.commission || 0,
//         status: "failed",
//         reason: err.message,
//         payoutAt: new Date(),
//         paymentMethod: payment.method, //  required
//         isSettled: false,
//       });
//     }
//   }

//   res.status(200).json({ message: "Payouts attempted", results });
// });

// razorPay

export const settleOrderPayout = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId).populate("items.productId");
  if (!order) return res.status(404).json({ message: "Order not found" });

  const payment = await Payment.findOne({ orderId });
  if (!payment || payment.status !== "success")
    return res.status(400).json({ message: "Payment not successful" });

  const capturedPayment = await razorpay.payments.fetch(
    payment.providerPaymentId
  );

  const results = [];

  for (const item of order.items) {
    const seller = await Seller.findById(item.productId.seller);
    if (!seller?.razorpayFundAccountId) {
      results.push({
        itemId: item._id,
        status: "FAILED",
        reason: "Seller not onboarded",
      });
      await PayoutLog.create({
        orderId: order._id,
        sellerId: seller?.id,
        itemId: item._id,
        amount: item.finalPrice * item.quantity,
        status: "failed",
        reason: "Seller not onboarded",
        paymentMethod: payment.method,
        isSettled: false,
      });
      continue;
    }

    const transferAmount = Math.round(item.finalPrice * item.quantity * 100);

    try {
      const transferResponse = await razorpay.payments.transfer(
        payment.providerPaymentId,
        {
          transfers: [
            {
              account: seller.razorpayFundAccountId,
              amount: transferAmount,
              currency: "INR",
              notes: {
                orderId: order._id.toString(),
                itemId: item._id.toString(),
              },
            },
          ],
        }
      );

      results.push({
        itemId: item._id,
        status: "SUCCESS",
        response: transferResponse,
      });
      await PayoutLog.create({
        orderId: order._id,
        sellerId: seller._id,
        itemId: item._id,
        amount: item.finalPrice * item.quantity,
        commission: item.commission || 0,
        status: "success",
        cashfreeReferenceId: transferResponse.items[0].transfer_id,
        paymentMethod: payment.method,
        isSettled: true,
        settledAt: new Date(),
      });
    } catch (err) {
      results.push({ itemId: item._id, status: "FAILED", reason: err.message });
      await PayoutLog.create({
        orderId: order._id,
        sellerId: seller._id,
        itemId: item._id,
        amount: item.finalPrice * item.quantity,
        commission: item.commission || 0,
        status: "failed",
        reason: err.message,
        paymentMethod: payment.method,
        isSettled: false,
      });
    }
  }

  if (res)
    return res.status(200).json({ message: "Payouts attempted", results });
});


//  RazorpayX Payout Setup with Auto Seller Payouts

// import asyncHandler from "express-async-handler";
// import axios from "axios";
// import Seller from "../models/sellerModel.js";
// import Order from "../models/orderModel.js";
// import Payment from "../models/paymentModel.js";
// import PayoutLog from "../models/payoutLogModel.js";

// const RAZORPAYX_API = "https://api.razorpay.com/v1";
// const authHeader = {
//   auth: {
//     username: process.env.RAZORPAYX_KEY_ID,
//     password: process.env.RAZORPAYX_KEY_SECRET,
//   },
// };

// export const settleOrderPayout = asyncHandler(async (req, res) => {
//   const { orderId } = req.params;
//   const order = await Order.findById(orderId).populate("items.productId");
//   if (!order) return res.status(404).json({ message: "Order not found" });

//   const payment = await Payment.findOne({ orderId });
//   if (!payment || payment.status !== "success")
//     return res.status(400).json({ message: "Payment not successful" });

//   const results = [];

//   for (const item of order.items) {
//     const seller = await Seller.findById(item.productId.seller);
//     if (!seller?.razorpayFundAccountId) {
//       results.push({
//         itemId: item._id,
//         status: "FAILED",
//         reason: "Seller not onboarded",
//       });
//       await PayoutLog.create({
//         orderId: order._id,
//         sellerId: seller?.id,
//         itemId: item._id,
//         amount: item.finalPrice * item.quantity,
//         status: "failed",
//         reason: "Seller not onboarded",
//         paymentMethod: payment.method,
//         isSettled: false,
//       });
//       continue;
//     }

//     const payoutAmount = Math.round(item.finalPrice * item.quantity * 100);

//     try {
//       const payoutRes = await axios.post(
//         `${RAZORPAYX_API}/payouts`,
//         {
//           account_number: process.env.RAZORPAYX_ACCOUNT_NO, // RazorpayX virtual account number
//           fund_account_id: seller.razorpayFundAccountId,
//           amount: payoutAmount,
//           currency: "INR",
//           mode: "IMPS",
//           purpose: "payout",
//           queue_if_low_balance: true,
//           reference_id: `${order._id}-${item._id}`,
//           narration: `Payout for order ${order._id}`,
//           notes: {
//             orderId: order._id.toString(),
//             itemId: item._id.toString(),
//           },
//         },
//         authHeader
//       );

//       results.push({
//         itemId: item._id,
//         status: "SUCCESS",
//         response: payoutRes.data,
//       });

//       await PayoutLog.create({
//         orderId: order._id,
//         sellerId: seller._id,
//         itemId: item._id,
//         amount: item.finalPrice * item.quantity,
//         commission: item.commission || 0,
//         status: "success",
//         cashfreeReferenceId: payoutRes.data.id,
//         paymentMethod: payment.method,
//         isSettled: true,
//         settledAt: new Date(),
//       });
//     } catch (err) {
//       results.push({ itemId: item._id, status: "FAILED", reason: err.message });
//       await PayoutLog.create({
//         orderId: order._id,
//         sellerId: seller._id,
//         itemId: item._id,
//         amount: item.finalPrice * item.quantity,
//         commission: item.commission || 0,
//         status: "failed",
//         reason: err.message,
//         paymentMethod: payment.method,
//         isSettled: false,
//       });
//     }
//   }

//   res.status(200).json({ message: "RazorpayX payouts attempted", results });
// });
