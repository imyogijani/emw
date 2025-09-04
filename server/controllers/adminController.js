import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
// import Subscription from "../models/subscriptionModel.js";
import Seller from "../models/sellerModel.js";
import Category from "../models/categoryModel.js";
import Settings from "../models/settingsModel.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { State, City } from "../models/locationModel.js";
import admin from "../config/firebaseAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Toggle demo access for seller
export const toggleDemoAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // if (user.role !== "shopowner") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Demo access can only be set for sellers",
    //   });
    // }

    const previousDemoAccess = user.demoAccess;
    user.demoAccess = !user.demoAccess;

    // If demo access is being revoked and user hasn't completed onboarding
    // Reset their onboarding status to require completion
    if (previousDemoAccess && !user.demoAccess && user.role === "shopowner") {
      // Check if seller has actually completed onboarding steps
      const seller = await Seller.findById(user.sellerId);
      if (
        !seller ||
        !seller.shopName ||
        !seller.categories ||
        seller.categories.length === 0
      ) {
        user.isOnboardingComplete = false;
        // Also reset seller onboarding step if seller exists
        if (seller) {
          seller.isOnboardingComplete = false;
          seller.onboardingStep = 1;
          await seller.save();
        }
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Demo access ${
        user.demoAccess ? "enabled" : "disabled"
      } for seller`,
      demoAccess: user.demoAccess,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all sellers with demo status
export const getSellersWithDemoStatus = async (req, res) => {
  try {
    // Query params (defaults: page=1, limit=10)
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // ✅ Fetch ALL users EXCEPT admins
    const users = await User.find({ role: { $ne: "admin" } })
      .select("firstName lastName email demoAccess role status createdAt")
      .populate("sellerId", "shopName")
      .sort({ createdAt: -1 }) // ✅ descending order (latest first)
      .skip(skip)
      .limit(limit);

    // ✅ Total count (excluding admins)
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      users: users.map((user) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role || "N/A",
        status: user.status, // active / inactive / banned
        shopName: user.sellerId?.shopName || "N/A",
        demoAccess: user.demoAccess,
        createdAt: user.createdAt, // optional: show join date
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
        finalPrice: p.finalPrice,
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
    // 1. Get query params for filters & pagination
    const {
      search, // email or name search
      role, // admin, client, shopowner
      page = 1, // default page 1
      limit = 10, // default 10 users per page
    } = req.query;

    // 2. Build filter object
    const filter = {};

    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive search
      filter.$or = [{ email: regex }, { names: regex }, { shopName: regex }];
    }

    if (role) {
      filter.role = role.toLowerCase(); // filter by role
    }

    // 3. Count total documents for pagination
    const totalUsers = await User.countDocuments(filter);

    // 4. Fetch users with filters, populate subscription, and pagination
    const users = await User.find(filter)
      .populate("subscription")
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // 5. Format response with null checks and onboarding status
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.names || user.shopName || "N/A",
      email: user.email || "N/A",
      role: user.role ? user.role.toLowerCase() : "unknown",
      status: user.status || "active",
      createdAt: user.createdAt,
      isOnboardingComplete: user.isOnboardingComplete || false,
    }));

    // 6. Send response
    res.status(200).json({
      success: true,
      users: formattedUsers,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Get incomplete onboarding users
export const getIncompleteOnboardingUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;

    const filter = {
      isOnboardingComplete: { $ne: true },
    };

    if (role) {
      filter.role = role.toLowerCase();
    }

    const totalUsers = await User.countDocuments(filter);

    const users = await User.find(filter)
      .populate("subscription")
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.names || user.shopName || "N/A",
      email: user.email || "N/A",
      role: user.role ? user.role.toLowerCase() : "unknown",
      status: user.status || "active",
      createdAt: user.createdAt,
      isOnboardingComplete: user.isOnboardingComplete || false,
      registrationStatus: user.emailVerified ? "verified" : "pending",
      subscription:
        user.role === "shopowner" && user.subscription
          ? {
              planName: user.subscription.planName,
              _id: user.subscription._id,
            }
          : undefined,
    }));

    res.json({
      success: true,
      totalUsers,
      currentPage: Number(page),
      totalPages: Math.ceil(totalUsers / limit),
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Error fetching incomplete onboarding users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching incomplete onboarding users",
      error: error.message,
    });
  }
};

// Force complete onboarding for a user
export const forceCompleteOnboarding = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isOnboardingComplete = true;
    await user.save();

    res.json({
      success: true,
      message: "Onboarding marked as complete",
      user: {
        _id: user._id,
        name: user.names || user.shopName || "N/A",
        email: user.email,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete,
      },
    });
  } catch (error) {
    console.error("Error forcing onboarding completion:", error);
    res.status(500).json({
      success: false,
      message: "Error updating onboarding status",
      error: error.message,
    });
  }
};

// Reset onboarding for a user
export const resetOnboarding = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isOnboardingComplete = false;
    await user.save();

    res.json({
      success: true,
      message: "Onboarding reset successfully",
      user: {
        _id: user._id,
        name: user.names || user.shopName || "N/A",
        email: user.email,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete,
      },
    });
  } catch (error) {
    console.error("Error resetting onboarding:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting onboarding status",
      error: error.message,
    });
  }
};

// Get onboarding statistics
export const getOnboardingStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const completedOnboarding = await User.countDocuments({
      isOnboardingComplete: true,
    });
    const incompleteOnboarding = await User.countDocuments({
      isOnboardingComplete: { $ne: true },
    });

    // Get stats by role
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$isOnboardingComplete", true] }, 1, 0],
            },
          },
          incomplete: {
            $sum: {
              $cond: [{ $ne: ["$isOnboardingComplete", true] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get recent incomplete users
    const recentIncomplete = await User.find({
      isOnboardingComplete: { $ne: true },
    })
      .select("names email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        completedOnboarding,
        incompleteOnboarding,
        completionRate:
          totalUsers > 0
            ? ((completedOnboarding / totalUsers) * 100).toFixed(2)
            : 0,
        roleStats,
        recentIncomplete: recentIncomplete.map((user) => ({
          _id: user._id,
          name: user.names || "N/A",
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching onboarding stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching onboarding statistics",
      error: error.message,
    });
  }
};

// Delete user
export const getSellerDetails = async (req, res) => {
  try {
    // 1. Find the user
    const sellerUser = await User.findById(req.params.id)
      .populate("subscription")
      .select("-password");

    if (!sellerUser || sellerUser.role !== "shopowner") {
      return res.status(404).json({
        success: false,
        message: "Seller not found or not a shopowner",
      });
    }

    // 2. Find seller table data
    let sellerTable = null;
    if (sellerUser.sellerId) {
      sellerTable = await Seller.findById(sellerUser.sellerId)
        .populate("categories") // optional if you want category details
        .lean();
    }

    // 3. Combine data
    const combinedData = {
      userInfo: {
        _id: sellerUser._id,
        names: sellerUser.names,
        email: sellerUser.email,
        phone: sellerUser.phone,
        status: sellerUser.status,
        lastLogin: sellerUser.lastLogin,
        createdAt: sellerUser.createdAt,
      },
      shopDetails: sellerTable
        ? {
            _id: sellerTable._id,
            shopName: sellerTable.shopName,
            shopImage: sellerTable.shopImage,
            shopImages: sellerTable.shopImages,
            ownerName: sellerTable.ownerName,
            description: sellerTable.description,
            categories: sellerTable.categories,
            location: sellerTable.location,
            shopAddresses: sellerTable.shopAddresses,
            specialist: sellerTable.specialist,
            status: sellerTable.status,
            averageRating: sellerTable.averageRating,
            totalReviews: sellerTable.totalReviews,
            gstNumber: sellerTable.gstNumber,
            kycVerified: sellerTable.kycVerified,
            bankDetails: sellerTable.bankDetails,
          }
        : null,
    };

    // 4. Response
    res.json({
      success: true,
      data: combinedData,
    });
  } catch (error) {
    console.error("Error fetching seller details:", error);
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

    // Step : if shopowner  → Seller details  delete
    if (user.role === "shopowner" && user.sellerId) {
      await Seller.findByIdAndDelete(user.sellerId);

      await Product.updateMany(
        { seller: user.sellerId },
        { $set: { isActive: false } }
      );
    }

    // Handle Firebase user deletion with better error handling
    try {
      const firebaseUser = await admin.auth().getUserByEmail(user.email);
      if (firebaseUser) {
        await admin.auth().deleteUser(firebaseUser.uid);
      }
    } catch (firebaseError) {
      // Don't fail the entire operation if Firebase deletion fails
      console.log(
        "Firebase deletion error (non-critical):",
        firebaseError.message
      );
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

    const oldRole = user.role;

    // 1. Update role if provided
    if (role) {
      user.role = role.toLowerCase();
    }

    // 2. Update status if provided
    if (status) {
      user.status = status.toLowerCase();
    }

    // 3. Handle role transition
    if (oldRole !== user.role) {
      if (user.role === "shopowner") {
        // Client → Shopowner
        let seller;
        if (user.sellerId) {
          // Already has seller record, reactivate it
          seller = await Seller.findByIdAndUpdate(
            user.sellerId,
            { status: "active" },
            { new: true }
          );
        } else {
          // Create new seller record
          seller = await Seller.create({
            user: user._id,
            shopName: `${user.names}'s Shop`,
            ownerName: user.names,
            status: "active",
            shopAddresses: [], // optional: empty array
          });
          user.sellerId = seller._id;
        }
      } else if (oldRole === "shopowner" && user.role === "client") {
        // Shopowner → Client
        if (user.sellerId) {
          await Seller.findByIdAndUpdate(user.sellerId, { status: "inactive" });
        }
      }
    }

    // 4. If user is still shopowner and status updated
    if (user.role === "shopowner" && user.sellerId && status) {
      await Seller.findByIdAndUpdate(user.sellerId, {
        status: status.toLowerCase(),
      });
    }

    // 5. Save the user
    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user,
      shopDetails: user.sellerId ? await Seller.findById(user.sellerId) : null,
    });
  } catch (error) {
    console.error("Error updating user:", error);
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
    // Fetch user and populate sellerId (which contains shopName etc)
    const user = await User.findById(id)
      .populate("subscription")
      .populate({ path: "sellerId", model: "Seller" });
    if (!user || user.role !== "shopowner") {
      return res
        .status(404)
        .json({ success: false, message: "Shopowner not found" });
    }
    // Merge seller fields into response for convenience
    let sellerDetails = null;
    if (user.sellerId) {
      // If populated, sellerId is the seller document
      sellerDetails = user.sellerId.toObject
        ? user.sellerId.toObject()
        : user.sellerId;
    }
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        shopName: sellerDetails?.shopName || null,
        shopImage: sellerDetails?.shopImage || null,
        shopImages: sellerDetails?.shopImages || [],
        ownerName: sellerDetails?.ownerName || null,
        description: sellerDetails?.description || null,
        categories: sellerDetails?.categories || [],
        location: sellerDetails?.location || null,
        shopAddresses: sellerDetails?.shopAddresses || [],
        specialist: sellerDetails?.specialist || [],
        status: sellerDetails?.status || user.status,
        averageRating: sellerDetails?.averageRating || null,
        totalReviews: sellerDetails?.totalReviews || null,
        gstNumber: sellerDetails?.gstNumber || null,
        kycVerified: sellerDetails?.kycVerified || null,
        bankDetails: sellerDetails?.bankDetails || null,
        onboardingStep: sellerDetails?.onboardingStep || null,
        isOnboardingComplete: sellerDetails?.isOnboardingComplete || null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch shopowner details",
      error: err.message,
    });
  }
};

// Location Management Functions

// Get all locations data
export const getAllLocations = async (req, res) => {
  try {
    // Get all states with their cities and areas
    const states = await State.find({ active: true })
      .populate({
        path: "cities",
        match: { active: true },
        select: "name areas",
      })
      .select("name");

    // Transform to legacy format for backward compatibility
    const pincodesData = {};
    let totalCities = 0;
    let totalPincodes = 0;

    for (const state of states) {
      pincodesData[state.name] = {};

      const cities = await City.find({
        state: state._id,
        active: true,
      }).select("name areas");

      for (const city of cities) {
        totalCities++;
        pincodesData[state.name][city.name] = {};

        city.areas.forEach((area) => {
          pincodesData[state.name][city.name][area.name] = area.pincode;
          totalPincodes++;
        });
      }
    }

    const locationStats = {
      totalStates: states.length,
      totalCities,
      totalPincodes,
    };

    res.json({
      success: true,
      data: pincodesData,
      stats: locationStats,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch locations",
    });
  }
};

// Add new state
export const addState = async (req, res) => {
  try {
    const { stateName } = req.body;

    if (!stateName || !stateName.trim()) {
      return res.status(400).json({
        success: false,
        message: "State name is required",
      });
    }

    // Check if state already exists
    const existingState = await State.findOne({
      name: { $regex: `^${stateName.trim()}$`, $options: "i" },
    });

    if (existingState) {
      return res.status(400).json({
        success: false,
        message: "State already exists",
      });
    }

    const newState = new State({
      name: stateName.trim(),
      createdBy: req.user?.id || "admin",
      updatedBy: req.user?.id || "admin",
    });

    await newState.save();

    res.json({
      success: true,
      message: "State added successfully",
      data: { stateName: newState.name, id: newState._id },
    });
  } catch (error) {
    console.error("Error adding state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add state",
    });
  }
};

// Add new city to state
export const addCity = async (req, res) => {
  try {
    const { stateName, cityName } = req.body;

    if (!stateName || !cityName || !stateName.trim() || !cityName.trim()) {
      return res.status(400).json({
        success: false,
        message: "State name and city name are required",
      });
    }

    // Find the state
    const state = await State.findOne({
      name: { $regex: `^${stateName.trim()}$`, $options: "i" },
      active: true,
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // Check if city already exists in this state
    const existingCity = await City.findOne({
      name: { $regex: `^${cityName.trim()}$`, $options: "i" },
      state: state._id,
    });

    if (existingCity) {
      return res.status(400).json({
        success: false,
        message: "City already exists in this state",
      });
    }

    const newCity = new City({
      name: cityName.trim(),
      state: state._id,
      createdBy: req.user?.id || "admin",
      updatedBy: req.user?.id || "admin",
    });

    await newCity.save();

    res.json({
      success: true,
      message: "City added successfully",
      data: { stateName: state.name, cityName: newCity.name, id: newCity._id },
    });
  } catch (error) {
    console.error("Error adding city:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add city",
    });
  }
};

// Delete state
export const deleteState = async (req, res) => {
  try {
    const { stateName } = req.params;

    const state = await State.findOne({
      name: { $regex: `^${stateName}$`, $options: "i" },
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // Soft delete - mark as inactive
    state.active = false;
    state.updatedBy = req.user?.id || "admin";
    await state.save();

    // Also soft delete all cities in this state
    await City.updateMany(
      { state: state._id },
      {
        active: false,
        updatedBy: req.user?.id || "admin",
        updatedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: "State deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete state",
    });
  }
};

// Delete city
export const deleteCity = async (req, res) => {
  try {
    const { stateName, cityName } = req.params;

    // Find the state first
    const state = await State.findOne({
      name: { $regex: `^${stateName}$`, $options: "i" },
      active: true,
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // Find the city
    const city = await City.findOne({
      name: { $regex: `^${cityName}$`, $options: "i" },
      state: state._id,
    });

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    // Soft delete - mark as inactive
    city.active = false;
    city.updatedBy = req.user?.id || "admin";
    await city.save();

    res.json({
      success: true,
      message: "City deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete city",
    });
  }
};

//

// Admin recent orders
export const getAdminOrdersController = async (req, res) => {
  try {
    let { page = 1, limit = 10, filterType, startDate, endDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (!filterType && !startDate && !endDate) {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      query.createdAt = { $gte: date };
    }

    //  Date filtering
    if (filterType === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      query.createdAt = { $gte: today, $lt: tomorrow };
    } else if (filterType === "last7days") {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      query.createdAt = { $gte: date };
    } else if (filterType === "last30days") {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      query.createdAt = { $gte: date };
    } else if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    //  Fetch Orders with Pagination
    const orders = await Order.find(query)
      .populate("userId", "names email")
      .populate("items.sellerId", "shopName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(query);

    //  Format Response
    const formattedOrders = orders.map((order) => ({
      orderId: order.orderId,
      customer: order.userId?.names || "Guest",
      shops: [
        ...new Set(
          order.items.map((item) => item.sellerId?.shopName || "Unknown")
        ),
      ], // unique shop names
      amount: order.totalAmount,
      status: order.orderStatus,
      createdAt: order.createdAt,
    }));

    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// Get admin settings
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    return res.status(200).json({
      success: true,
      settings: {
        emailVerificationEnabled: settings.emailVerificationEnabled,
        customerEmailVerification: settings.customerEmailVerification,
        sellerEmailVerification: settings.sellerEmailVerification,
        maintenanceMode: settings.maintenanceMode,
        allowRegistration: settings.allowRegistration,
        onboardingEnabled: settings.onboardingEnabled,
        onboardingRequiredSteps: settings.onboardingRequiredSteps,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching settings",
      error: error.message,
    });
  }
};

// Update admin settings
export const updateSettings = async (req, res) => {
  try {
    const {
      emailVerificationEnabled,
      customerEmailVerification,
      sellerEmailVerification,
      maintenanceMode,
      allowRegistration,
    } = req.body;

    // Validate input
    const updates = {};
    if (typeof emailVerificationEnabled === "boolean") {
      updates.emailVerificationEnabled = emailVerificationEnabled;
    }
    if (typeof customerEmailVerification === "boolean") {
      updates.customerEmailVerification = customerEmailVerification;
    }
    if (typeof sellerEmailVerification === "boolean") {
      updates.sellerEmailVerification = sellerEmailVerification;
    }
    if (typeof maintenanceMode === "boolean") {
      updates.maintenanceMode = maintenanceMode;
    }
    if (typeof allowRegistration === "boolean") {
      updates.allowRegistration = allowRegistration;
    }

    // If email verification is disabled, disable customer and seller verification too
    if (updates.emailVerificationEnabled === false) {
      updates.customerEmailVerification = false;
      updates.sellerEmailVerification = false;
    }

    const settings = await Settings.updateSettings(updates);

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings: {
        emailVerificationEnabled: settings.emailVerificationEnabled,
        customerEmailVerification: settings.customerEmailVerification,
        sellerEmailVerification: settings.sellerEmailVerification,
        maintenanceMode: settings.maintenanceMode,
        allowRegistration: settings.allowRegistration,
        onboardingEnabled: settings.onboardingEnabled,
        onboardingRequiredSteps: settings.onboardingRequiredSteps,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating settings",
      error: error.message,
    });
  }
};

// Helper function to check if email verification is required for a specific user type
export const isEmailVerificationRequired = async (userType = "customer") => {
  try {
    const settings = await Settings.getSettings();

    if (!settings.emailVerificationEnabled) {
      return false;
    }
    if (userType === "customer" || userType === "client") {
      return settings.customerEmailVerification;
    }

    if (userType === "seller" || userType === "shopowner") {
      return settings.sellerEmailVerification;
    }

    return true; // Default to requiring verification
  } catch (error) {
    console.error("Error checking email verification requirement:", error);
    return true; // Default to requiring verification on error
  }
};
