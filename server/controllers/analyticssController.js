import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Review from "../models/reviewModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Seller from "../models/sellerModel.js";
// import UserSubscription from "../models/userSubscriptionModel.js";
import mongoose from "mongoose";
import Category from "../models/categoryModel.js";

export const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = new mongoose.Types.ObjectId(req.user.sellerId);
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const endOfYesterday = new Date(startOfToday);
  endOfYesterday.setMilliseconds(-1);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(now.getDate() - 28);

  // ----------------
  // Today's Sales Revenue
  // ----------------
  const todaySalesAgg = await Order.aggregate([
    { $unwind: "$items" },
    {
      $match: {
        "items.sellerId": sellerId,
        createdAt: { $gte: startOfToday },
        $or: [{ orderStatus: "delivered" }, { paymentStatus: "success" }],
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: { $multiply: ["$items.quantity", "$items.finalPrice"] },
        },
      },
    },
  ]);
  const todaySales = todaySalesAgg.length ? todaySalesAgg[0].totalRevenue : 0;

  // Yesterday's Sales
  const yesterdaySalesAgg = await Order.aggregate([
    { $unwind: "$items" },
    {
      $match: {
        "items.sellerId": sellerId,
        orderStatus: "delivered",
        createdAt: { $gte: startOfYesterday, $lt: startOfToday },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: { $multiply: ["$items.quantity", "$items.finalPrice"] },
        },
      },
    },
  ]);
  const yesterdaySales = yesterdaySalesAgg.length
    ? yesterdaySalesAgg[0].totalRevenue
    : 0;

  // Growth %
  const salesGrowth =
    yesterdaySales > 0
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
      : 0;

  // ----------------
  // Total Products + New This Week
  // ----------------
  const totalProducts = await Product.countDocuments({ seller: sellerId });
  const newThisWeek = await Product.countDocuments({
    seller: sellerId,
    createdAt: { $gte: startOfWeek },
  });

  // ----------------
  // Pending Orders Count + Yesterday Difference
  // ----------------
  // Pending orders today (count each order only once)
  const pendingAgg = await Order.aggregate([
    {
      $facet: {
        today: [
          {
            $match: {
              createdAt: { $gte: startOfToday },
              "items.sellerId": sellerId,
              orderStatus: { $in: ["processing", "in_transit"] },
            },
          },
          { $group: { _id: "$_id" } },
          { $count: "count" },
        ],
        yesterday: [
          {
            $match: {
              createdAt: { $gte: startOfYesterday, $lt: startOfToday },
              "items.sellerId": sellerId,
              orderStatus: { $in: ["processing", "in_transit"] },
            },
          },
          { $group: { _id: "$_id" } },
          { $count: "count" },
        ],
      },
    },
    {
      $project: {
        todayCount: { $ifNull: [{ $arrayElemAt: ["$today.count", 0] }, 0] },
        yesterdayCount: {
          $ifNull: [{ $arrayElemAt: ["$yesterday.count", 0] }, 0],
        },
        difference: {
          $let: {
            vars: {
              diff: {
                $subtract: [
                  { $ifNull: [{ $arrayElemAt: ["$today.count", 0] }, 0] },
                  { $ifNull: [{ $arrayElemAt: ["$yesterday.count", 0] }, 0] },
                ],
              },
            },
            in: { $cond: [{ $gt: ["$$diff", 0] }, "$$diff", 0] },
          },
        },
      },
    },
  ]);

  const pendingOrdersToday = pendingAgg[0]?.todayCount || 0;
  const pendingOrdersDiff = pendingAgg[0]?.difference || 0;

  // tottal pending orders
  // Total pending orders (all time) for this seller
  const totalPendingAgg = await Order.aggregate([
    {
      $match: {
        "items.sellerId": sellerId,
        orderStatus: { $in: ["processing", "in_transit"] },
      },
    },
    { $group: { _id: "$_id" } }, // ensure unique order count
    { $count: "count" },
  ]);

  const totalPendingOrders =
    totalPendingAgg.length > 0 ? totalPendingAgg[0].count : 0;

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

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sellerProductIds = await Product.find({ seller: sellerId }).distinct(
    "_id"
  );
  const reviewsThisMonth = await Review.countDocuments({
    productId: { $in: sellerProductIds },
    createdAt: { $gte: startOfMonth },
  });

  // Top Reviewed Products
  const topReviewed = await Product.find({ seller: sellerId }) // <-- FIXED HERE
    .sort({ totalReviews: -1 })
    .limit(10)
    .select("_id name totalReviews averageRating price image");

  const orders = await Order.find({
    "items.sellerId": sellerId,
    orderStatus: "delivered",
  })
    .populate({
      path: "items.productId",
      select: "category subcategory ",
      model: "products",
    })
    .lean(); // get plain JS objects

  console.log("DEBUG: Total orders fetched:", orders.length);
  const categoryMap = new Map();

  orders.forEach((order, orderIndex) => {
    order.items.forEach((item, itemIndex) => {
      console.log("Raw productId for item:", item.productId);
      if (item.sellerId.toString() !== sellerId.toString()) return;

      const product = item.productId; // populated product object
      if (!product) {
        // console.log(
        //   `DEBUG: Order ${order._id} item ${itemIndex} has no populated product`
        // );
        return;
      }

      console.log("prduct categories", product.category);
      if (!product.category) {
        console.log(
          `DEBUG: Order ${order._id} item ${itemIndex} product ${product._id} missing category`
        );
        return;
      }

      const catId = product.category.toString();
      console.log(
        `DEBUG: Processing order ${order._id} item ${itemIndex} with category ${catId}`
      );

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          totalOrders: 0,
          totalQuantity: 0,
          totalRevenue: 0,
        });
        console.log(`DEBUG: New category added to map: ${catId}`);
      }

      const catData = categoryMap.get(catId);

      catData.totalOrders += 1; // count each item occurrence as an order
      catData.totalQuantity += item.quantity;
      catData.totalRevenue += item.quantity * item.finalPrice;

      console.log(
        `DEBUG: Updated category ${catId} -> orders: ${
          catData.totalOrders
        }, quantity: ${
          catData.totalQuantity
        }, revenue: ${catData.totalRevenue.toFixed(2)}`
      );
    });
  });

  const categoryIds = Array.from(categoryMap.keys());
  const categories = await Category.find({ _id: { $in: categoryIds } })
    .select("name")
    .lean();
  console.log("DEBUG: Categories fetched from DB:", categories.length);

  const categoryNameMap = {};
  // const categoryNameMap = {};
  categories.forEach((cat) => {
    categoryNameMap[cat._id.toString()] = cat.name;
    console.log(`DEBUG: Category name mapped: ${cat._id} -> ${cat.name}`);
  });
  const categoryWiseOrders = Array.from(categoryMap.values()).map((cat) => ({
    categoryId: cat.categoryId,
    categoryName: categoryNameMap[cat.categoryId] || "Unknown",
    totalOrders: cat.totalOrders,
    totalQuantity: cat.totalQuantity,
    totalRevenue: cat.totalRevenue,
  }));

  console.log("DEBUG: Final categoryWiseOrders:", categoryWiseOrders);

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
    categoryWiseOrders: categoryWiseOrders.sort(
      (a, b) => b.totalOrders - a.totalOrders
    ),
    topReviewedProducts: topReviewed.map((p) => ({
      productId: p._id,
      name: p.name,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
    })),
    averageRating: sellerReview.averageRating,
    totalReviews: sellerReview.totalReviews,
    reviewsThisMonth: reviewsThisMonth,

    todaySales: todaySales.toFixed(2),
    salesGrowth: salesGrowth.toFixed(2), // %
    totalProducts,
    newProductsThisWeek: newThisWeek,
    pendingOrdersToday: pendingOrdersToday,
    pendingOrdersDiffYesterday: pendingOrdersDiff,
    totalPendingOrders: totalPendingOrders,
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

// export const getAdminAnalytics = asyncHandler(async (req, res) => {
//   // Parallel aggregate queries for performance
//   const [
//     totalOrders,
//     deliveredOrders,
//     cancelledOrders,
//     totalUsers,
//     totalSellers,
//     deliveredOrderData,
//     activeSubscriptions,
//   ] = await Promise.all([
//     Order.countDocuments(),
//     Order.countDocuments({ orderStatus: "delivered" }),
//     Order.countDocuments({ orderStatus: "cancelled" }),
//     User.countDocuments(),
//     Seller.countDocuments(),
//     Order.aggregate([
//       { $match: { orderStatus: "delivered" } },
//       {
//         $group: {
//           _id: null,
//           totalRevenue: { $sum: "$totalAmount" },
//         },
//       },
//     ]),
//     UserSubscription.aggregate([
//       {
//         $match: {
//           isActive: true,
//           paymentStatus: "paid",
//         },
//       },
//       {
//         $group: {
//           _id: "$billingCycle",
//           totalRevenue: { $sum: "$amountPaid" }, // Optional field you can add
//           count: { $sum: 1 },
//         },
//       },
//     ]),
//   ]);

//   const totalRevenue = deliveredOrderData[0]?.totalRevenue || 0;

//   // Optional: Normalize subscription revenue
//   let subscriptionRevenue = 0;
//   for (const sub of activeSubscriptions) {
//     subscriptionRevenue += sub.totalRevenue || 0;
//   }

//   res.status(200).json({
//     stats: {
//       orders: {
//         total: totalOrders,
//         delivered: deliveredOrders,
//         cancelled: cancelledOrders,
//       },
//       users: totalUsers,
//       sellers: totalSellers,
//       revenue: {
//         fromOrders: totalRevenue,
//         fromSubscriptions: subscriptionRevenue,
//       },
//       subscriptions: activeSubscriptions.map((sub) => ({
//         billingCycle: sub._id,
//         totalRevenue: sub.totalRevenue || 0,
//         activeCount: sub.count,
//       })),
//     },
//   });
// });

export const getAdminAnalytics = asyncHandler(async (req, res) => {
  // Parallel aggregate queries
  const [
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalUsers,
    totalSellers,
    totalProducts,
    deliveredOrderData,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: "delivered" }),
    Order.countDocuments({ orderStatus: "cancelled" }),
    User.countDocuments({ role: { $ne: "admin" } }),
    Seller.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subTotal" },
          totalGST: { $sum: "$totalGST" },
        },
      },
    ]),
    // UserSubscription.aggregate([
    //   { $match: { isActive: true, paymentStatus: "paid" } },
    //   {
    //     $lookup: {
    //       from: "subscriptions",
    //       localField: "subscription",
    //       foreignField: "_id",
    //       as: "subscriptionDetails",
    //     },
    //   },
    //   { $unwind: "$subscriptionDetails" },
    //   {
    //     $group: {
    //       _id: "$billingCycle",
    //       totalRevenue: { $sum: "$subscriptionDetails.price" },
    //       activeCount: { $sum: 1 },
    //     },
    //   },
    // ]),
  ]);

  const totalRevenue = deliveredOrderData[0]?.totalRevenue || 0;
  const totalGST = deliveredOrderData[0]?.totalGST || 0;

  // Normalize subscription revenue

  //  Weekly growth calculation
  const now = new Date();
  const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfThisWeek);

  const [usersThisWeek, usersLastWeek, sellersThisWeek, sellersLastWeek] =
    await Promise.all([
      User.countDocuments({ createdAt: { $gte: startOfThisWeek } }),
      User.countDocuments({
        createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek },
      }),
      Seller.countDocuments({ createdAt: { $gte: startOfThisWeek } }),
      Seller.countDocuments({
        createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek },
      }),
    ]);

  const userGrowth =
    usersLastWeek === 0
      ? usersThisWeek > 0
        ? 100
        : 0
      : ((usersThisWeek - usersLastWeek) / usersLastWeek) * 100;

  const sellerGrowth =
    sellersLastWeek === 0
      ? sellersThisWeek > 0
        ? 100
        : 0
      : ((sellersThisWeek - sellersLastWeek) / sellersLastWeek) * 100;

  res.status(200).json({
    stats: {
      orders: {
        total: totalOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      users: {
        total: totalUsers,
        newThisWeek: usersThisWeek,
        growthPercent: userGrowth.toFixed(2),
      },
      sellers: {
        total: totalSellers,
        newThisWeek: sellersThisWeek,
        growthPercent: sellerGrowth.toFixed(2),
      },
      products: totalProducts,
      revenue: {
        fromOrders: totalRevenue,
        gstCollected: totalGST,
      },
    },
  });
});

// Admin dashboard trends
export const getAdminTrends = asyncHandler(async (req, res) => {
  const { period = "daily", days = 7 } = req.query;
  const daysNumber = Number(days);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysNumber + 1);

  // Date format for grouping
  let dateFormat;
  let dateIncrement = 1; // 1 day increment
  switch (period) {
    case "daily":
      dateFormat = {
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
      };
      dateIncrement = 1;
      break;
    case "weekly":
      dateFormat = { $dateToString: { format: "%Y-%U", date: "$createdAt" } };
      dateIncrement = 7;
      break;
    case "monthly":
      dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
      dateIncrement = 30;
      break;
    default:
      dateFormat = {
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
      };
  }

  const matchDate = { createdAt: { $gte: startDate } };

  // Users trend
  const usersTrendRaw = await User.aggregate([
    { $match: matchDate },
    { $group: { _id: dateFormat, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Sellers trend
  const sellersTrendRaw = await Seller.aggregate([
    { $match: matchDate },
    { $group: { _id: dateFormat, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Orders revenue trend
  const ordersRevenueRaw = await Order.aggregate([
    { $match: { orderStatus: "delivered", createdAt: { $gte: startDate } } },
    { $group: { _id: dateFormat, revenue: { $sum: "$totalAmount" } } },
    { $sort: { _id: 1 } },
  ]);

  // Subscriptions revenue removed as subscription system is deprecated

  // Combine revenue (only from orders now)
  const revenueMap = {};
  ordersRevenueRaw.forEach((r) => {
    revenueMap[r._id] = (revenueMap[r._id] || 0) + r.revenue;
  });

  // Function to fill missing dates
  const fillMissingDates = (rawData, startDate, endDate, periodType) => {
    const filled = [];
    const dataMap = {};
    rawData.forEach((d) => {
      dataMap[d._id] = d.count || d.revenue;
    });

    let current = new Date(startDate);
    while (current <= endDate) {
      let key;
      if (periodType === "daily") {
        key = current.toISOString().slice(0, 10); // YYYY-MM-DD
        current.setDate(current.getDate() + 1);
      } else if (periodType === "weekly") {
        const onejan = new Date(current.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((current - onejan) / 86400000 + onejan.getDay() + 1) / 7
        );
        key = `${current.getFullYear()}-${week.toString().padStart(2, "0")}`;
        current.setDate(current.getDate() + 7);
      } else if (periodType === "monthly") {
        key = `${current.getFullYear()}-${(current.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        current.setMonth(current.getMonth() + 1);
      }
      filled.push({
        date: key,
        value: dataMap[key] || 0,
      });
    }
    return filled;
  };

  const endDate = today;

  const usersTrend = fillMissingDates(
    usersTrendRaw,
    startDate,
    endDate,
    period
  );
  const sellersTrend = fillMissingDates(
    sellersTrendRaw,
    startDate,
    endDate,
    period
  );
  const revenueTrend = fillMissingDates(
    Object.entries(revenueMap).map(([k, v]) => ({ _id: k, revenue: v })),
    startDate,
    endDate,
    period
  ).map((r) => ({ date: r.date, revenue: r.value }));

  res.status(200).json({
    success: true,
    period,
    lastDays: daysNumber,
    usersTrend,
    sellersTrend,
    revenueTrend,
  });
});
