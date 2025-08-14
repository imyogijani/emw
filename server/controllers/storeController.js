import Seller from "../models/sellerModel.js";
// import Store from "../models/sellerModel.js";
import Product from "../models/productModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

// GET http://localhost:5000/api/stores?search=nike&status=active&category=689b0d5b618f8de921c1a1f7&sort=mostRated&order=desc&page=2&limit=5

export const getAllStores = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      search = "",
      status,
      category,
    } = req.query;

    const matchStage = {};

    if (search) {
      matchStage.$or = [
        { shopName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      matchStage.status = status;
    }

    if (category) {
      matchStage.categories = mongoose.Types.ObjectId(category);
    }

    const skip = (page - 1) * limit;
    // const sortOrder = order === "asc" ? 1 : -1;
    let sortStage = {};

    // Sorting options
    switch (sort) {
      case "mostRated":
        sortStage = { averageRating: order === "asc" ? 1 : -1 };
        break;
      case "topReviews":
        sortStage = { totalReviews: order === "asc" ? 1 : -1 };
        break;
      case "highestProducts":
        sortStage = { totalProducts: order === "asc" ? 1 : -1 };
        break;
      case "shopName":
        sortStage = { shopName: order === "asc" ? 1 : -1 };
        break;
      default:
        sortStage = { createdAt: order === "asc" ? 1 : -1 };
    }

    const stores = await Seller.aggregate([
      { $match: matchStage },

      // Join user (owner) info with selected fields only
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },

      {
        $lookup: {
          from: "products",
          localField: "_id", // Seller ID
          foreignField: "seller",
          as: "products",
        },
      },

      // Count products
      {
        $addFields: {
          totalProducts: { $size: "$products" },
        },
      },

      // Clean up final output
      {
        $project: {
          shopName: 1,
          shopImage: 1,
          shopImages: 1,
          location: 1,
          categories: 1,
          description: 1,
          ownerName: 1,
          specialist: 1,
          status: 1,
          createdAt: 1,
          averageRating: 1,
          totalReviews: 1,
          totalProducts: 1,
          "owner.name": "$owner.names",
          "owner.email": "$owner.email",
          "owner.phone": "$owner.phone",
          "owner.address": "$owner.address",
        },
      },

      // { $sort: { [sort]: sortOrder } },

      { $sort: sortStage },
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    const totalStores = await Seller.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      totalStores,
      currentPage: Number(page),
      totalPages: Math.ceil(totalStores / limit),
      stores,
    });
  } catch (error) {
    console.error("Error in getAllStores:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stores",
      error: error.message,
    });
  }
};

export const getSingleStore = async (req, res) => {
  try {
    const { id } = req.params; // seller._id
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 1. Get Seller Info with its Owner (User)
    const seller = await Seller.findById(id)
      .populate({
        path: "user",
        select: "names email phone", // just show needed user fields
      })
      .lean();

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // 2. Count and Fetch All Products for this Seller
    const totalProducts = await Product.countDocuments({ seller: seller._id });

    const products = await Product.find({ seller: seller._id })
      .select(
        "name price discount image averageRating totalReviews stock status createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalProducts / limit);

    // 3. Send Final Response
    return res.json({
      success: true,
      store: {
        _id: seller._id,
        shopName: seller.shopName,
        shopImage: seller.shopImage,
        shopImages: seller.shopImages || [],
        address: seller.user?.address || "",
        location: seller.location,
        categories: seller.categories,
        description: seller.description,
        ownerName: seller.ownerName,
        specialist: seller.specialist,
        status: seller.status,
        createdAt: seller.createdAt,
        averageRating: parseFloat((seller.averageRating || 0).toFixed(1)),
        totalReviews: seller.totalReviews || 0,
        owner: {
          name: seller.user?.names || "",
          email: seller.user?.email || "",
          phone: seller.user?.phone || "",
        },
        totalProducts,
      },
      products: {
        items: products,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get single store error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching store.",
    });
  }
};

export const getMyProductsController = async (req, res) => {
  try {
    const userId = req.userId; // from requireSignIn middleware

    // 1. Validate user
    const user = await userModel.findById(userId);
    if (!user || user.role !== "shopowner") {
      return res.status(403).json({
        success: false,
        message: "Only shopowners can access this route.",
      });
    }

    // 2. Find associated seller
    const seller = await Seller.findOne({ user: user._id });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    // 3. Get query params
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;

    // 4. Build filter
    const filter = {
      seller: seller._id,
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status; // Must be one of: In Stock, Low Stock, Out of Stock
    }

    // 5. Count total
    const totalProducts = await Product.countDocuments(filter);

    // 6. Fetch products
    const products = await Product.find(filter)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .select(
        "name price discount finalPrice stock image status averageRating totalReviews createdAt"
      )
      .lean();

    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      totalProducts,
      currentPage: Number(page),
      totalPages,
      products,
    });
  } catch (error) {
    console.error("Error in getMyProductsController:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

