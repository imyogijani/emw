import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import Subscription from "../models/subscriptionModel.js";
import Seller from "../models/sellerModel.js";
import Category from "../models/categoryModel.js";
import Review from "../models/reviewModel.js";
import mongoose from "mongoose";
// Helper Function
function calculateGrowth(current, previous) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

export const getSellerDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    const seller = await Seller.findOne({ user: userId });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const sellerId = seller._id;

    //  Dates
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date();
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get seller's product IDs
    const sellerProducts = await Product.find({ seller: sellerId }).select(
      "_id createdAt"
    );
    const productIds = sellerProducts.map((p) => p._id);

    // Total Products
    const totalProducts = sellerProducts.length;

    // New Products this week
    const newProductsThisWeek = sellerProducts.filter(
      (p) => new Date(p.createdAt) >= startOfWeek
    ).length;

    // Today's Sales
    const todaySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          "orderItems.product": { $in: productIds },
        },
      },
      {
        $group: { _id: null, total: { $sum: "$total" } },
      },
    ]);
    const todaySales = todaySalesAgg[0]?.total || 0;

    // Yesterday's Sales
    const yesterdaySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
          "orderItems.product": { $in: productIds },
        },
      },
      {
        $group: { _id: null, total: { $sum: "$total" } },
      },
    ]);
    const yesterdaySales = yesterdaySalesAgg[0]?.total || 0;

    const salesGrowth = calculateGrowth(todaySales, yesterdaySales);

    // Pending Orders (today and yesterday)
    const pendingOrdersToday = await Order.countDocuments({
      "orderItems.product": { $in: productIds },
      status: "pending",
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const pendingOrdersYesterday = await Order.countDocuments({
      "orderItems.product": { $in: productIds },
      status: "pending",
      createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
    });

    // Reviews this month (on seller’s products)
    const monthlyReviews = await Review.countDocuments({
      product: { $in: productIds },
      createdAt: { $gte: startOfMonth },
    });

    const allPendingOrders = await Order.countDocuments({
      "orderItems.product": { $in: productIds },
      status: "pending",
    });

    // Average Rating (already on seller model)
    const averageRating = seller.averageRating || 0;

    // Optional: use monthlyReviews for rating growth logic if needed
    const ratingGrowth = monthlyReviews;

    // Get system settings for onboarding
    const Settings = (await import("../models/settingsModel.js")).default;
    const settings = await Settings.getSettings();

    // Get user for onboarding status
    const user = await User.findById(userId);

    // Final response
    res.json({
      todaySales,
      yesterdaySales,
      salesGrowth,

      totalProducts,
      newProductsThisWeek,

      pendingOrdersToday,
      pendingOrdersYesterday,
      allPendingOrders,

      averageRating,
      monthlyReviews,
      ratingGrowth,

      // Onboarding and access information
      onboardingSettings: {
        enabled: settings.onboardingEnabled,
        requiredSteps: settings.onboardingRequiredSteps || [
          "shopTiming",
          "shopDetails",
          "legalDocuments",
        ],
      },
      userOnboardingStatus: {
        isComplete: user.isOnboardingComplete,
        currentStep: seller.onboardingStep,
        demoAccess: user.demoAccess || false,
      },
      dashboardAccess: req.dashboardAccess || "full",
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

export const getRecentOrdersForSeller = async (req, res) => {
  try {
    const userId = req.userId;

    // 1 Find Seller by userId
    const seller = await Seller.findOne({ user: userId });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const sellerId = seller._id;

    // 2 Get all product IDs of the seller
    const products = await Product.find({ seller: sellerId }).select("_id");
    const productIds = products.map((p) => p._id);

    // 3 Pagination and Filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    const timeRange = parseInt(req.query.timeRange); // ?timeRange=7 or 30

    //  Build dynamic filter query
    const filterQuery = {
      "orderItems.product": { $in: productIds },
    };

    if (status) {
      filterQuery.status = status;
    }

    // Agar fromDate aur toDate diya hai to wahi use karo
    if (fromDate && toDate) {
      filterQuery.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }
    // Agar timeRange diya hai to current date se subtract karke filter lagao
    else if (timeRange && (timeRange === 7 || timeRange === 30)) {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - timeRange);

      filterQuery.createdAt = {
        $gte: pastDate,
        $lte: today,
      };
    }

    // 5 Count total orders (for pagination)
    const totalOrders = await Order.countDocuments(filterQuery);

    // 6 Fetch orders with pagination
    const orders = await Order.find(filterQuery)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .populate("user", "name email") // customer info
      .select("orderItems total status createdAt user");

    res.status(200).json({
      success: true,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });
  } catch (error) {
    console.error("Error in getRecentOrdersForSeller:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getSalesData = async (req, res) => {
  try {
    const userId = req.userId;

    // Get seller info
    const seller = await Seller.findOne({ user: userId });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const sellerId = seller._id;

    // Get seller's product IDs
    const sellerProducts = await Product.find({ seller: sellerId }).select(
      "_id"
    );
    const productIds = sellerProducts.map((p) => p._id);

    // Filters
    const { from, to, productId, status } = req.query;

    // Match stage base
    const matchStage = {
      "orderItems.product": { $in: productIds },
    };

    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = new Date(from);
      if (to) matchStage.createdAt.$lte = new Date(to);
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      matchStage["orderItems.product"] = mongoose.Types.ObjectId(productId);
    }

    if (status) {
      matchStage.status = status;
    }

    const salesStats = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.product": { $in: productIds }, // again filter after unwind
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$orderItems.price" },
          totalOrders: { $addToSet: "$_id" },
          totalQuantity: { $sum: "$orderItems.quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalOrders: { $size: "$totalOrders" },
          totalQuantity: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: salesStats[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        totalQuantity: 0,
      },
    });
  } catch (err) {
    console.error("Sales Data Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getSellerOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;

  //  Step 1: Find seller by userId
  const seller = await Seller.findOne({ user: userId });
  if (!seller) {
    return res.status(404).json({ message: "Seller not found" });
  }

  const sellerId = seller._id;

  //  Step 2: Build filters
  const {
    page = 1,
    limit = 10,
    orderStatus,
    paymentStatus,
    productId,
    from,
    to,
  } = req.query;

  const skip = (page - 1) * limit;

  //  Step 3: Seller's product IDs
  const sellerProducts = await Product.find({ seller: sellerId }).select("_id");
  const productIds = sellerProducts.map((p) => p._id);

  const matchStage = {
    "items.productId": { $in: productIds },
  };

  if (orderStatus) {
    matchStage.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    matchStage.paymentStatus = paymentStatus;
  }

  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    matchStage["items.productId"] = mongoose.Types.ObjectId(productId);
  }

  if (from || to) {
    matchStage.createdAt = {};
    if (from) matchStage.createdAt.$gte = new Date(from);
    if (to) matchStage.createdAt.$lte = new Date(to);
  }

  //  Step 4: Total count
  const totalOrders = await Order.countDocuments(matchStage);

  //  Step 5: Fetch orders
  const orders = await Order.find(matchStage)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("userId", "name email")
    .populate("items.productId", "name image")
    .select("userId items totalAmount paymentStatus orderStatus createdAt");

  //  Step 6: Format per seller
  const formattedOrders = [];

  for (const order of orders) {
    const filteredItems = order.items.filter((item) =>
      productIds.some((pid) => pid.toString() === item.productId._id.toString())
    );

    if (filteredItems.length === 0) continue; // skip irrelevant orders

    const formattedOrder = {
      orderId: order._id,
      customer: {
        name: order.userId?.names || "N/A",
        email: order.userId?.email || "N/A",
      },
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      items: filteredItems.map((item) => ({
        productId: item.productId._id,
        productName: item.productId.name,
        productImage: item.productId.image?.[0],
        quantity: item.quantity,
        finalPrice: item.finalPrice,
        total: item.finalPrice * item.quantity,
        deliveryStatus: item.deliveryStatus,
      })),
    };

    formattedOrders.push(formattedOrder);
  }
  res.status(200).json({
    success: true,
    totalOrders,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalOrders / limit),
    orders: formattedOrders,
  });
});

export const getSellerCustomer = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      startDate,
      endDate,
      search,
    } = req.query;

    // 1. Seller find
    const seller = await Seller.findOne({ user: req.userId });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    // 2. Aggregation pipeline
    const pipeline = [
      // a. Unwind items array to handle each item separately
      { $unwind: "$items" },

      // b. Match seller's items and delivered/paid orders
      {
        $match: {
          "items.sellerId": seller._id,
          $or: [{ orderStatus: "delivered" }, { paymentStatus: "paid" }],
          ...(city && { "shippingAddress.city": city }),
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate && { $gte: new Date(startDate) }),
                  ...(endDate && { $lte: new Date(endDate) }),
                },
              }
            : {}),
        },
      },
      { $sort: { createdAt: -1 } },
      // c. Group by customer
      {
        $group: {
          _id: "$userId",
          orderIds: { $addToSet: "$_id" }, // Unique orders
          totalSpent: {
            $sum: {
              $multiply: ["$items.finalPrice", "$items.quantity"],
            },
          }, // Only this seller's product price
          latestOrderCreatedAt: { $max: "$createdAt" },
          latestCity: { $first: "$shippingAddress.city" },
        },
      },

      // d. Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },

      // e. Optional: Search by name or user ID
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "userDetails.names": { $regex: search, $options: "i" } },
                  ...(search.length === 24
                    ? [{ _id: new mongoose.Types.ObjectId(search) }]
                    : []),
                ],
              },
            },
          ]
        : []),

      // f. Add order count
      {
        $addFields: {
          orderCount: { $size: "$orderIds" },
        },
      },

      // g. Sort by latest order
      { $sort: { latestOrderCreatedAt: -1 } },

      // h. Pagination
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ];

    // 3. Get paginated customer data
    const customers = await Order.aggregate(pipeline);

    // 4. Total count (without skip and limit)
    const countPipeline = [...pipeline];
    countPipeline.splice(-2); // Remove $skip and $limit
    const totalCustomers = await Order.aggregate(countPipeline);
    const total = totalCustomers.length;

    // 5. Format response
    const results = customers.map((cust) => ({
      customerId: cust._id,
      customerName: cust.userDetails.names,
      email: cust.userDetails.email,
      phone: cust.userDetails.phone,
      city: cust.latestCity || "N/A",
      orderCount: cust.orderCount,
      totalSpent: cust.totalSpent,
      latestOrderDate: cust.latestOrderCreatedAt,
    }));

    // 6. Final response
    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      data: results,
    });
  } catch (error) {
    console.error("Error fetching seller customers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/seller/customer-orders?customerId=65a8c12...&sellerId=64bd0e4...&page=1&limit=5&timeRange=30days

export const getCustomerOrdersBySeller = asyncHandler(async (req, res) => {
  try {
    const {
      customerId,
      sellerId,
      page = 1,
      limit = 10,
      timeRange = "30days",
      startDate,
      endDate,
    } = req.query;

    if (!customerId || !sellerId) {
      return res.status(400).json({
        success: false,
        message: "customerId and sellerId are required",
      });
    }

    // 1️⃣ Time Filter
    let dateFilter = {};
    const now = new Date();

    if (timeRange === "30days") {
      const pastDate = new Date();
      pastDate.setDate(now.getDate() - 30);
      dateFilter = { createdAt: { $gte: pastDate } };
    } else if (timeRange === "1year") {
      const pastDate = new Date();
      pastDate.setFullYear(now.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: pastDate } };
    } else if (timeRange === "custom" && startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // 2️⃣ Aggregation
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(customerId),
          ...dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.sellerId": new mongoose.Types.ObjectId(sellerId),
          $or: [{ orderStatus: "delivered" }, { paymentStatus: "paid" }],
        },
      },
      {
        $addFields: {
          "items.totalPrice": {
            $multiply: ["$items.finalPrice", "$items.quantity"],
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          orderDate: { $first: "$createdAt" },
          totalSellerAmount: { $sum: "$items.totalPrice" },
          sellerItems: {
            $push: {
              productId: "$items.productId",
              name: "$items.name",
              finalPrice: "$items.finalPrice",
              quantity: "$items.quantity",
              totalPrice: "$items.totalPrice",
            },
          },
        },
      },
      { $sort: { orderDate: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ];

    const orders = await Order.aggregate(pipeline);

    // 3️⃣ Total Count (for pagination)
    const countPipeline = pipeline.slice(0, -2); // remove skip & limit
    const totalOrders = await Order.aggregate(countPipeline);
    const total = totalOrders.length;

    // 4️⃣ Final Total Amount of All Orders
    const overallTotalAmount = orders.reduce(
      (sum, order) => sum + order.totalSellerAmount,
      0
    );

    // 5️⃣ Final Response
    res.status(200).json({
      success: true,
      page: parseInt(page),
      total,
      overallTotalAmount,
      data: orders.map((order) => ({
        orderId: order._id,
        orderDate: order.orderDate,
        totalAmount: order.totalSellerAmount,
        products: order.sellerItems,
      })),
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// GET http://localhost:8080/api/sellers/sales-overview?productId=64f5b6f2e4a5b7d8c9f0a1b2&variantId=64f5b8a2e4a5b7d8c9f0a1c4

export const getSellerSalesOverview = async (req, res) => {
  try {
    const { productId, variantId } = req.query;

    //  Seller ID from logged-in user
    const seller = await Seller.findOne({ user: req.userId }).select("_id");
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    const sellerId = seller._id;

    //  Date ranges
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    //  Aggregation
    const matchStage = {
      orderStatus: "delivered",
      "items.sellerId": sellerId,
    };

    if (productId)
      matchStage["items.productId"] = new mongoose.Types.ObjectId(productId);
    if (variantId)
      matchStage["items.variantId"] = new mongoose.Types.ObjectId(variantId);

    const salesData = await Order.aggregate([
      { $match: { orderStatus: "delivered", "items.sellerId": sellerId } },
      { $unwind: "$items" },
      {
        $match: {
          "items.sellerId": sellerId,
          ...(productId && {
            "items.productId": new mongoose.Types.ObjectId(productId),
          }),
          ...(variantId && {
            "items.variantId": new mongoose.Types.ObjectId(variantId),
          }),
        },
      },
      {
        $group: {
          _id: {
            productId: "$items.productId",
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      {
        $group: {
          _id: "$_id.productId",
          monthlyData: {
            $push: {
              month: "$_id.month",
              year: "$_id.year",
              quantity: "$totalQuantity",
            },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          productId: "$_id",
          productName: { $arrayElemAt: ["$product.name", 0] },
          monthlyData: 1,
        },
      },
    ]);

    //  Process last month vs this month diff
    const result = salesData.map((prod) => {
      let prevMonthsQty = 0;
      let thisMonthQty = 0;

      prod.monthlyData.forEach((m) => {
        const dateCheck = new Date(m.year, m.month - 1, 1);

        if (dateCheck >= startOfLastMonth && dateCheck <= endOfLastMonth) {
          prevMonthsQty += m.quantity;
        } else if (dateCheck >= startOfThisMonth) {
          thisMonthQty += m.quantity;
        }
      });

      const difference = thisMonthQty - prevMonthsQty;
      const percentageChange =
        prevMonthsQty > 0
          ? ((difference / prevMonthsQty) * 100).toFixed(2)
          : 100;

      return {
        productId: prod.productId,
        productName: prod.productName,
        lastMonthsQuantity: prevMonthsQty,
        thisMonthQuantity: thisMonthQty,
        difference,
        percentageChange: `${percentageChange}%`,
      };
    });

    res.json({ success: true, salesOverview: result });
  } catch (err) {
    console.error("Sales Overview Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSellerOrdersAnalytics = async (req, res) => {
  try {
    const { timeRange, startDate, endDate, categoryId, city, status } =
      req.query;

    // 1️⃣ Seller ID find
    const seller = await Seller.findOne({ user: req.userId }).select("_id");
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    const sellerId = seller._id;

    // 2️⃣ Date Range set
    const now = new Date();
    let start, end;
    if (timeRange === "7d") {
      start = new Date();
      start.setDate(now.getDate() - 7);
      end = now;
    } else if (timeRange === "30d") {
      start = new Date();
      start.setDate(now.getDate() - 30);
      end = now;
    } else if (timeRange === "custom" && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    }

    // 3️⃣ Match stage for seller-specific items
    const matchStage = {
      "items.sellerId": sellerId,
      createdAt: { $gte: start, $lte: end },
    };
    if (status) matchStage["items.deliveryStatus"] = status;
    if (city) matchStage["shippingAddress.city"] = city;

    // 4️⃣ Aggregation pipeline
    const analytics = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" }, // each item as separate row
      { $match: { "items.sellerId": sellerId } }, // ensure only current seller items

      // Product info join
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // Optional category filter
      ...(categoryId
        ? [
            {
              $match: {
                "product.categoryId": new mongoose.Types.ObjectId(categoryId),
              },
            },
          ]
        : []),

      {
        $facet: {
          // a) Total Revenue & Orders
          revenue: [
            {
              $group: {
                _id: null,
                totalRevenue: {
                  $sum: { $multiply: ["$items.quantity", "$items.finalPrice"] },
                },
                totalOrders: { $sum: 1 },
              },
            },
          ],

          // b) Product-wise Quantity
          productWise: [
            {
              $group: {
                _id: "$items.productId",
                quantity: { $sum: "$items.quantity" },
                revenue: {
                  $sum: { $multiply: ["$items.quantity", "$items.finalPrice"] },
                },
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$product" },
            {
              $project: {
                productId: "$_id",
                productName: "$product.name",
                quantity: 1,
                revenue: 1,
              },
            },
          ],

          // c) Status Breakdown
          statusWise: [
            {
              $group: {
                _id: "$items.deliveryStatus",
                count: { $sum: 1 },
              },
            },
          ],

          // d) City-wise
          cityWise: [
            {
              $group: {
                _id: "$shippingAddress.city",
                orders: { $sum: 1 },
              },
            },
          ],

          // e) Category-wise Trends
          categoryWise: [
            {
              $group: {
                _id: "$product.categoryId",
                totalSales: {
                  $sum: { $multiply: ["$items.quantity", "$items.finalPrice"] },
                },
                totalQuantity: { $sum: "$items.quantity" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "category",
              },
            },
            { $unwind: "$category" },
            {
              $project: {
                categoryId: "$_id",
                categoryName: "$category.name",
                totalSales: 1,
                totalQuantity: 1,
              },
            },
          ],

          // f) Repeat Customers
          repeatCustomers: [
            {
              $group: {
                _id: "$userId",
                ordersCount: { $sum: 1 },
              },
            },
            {
              $group: {
                _id: null,
                totalCustomers: { $sum: 1 },
                repeatCustomers: {
                  $sum: { $cond: [{ $gt: ["$ordersCount", 1] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                totalCustomers: 1,
                repeatCustomers: 1,
                repeatPercent: {
                  $cond: [
                    { $gt: ["$totalCustomers", 0] },
                    {
                      $multiply: [
                        { $divide: ["$repeatCustomers", "$totalCustomers"] },
                        100,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          ],
        },
      },
    ]);

    res.json({ success: true, analytics: analytics[0] });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateSellerGST = async (req, res) => {
  try {
    const { gstNumber } = req.body;

    if (!gstNumber) {
      return res
        .status(400)
        .json({ success: false, message: "GST number is required" });
    }

    // GST validation (India GST format)
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid GST number format" });
    }

    // Find seller by logged-in user
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    // Update GST number
    seller.gstNumber = gstNumber;
    await seller.save();

    return res.status(200).json({
      success: true,
      message: "GST number updated successfully",
      gstNumber: seller.gstNumber,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Bank Details
export const updateBankDetails = async (req, res) => {
  try {
    const { beneficiaryName, accountNumber, ifscCode } = req.body;

    // === Validations ===
    if (!beneficiaryName || beneficiaryName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Beneficiary name must be at least 3 characters",
      });
    }

    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(beneficiaryName)) {
      return res.status(400).json({
        success: false,
        message:
          "Beneficiary (Account holder) name should contain only alphabets and spaces",
      });
    }

    if (!accountNumber || !/^[0-9]{9,18}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Account number must be 9-18 digits",
      });
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscCode || !ifscRegex.test(ifscCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid IFSC code format (e.g. HDFC0001234)",
      });
    }

    // === Find Seller linked to logged-in user ===
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // === Save Bank Details ===
    seller.bankDetails = {
      beneficiary_name: beneficiaryName.trim(),
      account_number: accountNumber,
      ifsc: ifscCode.toUpperCase(),
    };

    await seller.save();

    return res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
      bankDetails: seller.bankDetails,
    });
  } catch (error) {
    console.error("Bank details update error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getOnboardingStep = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id }); // user id from token
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const user = await User.findById(req.user._id);

    // Get system settings for onboarding
    const Settings = (await import("../models/settingsModel.js")).default;
    const settings = await Settings.getSettings();

    res.json({
      success: true,
      step: seller.onboardingStep,
      isComplete: user.isOnboardingComplete,
      onboardingSettings: {
        enabled: settings.onboardingEnabled,
        requiredSteps: settings.onboardingRequiredSteps || [
          "shopTiming",
          "shopDetails",
          "legalDocuments",
        ],
      },
      demoAccess: user.demoAccess || false,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getSellerInfo = async (req, res) => {
  try {
    const userId = req.user._id; // login after get userId in middleware

    
    const seller = await Seller.findOne({ user: userId })
      .populate("user", "names email phone") // userModel se name, email, phone
      .populate("categories", "name") // agar category ka naam chahiye
      .populate("brands", "name"); // agar brand ka naam chahiye

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Response me seller + user dono ka info bhejna
    res.status(200).json({
      success: true,
      seller: {
        _id: seller._id,
        shopName: seller.shopName,
        shopImage: seller.shopImage,
        ownerName: seller.ownerName,
        description: seller.description,
        location: seller.location,
        shopAddresses: seller.shopAddresses,
        specialist: seller.specialist,
        status: seller.status,
        gstNumber: seller.gstNumber,
        gstVerified: seller.gstVerified,
        kycVerified: seller.kycVerified,
        bankDetails: seller.bankDetails,
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
        // User info
        user: seller.user
          ? {
              name: seller.user.names,
              email: seller.user.email,
              phone: seller.user.phone,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching seller info:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching seller info",
      error: error.message,
    });
  }
};
