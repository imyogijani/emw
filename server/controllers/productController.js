import fs from "fs";
import path from "path";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import TechnicalDetails from "../models/technicalDetails.js";
import { fileURLToPath } from "url";
import Seller from "../models/sellerModel.js";
import User from "../models/userModel.js";
import UserSubscription from "../models/userSubscriptionModel.js";
import Brand from "../models/brandModel.js";

// import { attachActiveDeals } from "../utils/attachActiveDeals.js";
import { getFeatureLimit } from "../helpers/checkSubscriptionFeature.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discount,
      category,
      subcategory,
      stock,
      status,
      brand,
      variants,
      technicalDetailsId,
      hsnCode,
      hsnCodeSource,
      suggestedHsnCode,
      hsnCodeConfirmed,
      // isPremium,
    } = req.body;

    console.log("Product Req Body Data : ", req.body);

    // Get seller and user info
    const seller = await Seller.findOne({ user: req.userId }).populate(
      "user",
      "email"
    );

    // if (seller.user.email === "demo@seller.com") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Demo account cannot add products.",
    //   });
    // }
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // if ( !seller.bankDetails || !seller.razorpayAccountId) {
    //   return res.status(400).json({
    //     error: "Please complete bank details and KYC before adding products.",
    //   });
    // }

    // Validate category
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ success: false, message: "Invalid category" });
    }

    //  Validate brand
    if (!brand) {
      deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ success: false, message: "Brand is required" });
    }

    const brandDoc = await Brand.findById(brand);
    if (!brandDoc) {
      deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ success: false, message: "Invalid brand selected" });
    }

    let gstPercentage = 0;
    // Validate subcategory
    if (subcategory) {
      const subDoc = await Category.findById(subcategory);

      if (!subDoc) {
        deleteUploadedFiles(req.files);
        return res
          .status(400)
          .json({ success: false, message: "Invalid subcategory" });
      }

      if (seller.kycVerified && seller.gstNumber) {
        gstPercentage = subDoc.gstPercentage || 0;
      }
    }

    let parsedVariants = [];

    if (variants) {
      if (Array.isArray(variants)) {
        parsedVariants = variants;
      } else if (typeof variants === "string") {
        //  Try this case
        try {
          const maybeArray = JSON.parse(variants);
          if (Array.isArray(maybeArray)) {
            parsedVariants = maybeArray;
          } else {
            parsedVariants = [variants]; // fallback to single
          }
        } catch (err) {
          parsedVariants = [variants];
        }
      } else {
        parsedVariants = [variants];
      }
    }

    // console.log("1111", req.userId);

    //  Step : Get ALL active, paid subscriptions for this user
    const userSubs = await UserSubscription.find({
      user: req.userId,
      isActive: true,
      paymentStatus: { $in: ["paid", "free"] },
      endDate: { $gt: new Date() },
    }).populate("subscription");

    // console.log("Seller userSubs  ", userSubs);

    //  If no active subscriptions found
    if (!userSubs || userSubs.length === 0) {
      deleteUploadedFiles(req.files);
      return res.status(403).json({
        success: false,
        message: "No active subscription found. Please purchase a plan.",
      });
    }

    //  Step 2: Combine limits from all subscriptions
    let totalProductLimit = 0;
    let totalProductsUsed = 0;
    let allowPremium = false;

    userSubs.forEach((sub) => {
      // Parse included features from subscription
      const featuresMap = {};
      sub.subscription.includedFeatures.forEach((f) => {
        const [key, value] = f.split(":");
        featuresMap[key] = value ? parseInt(value) : true;
      });

      // Accumulate limits and usage
      totalProductLimit += featuresMap["productLimit"] || 0;
      // totalProductsUsed += sub.featuresUsed?.productsAdded || 0;
      totalProductsUsed += sub.featuresUsed?.get("productsAdded") || 0;

      // If any subscription allows featured listing
      if (featuresMap["featuredListing"] === true) {
        allowPremium = true;
      }
    });

    // console.log(" Subscription Info:");
    // console.log(" totalProductLimit:", totalProductLimit);
    // console.log(" totalProductsUsed:", totalProductsUsed);
    // console.log(" allowPremium:", allowPremium);

    //  Step 3: Validate total product usage
    if (totalProductsUsed >= totalProductLimit) {
      deleteUploadedFiles(req.files);
      return res.status(403).json({
        success: false,
        message: `Product limit (${totalProductLimit}) reached. Upgrade your plan.`,
      });
    }

    // Optional technical details
    let techRef = null;
    if (technicalDetailsId) {
      const tech = await TechnicalDetails.findById(technicalDetailsId);
      if (!tech) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ message: "Invalid technicalDetailsId" });
      }
      techRef = tech._id;
    }

    // Validate images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/products/${file.filename}`);
    } else {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    // Get seller and populate user info
    const userPopulate = await Seller.findOne({ user: req.userId }).populate(
      "user"
    );
    if (!userPopulate)
      return res.status(404).json({ message: "Seller not found" });

    // Extract location from user's address
    let locationData = {};
    if (userPopulate.user && userPopulate.user.address) {
      locationData = {
        city: userPopulate.user.address.city || "",
        state: userPopulate.user.address.state || "",
        country: userPopulate.user.address.country || "",
      };
    } else {
      return res.status(400).json({ message: "User address not found" });
    }

    // Create product
    const product = new Product({
      name,
      description,
      price,
      discount: discount ? Number(discount) : undefined,
      category,
      subcategory,
      stock,
      status,
      brand,
      seller: seller._id,
      image: images,
      variants: parsedVariants,
      technicalDetails: techRef,
      isPremium: allowPremium,
      gstPercentage,
      hsnCode: hsnCode || undefined,
      hsnCodeSource: hsnCodeSource || "manual",
      suggestedHsnCode: suggestedHsnCode || undefined,
      hsnCodeConfirmed: hsnCodeConfirmed || false,
      location: locationData,
    });

    await product.save();

    //  Step 5: Distribute usage to first available subscription
    const subToUpdate = userSubs.find((sub) => {
      const limit = parseInt(
        sub.subscription.includedFeatures
          .find((f) => f.startsWith("productLimit:"))
          ?.split(":")[1] || "0"
      );
      const used = sub.featuresUsed?.productsAdded || 0;
      return used < limit;
    });

    if (subToUpdate) {
      await UserSubscription.findByIdAndUpdate(subToUpdate._id, {
        $inc: { "featuresUsed.productsAdded": 1 },
        $set: { updatedAt: new Date() },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    deleteUploadedFiles(req.files);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const {
      populateCategory,
      page = 1,
      limit = 10,
      status,
      category,
      search,
    } = req.query;

    // Step 1: Find Seller
    const seller = await Seller.findOne({ user: req.userId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found for this user",
      });
    }

    // Step 2: Build query object
    const filter = { seller: seller._id };

    if (status) {
      filter.status = status; // e.g., "In Stock", "Out of Stock"
    }

    if (category) {
      filter.category = category; // category ID
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" }; // case-insensitive search
    }

    // Step 3: Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Step 4: Find products
    let query = Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (populateCategory === "true") {
      query = query.populate("category");
    }

    const products = await query;
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      products,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      price,
      discount,
      category,
      subcategory,
      stock,
      status,
      brand,
      variants,
      technicalDetailsId,
      isPremium,
      hsnCode,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Ownership check for non-admins
    if (
      req.user &&
      req.user.role !== "admin" &&
      product.seller.toString() !== req.userId
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Validate category
    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res
          .status(400)
          .json({ success: false, message: "Category not found" });
      }
      product.category = category;
    }

    // Validate subcategory
    if (subcategory) {
      const subcategoryDoc = await Category.findById(subcategory);
      if (!subcategoryDoc) {
        return res
          .status(400)
          .json({ success: false, message: "Subcategory not found" });
      }
      product.subcategory = subcategory;
    } else if (subcategory === "") {
      product.subcategory = undefined;
    }
    let parsedVariants = [];
    if (variants) {
      if (Array.isArray(variants)) {
        parsedVariants = variants;
      } else if (typeof variants === "string") {
        //  Try this case
        try {
          const maybeArray = JSON.parse(variants);
          if (Array.isArray(maybeArray)) {
            parsedVariants = maybeArray;
          } else {
            parsedVariants = [variants]; // fallback to single
          }
        } catch (err) {
          parsedVariants = [variants];
        }
      } else {
        parsedVariants = [variants];
      }
    }

    if (parsedVariants.length > 0) {
      product.variants = parsedVariants;
    }

    // Handle optional fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (discount !== undefined)
      product.discount = discount === "" ? undefined : Number(discount);
    if (stock !== undefined) product.stock = Number(stock);
    if (status !== undefined) product.status = status;
    // if (brand === "" || brand === null) {
    //   product.brand = undefined;
    // }
    if (brand !== undefined) product.brand = brand === "" ? undefined : brand;
    if (hsnCode !== undefined)
      product.hsnCode = hsnCode === "" ? undefined : hsnCode;

    // Get seller
    const seller = await Seller.findOne({ user: req.userId });
    if (seller.user.email === "demo@seller.com") {
      return res.status(403).json({
        success: false,
        message: "Demo account cannot add products.",
      });
    }
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found" });
    }

    const userSubs = await UserSubscription.find({
      user: req.userId,
      isActive: true,
      paymentStatus: "paid",
      endDate: { $gt: new Date() },
    }).populate("subscription");

    // console.log("Seller userSubs  ", userSubs);

    //  If no active subscriptions found
    if (!userSubs || userSubs.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No active subscription found. Please purchase a plan.",
      });
    }

    // Handle technicalDetails
    if (technicalDetailsId) {
      const detail = await TechnicalDetails.findById(technicalDetailsId);
      if (!detail) {
        return res.status(400).json({ message: "Invalid technicalDetailsId" });
      }
      product.technicalDetails = detail._id;
    } else if (req.body.technicalDetails) {
      const { findOrCreateTechnicalDetails } = await import(
        "../helpers/compareTechnicalDetails.js"
      );
      const { doc } = await findOrCreateTechnicalDetails(
        JSON.parse(req.body.technicalDetails)
      );
      product.technicalDetails = doc._id;
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(
        (file) => `/uploads/products/${file.filename}`
      );
      product.image = newImages;
    }

    // Save updated product
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      populateCategory,
      populateSubcategory,
      categoryId,
      brand,
      search = "",
      sortBy = "createdAt",
      order = "desc",
      minPrice = 0,
      maxPrice = 9999999,
      page = 1,
      limit = 10,
    } = req.query;

    // console.log("Query Params:", req.query);
    // console.log("Logged-in User ID:", req.userId);

    // Get logged-in user

    // const user = await User.findById(req.userId);

    // If user has a city in address, filter products by that city

    //  1. Dynamic Filters
    const filter = {
      price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
      isActive: true,
    };

    // . If user is NOT a shopowner, filter by city
    // if (user?.role === "client" && user?.address?.city) {
    //   filter["locations.city"] = user.address.city;
    // }

    if (categoryId && categoryId !== "undefined" && categoryId !== "") {
      filter.category = categoryId;
    }

    if (brand && brand !== "undefined" && brand !== "") {
      filter.brand = brand;
    }

    //  2. Search Filter
    if (search && search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { desc: { $regex: search, $options: "i" } },
      ];
    }

    //  3. Sorting
    const sortOptions = {
      price: "finalPrice",
      rating: "averageRating",
      reviews: "totalReviews",
      createdAt: "createdAt",
    };

    const sortField = sortOptions[sortBy] || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    // console.log("Sorting by:", sortField, "Order:", sortOrder);

    //  4. Query + Sorting
    let query = Product.find(filter).sort({ [sortField]: sortOrder });

    //  5. Populate
    if (populateCategory === "true") {
      query = query.populate("category");
    }
    if (populateSubcategory === "true") {
      query = query.populate("subcategory");
    }
    query = query.populate("variants").populate({
      path: "activeDeal",
      match: { _id: { $ne: null } }, // OR use more filter like startDate
    });
    //  6. Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query.skip(skip).limit(parseInt(limit));

    //7. Execute Query
    const products = await query;
    const totalProducts = await Product.countDocuments(filter);

    // const updatedProducts = await attachActiveDeals(products);

    // 8. Response
    res.status(200).json({
      success: true,
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching all products",
      error: error.message,
    });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Step 1: Get the current product to find its category
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Step 2: Count total related products in same category (excluding current)
    const totalRelated = await Product.countDocuments({
      category: currentProduct.category,
      _id: { $ne: productId },
    });

    // Step 3: Fetch related products with pagination
    const relatedProducts = await Product.find({
      category: currentProduct.category,
      _id: { $ne: productId },
    })
      .skip(skip)
      .limit(limit)
      .populate("category subcategory")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products: relatedProducts,
      totalProducts: totalRelated,
      totalPages: Math.ceil(totalRelated / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching related products",
      error: error.message,
    });
  }
};

export const getSingleProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category", "name")
      .populate("subcategory", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product details",
      error: error.message,
    });
  }
};

export const deleteAllProducts = async (req, res) => {
  try {
    // Ensure only admin can delete all products
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    await Product.deleteMany({});
    res.status(200).json({
      success: true,
      message: "All products deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting all products:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting all products",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOneAndDelete({
      _id: productId,
      seller: req.userId,
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

const deleteUploadedFiles = (files) => {
  if (!files || files.length === 0) return;
  files.forEach((file) => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path); // delete file
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  });
};
