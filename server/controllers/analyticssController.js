import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Review from "../models/reviewModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Seller from "../models/sellerModel.js";
import UserSubscription from "../models/userSubscriptionModel.js";
import mongoose from "mongoose";

export const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = new mongoose.Types.ObjectId(req.user.sellerId);
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(now.getDate() - 28);

  const pipeline = [
    { $unwind: "$items" },
    { $match: { "items.sellerId": sellerId } },
    {
      $project: {
        userId: 1,
        createdAt: 1,
        orderStatus: 1,
        city: "$shippingAddress.city",
        productId: "$items.productId",
        quantity: "$items.quantity",
        price: "$items.finalPrice",
        amount: { $multiply: ["$items.quantity", "$items.finalPrice"] },
        week: { $isoWeek: "$createdAt" },
        year: { $year: "$createdAt" },
      },
    },
    {
      $facet: {
        deliveredItems: [
          { $match: { orderStatus: "delivered" } },
          {
            $group: {
              _id: "$productId",
              totalQuantity: { $sum: "$quantity" },
              totalRevenue: { $sum: "$amount" },
            },
          },
        ],
        monthlyRevenue: [
          { $match: { orderStatus: "delivered" } },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" },
              },
              total: { $sum: "$amount" },
            },
          },
          {
            $project: {
              month: {
                $concat: [
                  {
                    $arrayElemAt: [
                      [
                        "",
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ],
                      "$_id.month",
                    ],
                  },
                  "-",
                  { $toString: "$_id.year" },
                ],
              },
              total: 1,
            },
          },
        ],
        weeklyStats: [
          {
            $match: {
              orderStatus: "delivered",
              createdAt: { $gte: fourWeeksAgo },
            },
          },
          {
            $group: {
              _id: { week: "$week", year: "$year" },
              orders: { $sum: 1 },
              revenue: { $sum: "$amount" },
            },
          },
          { $sort: { "_id.year": 1, "_id.week": 1 } },
        ],
        topCities: [
          { $match: { orderStatus: "delivered" } },
          {
            $group: {
              _id: "$city",
              orders: { $sum: 1 },
              revenue: { $sum: "$amount" },
            },
          },
          { $sort: { orders: -1 } },
          { $limit: 5 },
        ],
        topProducts: [
          { $match: { orderStatus: "delivered" } },
          {
            $group: {
              _id: "$productId",
              quantitySold: { $sum: "$quantity" },
              revenue: { $sum: "$amount" },
            },
          },
          { $sort: { quantitySold: -1 } },
          { $limit: 10 },
        ],
        orderCount: [
          {
            $group: {
              _id: "$_id",
              statuses: { $addToSet: "$orderStatus" },
            },
          },
        ],
      },
    },
  ];

  const result = await Order.aggregate(pipeline);
  const {
    deliveredItems,
    monthlyRevenue,
    weeklyStats,
    topProducts,
    topCities,
    orderCount,
  } = result[0];

  const totalDelivered = deliveredItems.reduce(
    (sum, i) => sum + i.totalQuantity,
    0
  );
  const totalSales = deliveredItems.reduce((sum, i) => sum + i.totalRevenue, 0);
  const totalOrders = orderCount.length;
  const deliveredOrders = orderCount.filter((o) =>
    o.statuses.includes("delivered")
  ).length;
  const cancelledOrders = orderCount.filter((o) =>
    o.statuses.includes("cancelled")
  ).length;

  // Average Rating
  //   const reviews = await Review.find({ sellerId });
  //   const avgRating =
  //     reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
  const seller = await Seller.find({ _id: sellerId });
  //   console.log(sellerReview[0].averageRating);
  const sellerReview = seller[0];

  // Top Reviewed Products
  const topReviewed = await Product.find({ seller: sellerId }) // <-- FIXED HERE
    .sort({ totalReviews: -1 })
    .limit(10)
    .select("_id name totalReviews averageRating price image");

  res.json({
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalDeliveredProducts: totalDelivered,
    totalSales: totalSales.toFixed(2),
    monthlyRevenue: Object.fromEntries(
      monthlyRevenue.map((m) => [m.month, m.total.toFixed(2)])
    ),
    weeklyStats,
    topCities,
    topProducts: topProducts.map((p) => ({
      productId: p._id,
      quantitySold: p.quantitySold,
      revenue: p.revenue.toFixed(2),
    })),
    topReviewedProducts: topReviewed.map((p) => ({
      productId: p._id,
      name: p.name,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
    })),
    averageRating: sellerReview.averageRating,
    totalReviews: sellerReview.totalReviews,
  });
});

export const getUserAnalytics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const pipeline = [
    { $match: { userId } },
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
        totalSpent: {
          $sum: {
            $cond: [{ $eq: ["$orderStatus", "delivered"] }, "$totalAmount", 0],
          },
        },
      },
    },
  ];

  const result = await Order.aggregate(pipeline);

  let totalOrders = 0;
  let delivered = 0;
  let cancelled = 0;
  let totalSpent = 0;

  for (const group of result) {
    totalOrders += group.count;
    if (group._id === "delivered") {
      delivered = group.count;
      totalSpent = group.totalSpent;
    } else if (group._id === "cancelled") {
      cancelled = group.count;
    }
  }

  res.json({
    totalOrders,
    totalSpent: totalSpent.toFixed(2),
    deliveredOrders: delivered,
    cancelledOrders: cancelled,
    averageOrderValue: (totalSpent / (delivered || 1)).toFixed(2),
    loyalty: delivered >= 3 ? "Prime Member" : "New Buyer",
  });
});

export const getAdminAnalytics = asyncHandler(async (req, res) => {
  // Parallel aggregate queries for performance
  const [
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalUsers,
    totalSellers,
    deliveredOrderData,
    activeSubscriptions,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: "delivered" }),
    Order.countDocuments({ orderStatus: "cancelled" }),
    User.countDocuments(),
    Seller.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    UserSubscription.aggregate([
      {
        $match: {
          isActive: true,
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: "$billingCycle",
          totalRevenue: { $sum: "$amountPaid" }, // Optional field you can add
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalRevenue = deliveredOrderData[0]?.totalRevenue || 0;

  // Optional: Normalize subscription revenue
  let subscriptionRevenue = 0;
  for (const sub of activeSubscriptions) {
    subscriptionRevenue += sub.totalRevenue || 0;
  }

  res.status(200).json({
    stats: {
      orders: {
        total: totalOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      users: totalUsers,
      sellers: totalSellers,
      revenue: {
        fromOrders: totalRevenue,
        fromSubscriptions: subscriptionRevenue,
      },
      subscriptions: activeSubscriptions.map((sub) => ({
        billingCycle: sub._id,
        totalRevenue: sub.totalRevenue || 0,
        activeCount: sub.count,
      })),
    },
  });
});
