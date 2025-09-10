import Brand from "../models/brandModel.js";
import fs from "fs";
import path from "path";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
// import Product from "../models/productModel.js";

export const createBrandController = async (req, res) => {
  try {
    const { name, description } = req.body;
    let logo = "";

    if (!name) return res.status(400).json({ message: "Brand name required" });

    // Handle logo upload
    if (req.file) {
      logo = `/uploads/brands/${req.file.filename}`;
    }

    const existing = await Brand.findOne({ name });
    if (existing)
      return res.status(409).json({ message: "Brand already exists" });

    const brand = new Brand({ name, logo, description });
    await brand.save();

    res.status(201).json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllBrandsController = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, brands });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getBrandByIdController = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    res.status(200).json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateBrandController = async (req, res) => {
  try {
    const { name, description } = req.body;
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    if (req.file) {
      if (brand.logo) {
        const filePath = path.join("public", brand.logo);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      brand.logo = `/uploads/brands/${req.file.filename}`;
    }

    brand.name = name || brand.name;
    brand.description = description || brand.description;

    await brand.save();
    res.status(200).json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteBrandController = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    if (brand.logo) {
      const filePath = path.join("public", brand.logo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Brand.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Brand deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getProductsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    // console.log("👉 brandId received:", brandId);

    // 1. Find subcategories with this brand
    const subcategories = await Category.find({ brands: brandId });
    // console.log(" Subcategories found:", subcategories.length);

    // 2. Extract subcategory IDs
    const subcategoryIds = subcategories.map((sub) => sub._id.toString());
    // console.log(" Subcategory IDs:", subcategoryIds);

    if (subcategoryIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subcategories found for this brand",
      });
    }

    // 3. Find products with subcategory in those IDs
    const products = await Product.find({
      subcategory: { $in: subcategoryIds },
    })
      .populate("subcategory")
      .populate("category")
      .populate("technicalDetails")
      .populate("seller");

    // console.log("📦 Products found:", products.length);

    res.status(200).json({
      success: true,
      brandId,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("❌ Error in getProductsByBrand:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products by brand",
    });
  }
};

export const getFilteredProducts = async (req, res) => {
  try {
    const { categoryId, subcategoryId, brandId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // 🔍 Build query object
    const query = {};
    if (categoryId) query.category = categoryId;
    if (subcategoryId) query.subcategory = subcategoryId;
    if (brandId) query.brand = brandId;

    // 📦 Find matching products with pagination
    const products = await Product.find(query)
      .populate("category")
      .populate("subcategory")
      .populate("brand")
      .populate("technicalDetails")
      .populate("seller")
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("❌ Error in getFilteredProducts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching filtered products",
    });
  }
};

export const getSubcategoryWithBrands = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    // 1. Subcategory find karo aur uske brands populate karo
    const subcategory = await Category.findById(subcategoryId).populate(
      "brands"
    );

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).json({
      success: true,
      subcategory: {
        id: subcategory._id,
        name: subcategory.name,
        brands: subcategory.brands.map((brand) => ({
          id: brand._id,
          name: brand.name,
          logo: brand.logo,
          description: brand.description,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error in getSubcategoryWithBrands:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching subcategory with brands",
    });
  }
};
