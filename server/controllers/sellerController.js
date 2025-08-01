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

    // 📆 Dates
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

    const status = req.query.status; // ?status=pending
    const fromDate = req.query.fromDate; // ?fromDate=2024-07-01
    const toDate = req.query.toDate; // ?toDate=2024-07-31

    //  Build dynamic filter query
    const filterQuery = {
      "orderItems.product": { $in: productIds },
    };

    if (status) {
      filterQuery.status = status;
    }

    if (fromDate && toDate) {
      filterQuery.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
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

  // ✅ Step 1: Find seller by userId
  const seller = await Seller.findOne({ user: userId });
  if (!seller) {
    return res.status(404).json({ message: "Seller not found" });
  }

  const sellerId = seller._id;

  // ✅ Step 2: Build filters
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

  // ✅ Step 3: Seller's product IDs
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

  // ✅ Step 4: Total count
  const totalOrders = await Order.countDocuments(matchStage);

  // ✅ Step 5: Fetch orders
  const orders = await Order.find(matchStage)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("userId", "name email")
    .populate("items.productId", "name image")
    .select("userId items totalAmount paymentStatus orderStatus createdAt");

  // ✅ Step 6: Format per seller
  const formattedOrders = [];

  for (const order of orders) {
    const filteredItems = order.items.filter((item) =>
      productIds.some((pid) => pid.toString() === item.productId._id.toString())
    );

    if (filteredItems.length === 0) continue; // skip irrelevant orders

    const formattedOrder = {
      orderId: order._id,
      customer: {
        name: order.userId?.name || "N/A",
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
