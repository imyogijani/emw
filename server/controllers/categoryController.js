/* eslint-disable no-prototype-builtins */
import Category from "../models/categoryModel.js";
import slugify from "slugify";
import fs from "fs";
import path from "path";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

// Create Category
export const createCategoryController = async (req, res) => {
  try {
    console.log("[DEBUG] req.body:", req.body);
    console.log("[DEBUG] req.file:", req.file);
    let { name, parent, brands } = req.body;
    let image = "";
    if (req.file) {
      console.log("Category image upload:", req.file);
      image = `/uploads/categories/${req.file.filename}`;
    } else {
      console.log("[DEBUG] No file received for category image upload");
    }
    if (!name) {
      return res.status(400).send({ message: "Name is required" });
    }
    if (typeof brands === "string") {
      try {
        brands = JSON.parse(brands);
      } catch (err) {
        console.log("[DEBUG] Invalid brands format:", brands);
        return res.status(400).json({ message: "Invalid brands format" });
      }
    }

    // Validate at least 1 brand if subcategory
    if (parent && (!brands || brands.length < 1)) {
      return res
        .status(400)
        .json({ message: "Subcategory requires at least 1 brand" });
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(409).send({ message: "Category already exists" });
    }
    const category = await new Category({
      name,
      slug: slugify(name),
      parent: parent || null,
      image,
      brands: brands || [],
    });

    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (parentCategory) {
        parentCategory.children.push(category._id);
        await parentCategory.save();
      }
    }
    await category.save();
    res.status(201).send({
      success: true,
      message: "New category created",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating category",
    });
  }
};

// Get all categories
export const categoryController = async (req, res) => {
  try {
    const categories = await Category.find({ parent: null }).populate({
      path: "children",
      populate: { path: "children" },
    });
    res.status(200).send({
      success: true,
      message: "All Categories List",
      categories,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  }
};

// // Get subcategories
// export const getSubcategoriesController = async (req, res) => {
//   try {
//     const { parentId } = req.params;
//     const subcategories = await Category.find({ parent: parentId }).populate(
//       "children"
//     );
//     res.status(200).send({
//       success: true,
//       message: "Subcategories retrieved successfully",
//       subcategories,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       error,
//       message: "Error while getting subcategories",
//     });
//   }
// };

// Get subcategories with brand names
export const getSubcategoriesController = async (req, res) => {
  try {
    const { parentId } = req.params;

    // Fetch subcategories and populate brands
    const subcategories = await Category.find({ parent: parentId })
      .populate("brands", "name _id") // Only name and _id from Brand
      .populate("children"); // Optional: if you want nested children again

    res.status(200).send({
      success: true,
      message: "Subcategories with brands retrieved successfully",
      subcategories,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting subcategories",
    });
  }
};

// Single category
export const singleCategoryController = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate(
      "parent"
    );
    res.status(200).send({
      success: true,
      message: "Get Single Category Successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting Single Category",
    });
  }
};

// Delete category
export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryToDelete = await Category.findById(id);

    if (!categoryToDelete) {
      return res.status(404).send({ message: "Category not found" });
    }

    // Remove from parent's children array if it has a parent
    if (categoryToDelete.parent) {
      const parentCategory = await Category.findById(categoryToDelete.parent);
      if (parentCategory) {
        parentCategory.children.pull(id);
        await parentCategory.save();
      }
    }

    // Recursively delete children categories
    const deleteChildren = async (categoryId) => {
      const children = await Category.find({ parent: categoryId });
      for (const child of children) {
        await deleteChildren(child._id);
        await Category.findByIdAndDelete(child._id);
      }
    };

    await deleteChildren(id);
    await Category.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "Category Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting category",
      error,
    });
  }
};

// Update category
export const updateCategoryController = async (req, res) => {
  try {
    const { name, parent, brands } = req.body;
    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name);
    }
    if (typeof parent !== "undefined") {
      updateData.parent = parent;
    }
    if (brands !== undefined) {
      updateData.brands = brands;
    }
    let oldImagePath = null;
    if (req.file) {
      // Find the current category to get the old image path
      const currentCategory = await Category.findById(req.params.id);
      if (currentCategory && currentCategory.image) {
        oldImagePath = path.join(
          path.resolve(),
          "backend/public",
          currentCategory.image.startsWith("/")
            ? currentCategory.image
            : `/${currentCategory.image}`
        );
      }
      // FIX: Use correct path for frontend
      updateData.image = `/uploads/categories/${req.file.filename}`;
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    // Delete old image file if a new one was uploaded
    if (req.file && oldImagePath && fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (err) {
        // Ignore error
        console.error("Error deleting old image:", err);
      }
    }
    res.status(200).send({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error updating category",
      error,
    });
  }
};

// Get all categories with shop count
export const categoriesWithShopCountController = async (req, res) => {
  try {
    // Get all top-level categories
    const categories = await Category.find({ parent: null }).populate({
      path: "children",
      populate: { path: "children" },
    });

    // Get all products with category and seller
    const products = await Product.find({}, "category seller");

    // Map: categoryId -> Set of sellerIds
    const categoryShopMap = {};
    products.forEach((product) => {
      const catId = product.category?.toString();
      const sellerId = product.seller?.toString();
      if (catId && sellerId) {
        if (!categoryShopMap[catId]) categoryShopMap[catId] = new Set();
        categoryShopMap[catId].add(sellerId);
      }
    });

    // Helper to add shopCount recursively
    function addShopCount(cat) {
      const shopCount = categoryShopMap[cat._id.toString()]?.size || 0;
      const children = cat.children?.map(addShopCount) || [];
      return {
        ...cat.toObject(),
        shopCount,
        children,
      };
    }

    const categoriesWithShopCount = categories.map(addShopCount);

    res.status(200).send({
      success: true,
      message: "All Categories with Shop Count",
      categories: categoriesWithShopCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting categories with shop count",
    });
  }
};
