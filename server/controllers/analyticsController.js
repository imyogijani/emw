import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

// Helper: Aggregate product sales
async function getProductSalesAggregation(match = {}) {
  return Order.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
      },
    },
    { $sort: { totalSold: -1 } },
  ]);
}

// Helper: Aggregate shop sales
async function getShopSalesAggregation() {
  // Assumes each order has a seller/shop reference in items or order
  // If not, this needs to be adjusted based on your schema
  return User.aggregate([
    { $match: { role: "shopowner" }},
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "seller", // If you store seller on order
        as: "orders",
      },
    },
    {
      $project: {
        shopName: 1,
        totalOrders: { $size: "$orders" },
        totalRevenue: { $sum: "$orders.total" },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
}

// Helper: Aggregate product ratings (if you add a rating model)
async function getProductRatingsAggregation() {
  // Placeholder: implement if/when you add a ratings/reviews model
  return [];
}

// Admin analytics: product sales, shop sales, ratings
export async function getAdminAnalytics(req, res) {
  try {
    const productSales = await getProductSalesAggregation();
    const shopSales = await getShopSalesAggregation();
    const productRatings = await getProductRatingsAggregation();
    res.json({
      success: true,
      productSales,
      shopSales,
      productRatings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
}

// Seller analytics: product sales, ratings (for this seller)
export async function getSellerAnalytics(req, res) {
  try {
    const sellerId = req.user._id;
    // Only orders for this seller
    const productSales = await getProductSalesAggregation({
      "items.seller": sellerId,
    });
    const productRatings = await getProductRatingsAggregation(); // Filter by seller if implemented
    res.json({
      success: true,
      productSales,
      productRatings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
}
