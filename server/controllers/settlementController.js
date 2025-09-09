// controllers/settlement.controller.js
import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import PayoutBatch from "../models/payoutBatchModel.js";
import mongoose from "mongoose";
import Seller from "../models/sellerModel.js";
import { sendPayoutToSeller } from "../services/razorpayPayOutService.js";

export const getMonthlySettlementReport = asyncHandler(async (req, res) => {
  const { month } = req.query; // "2025-07"
  if (!month)
    return res.status(400).json({ message: "Month is required (YYYY-MM)" });

  const [year, monthNum] = month.split("-");
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  const pipeline = [
    {
      $match: {
        orderStatus: "delivered",
        paymentStatus: "paid",
        deliveredAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$items" },
    { $match: { "items.isSettledToSeller": false } },
    {
      $group: {
        _id: "$items.sellerId",
        sellerId: { $first: "$items.sellerId" },
        grossSales: {
          $sum: { $multiply: ["$items.finalPrice", "$items.quantity"] },
        },
        commission: { $sum: "$items.commission" },
        itemIds: { $addToSet: "$items._id" },
        orderIds: { $addToSet: "$_id" },
        countItems: { $sum: 1 },
      },
    },
    {
      $project: {
        sellerId: 1,
        grossSales: 1,
        commission: 1,
        netPayout: { $subtract: ["$grossSales", "$commission"] },
        itemIds: 1,
        orderIds: 1,
        countItems: 1,
      },
    },
  ];

  const data = await Order.aggregate(pipeline);
  res.json({ month, sellers: data });
});


// Settlement API
export const settleMonthlyPayouts = asyncHandler(async (req, res) => {
  const { month } = req.body;
  if (!month)
    return res.status(400).json({ message: "Month is required (YYYY-MM)" });

  const [year, monthNum] = month.split("-");
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  // Step 1: Fetch unsettled items
  const rows = await Order.aggregate([
    {
      $match: {
        orderStatus: "delivered",
        paymentStatus: "paid",
        deliveredAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$items" },
    { $match: { "items.isSettledToSeller": false } },
    {
      $group: {
        _id: "$items.sellerId",
        sellerId: { $first: "$items.sellerId" },
        grossSales: {
          $sum: { $multiply: ["$items.finalPrice", "$items.quantity"] },
        },
        commission: { $sum: "$items.commission" },
        itemIds: { $addToSet: "$items._id" },
        orderIds: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        sellerId: 1,
        grossSales: 1,
        commission: 1,
        netPayout: { $subtract: ["$grossSales", "$commission"] },
        itemIds: 1,
        orderIds: 1,
      },
    },
  ]);

  if (!rows.length)
    return res.json({ success: true, message: "Nothing to settle." });

  const batches = [];
  const now = new Date();

  for (const r of rows) {
    const seller = await Seller.findById(r.sellerId);

    //  Agar seller ke paas Razorpay fund account nahi hai → skip
    if (!seller?.razorpayFundAccountId) {
      batches.push({
        sellerId: r.sellerId,
        status: "skipped_no_bank",
        note: "Seller has no Razorpay fund account. Will retry next month.",
      });
      continue; // ❌ Orders ko settle mat karo
    }

    //  Sirf verified seller ke liye settlement
    const batch = await PayoutBatch.create({
      month,
      sellerId: r.sellerId,
      grossSales: r.grossSales,
      commission: r.commission,
      netPayout: r.netPayout,
      orderItemIds: r.itemIds,
      orderIds: r.orderIds,
      status: "processing",
      settledAt: now,
    });

    try {
      const payout = await sendPayoutToSeller({
        fundAccountId: seller.razorpayFundAccountId,
        amount: r.netPayout,
        batchId: batch._id,
        month,
      });

      await PayoutTransaction.create({
        sellerId: r.sellerId,
        batchId: batch._id,
        orderItemIds: r.itemIds,
        grossSales: r.grossSales,
        commission: r.commission,
        netPayout: r.netPayout,
        status: payout.status, // "processing"/"queued"
        providerPayoutId: payout.id, // Razorpay payout id
        providerResponse: payout, // full response for logs
        settledAt: new Date(),
      });

      // Abhi orders ko settled mark karo
      await Order.updateMany(
        { "items._id": { $in: r.itemIds } },
        {
          $set: {
            "items.$[it].isSettledToSeller": true,
            "items.$[it].settledAt": now,
          },
        },
        { arrayFilters: [{ "it._id": { $in: r.itemIds } }] }
      );

      batch.razorpayPayoutId = payout.id;
      batch.status = payout.status; // processing/queued/completed
      await batch.save();
    } catch (err) {
      await PayoutTransaction.create({
        sellerId: r.sellerId,
        batchId: batch._id,
        orderItemIds: r.itemIds,
        grossSales: r.grossSales,
        commission: r.commission,
        netPayout: r.netPayout,
        status: "failed",
        providerResponse: err.message,
      });
      batch.status = "failed";
      await batch.save();
    }

    batches.push(batch);
  }

  res.json({
    success: true,
    message: `Monthly settlement done.`,
    batches,
  });
});

// seller :

export const getSellerMonthlyPayouts = asyncHandler(async (req, res) => {
  const sellerId = req.params.sellerId; // protect this with admin or seller auth
  const { month } = req.query; // optional, show last 6 months if not provided

  const match = { sellerId };
  if (month) match.month = month;

  const batches = await PayoutBatch.find(match)
    .sort({ month: -1 })
    .select("month grossSales commission netPayout status settledAt orderIds")
    .lean();

  const totals = batches.reduce(
    (acc, b) => {
      acc.grossSales += b.grossSales;
      acc.commission += b.commission;
      acc.netPayout += b.netPayout;
      return acc;
    },
    { grossSales: 0, commission: 0, netPayout: 0 }
  );

  res.json({ sellerId, month: month || null, totals, batches });
});
