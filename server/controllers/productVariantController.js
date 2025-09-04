import Variant from "../models/variantsModel.js";
// import Product from "../models/productModel.js";
import path from "path";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import TechnicalDetails from "../models/technicalDetails.js";
import { fileURLToPath } from "url";
import Seller from "../models/sellerModel.js";
import User from "../models/userModel.js";
// import UserSubscription from "../models/userSubscriptionModel.js";
import Brand from "../models/brandModel.js";

//  Create Variant
// controllers/variantController.js

export const createVariant = async (req, res) => {
  try {
    const { color, size, price, stock, productId } = req.body;

    const image = req.file ? `/uploads/products/${req.file.filename}` : null;

    const variant = new Variant({
      productId,
      color,
      size,
      price,
      stock,
      image,
    });

    await variant.save();
    await Product.findByIdAndUpdate(productId, {
      $push: { variants: variant._id },
    });

    res.status(201).json({
      success: true,
      message: "Variant created successfully",
      data: variant,
    });
  } catch (error) {
    console.error("Variant creation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//  Get single Variant
export const getVariant = async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ error: "Variant not found" });
    res.json(variant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Get All Variants of a Product (with Pagination + Filter)
export const getProductVariants = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // current page
  const limit = parseInt(req.query.limit) || 10; // per page limit
  const skip = (page - 1) * limit; // how many to skip

  const { size, color, status } = req.query;

  try {
    const filters = { productId: req.params.productId };

    if (size) filters.size = size;
    if (color) filters.color = color;
    if (status) filters.status = status;

    const total = await Variant.countDocuments(filters);
    const variants = await Variant.find(filters).skip(skip).limit(limit);

    res.json({
      total,
      page,
      totalvariants: variants.length,
      totalPages: Math.ceil(total / limit),
      variants,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Update Variant
export const updateVariant = async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    // Optional fields
    const { color, size, price, stock } = req.body;

    if (color) variant.color = color;
    if (size) variant.size = size;
    if (price) variant.price = price;
    if (stock) variant.stock = stock;

    // If a new image is uploaded
    if (req.file) {
      variant.image = `/uploads/products/${req.file.filename}`;
    }

    const updated = await variant.save();

    res.status(200).json({
      success: true,
      message: "Variant updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//  Delete Variant
export const deleteVariant = async (req, res) => {
  try {
    const deleted = await Variant.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Variant not found" });

    res.json({ message: "Variant deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
