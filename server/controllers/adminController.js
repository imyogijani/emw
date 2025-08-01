import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import Subscription from "../models/subscriptionModel.js";
import Seller from "../models/sellerModel.js";
import Category from "../models/categoryModel.js";
import mongoose from "mongoose";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
    const totalSellers = await Seller.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Get weekly user registration stats
    const weeklyUserStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get recent orders
    const activeSellers = await Seller.aggregate([
      {
        $match: { status: "active" },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "seller",
          as: "products",
        },
      },
      {
        $addFields: {
          totalProducts: { $size: "$products" },
        },
      },
      {
        $project: {
          shopName: 1,
          ownerName: 1,
          averageRating: 1,
          totalProducts: 1,
          createdAt: 1,
        },
      },
    ]);

    const allUsers = await User.find({}).select(
      "names email role lastLogin createdAt status"
    );

    // Calculate total revenue
    const revenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        revenue: revenue[0]?.total || 0,
        userStats: weeklyUserStats,
        activeSellers: activeSellers.map((seller) => ({
          _id: seller._id,
          shopName: seller.shopName || seller.names,
          email: seller.email,
          lastLogin: seller.lastLogin,
          totalProducts: seller.totalProducts || 0,
        })),
        allUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

// Get all products with shop details
// export const getAllProducts = async (req, res) => {
//   try {
//     const {
//       populateCategory,
//       populateSubcategory,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const skip = (page - 1) * limit;

//     let query = Product.find()
//       .populate("seller", ["names", "shopName"])
//       .skip(skip)
//       .limit(parseInt(limit));

//     if (populateCategory === "true") {
//       query = query.populate("category");
//     }

//     if (populateSubcategory === "true") {
//       query = query.populate("subcategory");
//     }

//     // Total number of products (without skip & limit)
//     const totalCount = await Product.countDocuments();

//     const products = await query;

//     res.json({
//       success: true,
//       totalCount,
//       totalPages: Math.ceil(totalCount / limit),
//       currentPage: parseInt(page),
//       products: products.map((product) => ({
//         _id: product._id,
//         name: product.name,
//         description: product.description,
//         price: product.price,
//         category: product.category,
//         subcategory: product.subcategory,
//         image: product.image,
//         stock: product.stock,
//         status: product.status,
//         shopId: product.seller?._id || null,
//         shopName:
//           product.seller?.ownerName ||
//           product.seller?.shopName ||
//           "Unknown Shop",
//       })),
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching products",
//       error: error.message,
//     });
//   }
// };

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      subcategory,
      seller,
      search = "",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build Filter
    const filter = {};
    if (category && mongoose.Types.ObjectId.isValid(category))
      filter.category = new mongoose.Types.ObjectId(category);
    if (subcategory && mongoose.Types.ObjectId.isValid(subcategory))
      filter.subcategory = new mongoose.Types.ObjectId(subcategory);
    if (seller && mongoose.Types.ObjectId.isValid(seller))
      filter.seller = new mongoose.Types.ObjectId(seller);
    if (search) filter.name = { $regex: search, $options: "i" };

    // Products + Count
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate({
          path: "seller",
          select: "shopName user",
          populate: {
            path: "user",
            select: "names",
          },
        })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    // Stock Aggregation (respecting the same filters)
    const totalAvailableStock = await Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$stock" },
        },
      },
    ]);

    const totalStockValue = totalAvailableStock[0]?.totalStock || 0;

    // Stats
    const [totalUsers, totalCategories, totalSellers] = await Promise.all([
      User.countDocuments(),
      Category.countDocuments(),
      Seller.countDocuments({ status: "active" }),
    ]);

    res.status(200).json({
      success: true,
      totals: {
        products: totalCount,
        users: totalUsers,
        categories: totalCategories,
        activeSellers: totalSellers,
        totalAvailableStock: totalStockValue,
      },
      pagination: {
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        image: p.image,
        stock: p.stock,
        status: p.status,
        category: p.category?.name || "N/A",
        subcategory: p.subcategory?.name || "N/A",
        shopId: p.seller?._id,
        shopName: p.seller?.shopName || "Unknown",
        ownerName: p.seller?.user?.names || "Unknown",
      })),
    });
  } catch (error) {
    console.error("Admin Get Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all shops
export const getAllShops = async (req, res) => {
  try {
    // Fetch sellers with their user info populated
    const shops = await Seller.find()
      .select("shopName shopImage ownerName status createdAt user")
      .populate({
        path: "user",
        select: "email names", // Only get email and name from User
      })
      .sort({ createdAt: -1 }); // Optional: latest shops first

    res.json({
      success: true,
      total: shops.length,
      shops: shops.map((shop) => ({
        _id: shop._id,
        shopName: shop.shopName,
        shopImage: shop.shopImage,
        // ownerName: shop.ownerName,
        email: shop.user?.email || "",
        owner: shop.user?.names || "",
        status: shop.status,
        createdAt: shop.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching shops",
      error: error.message,
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("subscription")
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        name: user.names || user.shopName,
        email: user.email,
        role: user.role.toLowerCase(),
        status: user.status || "active",
        createdAt: user.createdAt,
        subscription:
          user.role === "shopowner" && user.subscription
            ? {
                planName: user.subscription.planName,
                _id: user.subscription._id,
              }
            : undefined,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Delete user
export const getSellerDetails = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .populate("subscription")
      .select("-password");

    if (!seller || seller.role !== "shopowner") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Placeholder for fetching deals, products, orders, etc. related to this seller
    // For now, we'll just return the seller's basic info and subscription

    res.json({
      success: true,
      data: {
        _id: seller._id,
        names: seller.names,
        shopName: seller.shopName,
        email: seller.email,
        lastLogin: seller.lastLogin,
        status: seller.status,
        createdAt: seller.createdAt,
        subscription: seller.subscription
          ? {
              _id: seller.subscription._id,
              planName: seller.subscription.planName,
              price: seller.subscription.price,
              duration: seller.subscription.duration,
              features: seller.subscription.features,
            }
          : null,
        subscriptionStartDate: seller.subscriptionStartDate,
        subscriptionFeatures: seller.subscriptionFeatures,
        // Add more seller-specific data here later (e.g., total products, total sales, top products)
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller details",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// Update user role and status
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (role) {
      user.role = role;
    }
    if (status) {
      user.status = status;
    }

    await user.save();

    res.json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// Update user role

// Update shopowner subscription plan and features
export const updateShopownerSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "shopowner") {
      return res.status(404).json({
        success: false,
        message: "Shopowner not found",
      });
    }
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }
    user.subscription = subscriptionId;
    user.subscriptionFeatures = subscription.includedFeatures;
    user.subscriptionStartDate = new Date();
    await user.save();
    res.json({
      success: true,
      message: "Shopowner subscription updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating shopowner subscription",
      error: error.message,
    });
  }
};

// Get full details of a shopowner by ID (for admin)
export const getShopownerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate("subscription");
    if (!user || user.role !== "shopowner") {
      return res
        .status(404)
        .json({ success: false, message: "Shopowner not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch shopowner details",
      error: err.message,
    });
  }
};
