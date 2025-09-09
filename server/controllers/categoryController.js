/* eslint-disable no-prototype-builtins */
import Category from "../models/categoryModel.js";
import CategoryImage from "../models/categoryImageModel.js";
import slugify from "slugify";
import fs from "fs";
import path from "path";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import Brand from "../models/brandModel.js";

// Create Category
export const createCategoryController = async (req, res) => {
  try {
    // console.log("[DEBUG] req.body:", req.body);
    // console.log("[DEBUG] req.file:", req.file);
    let { name, parent, brands, suggestedHsnCodes, defaultHsnCode } = req.body;
    // Convert gstPercentage to number if string

    // if (gstPercentage) {
    //   gstPercentage = Number(gstPercentage) || 0;
    // }

    let image = "";
    let imageId = null;

    if (req.file && req.imageRecord) {
      console.log("Category image upload:", req.file);
      image = req.imageRecord.url;
      imageId = req.imageRecord._id;

      // Update the image record with category ID after category is created
      // This will be done after category creation
    } else if (req.file) {
      // Fallback to old method if database save failed
      console.log("Category image upload (fallback):", req.file);
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

    // Create category data object
    const categoryData = {
      name,
      slug: slugify(name),
      parent: parent || null,
      image,
      brands: brands || [],
    };

    // Only add HSN codes for subcategories (when parent exists)
    // if (parent) {
    //   // Parse suggestedHsnCodes if it's a string
    //   if (typeof suggestedHsnCodes === "string") {
    //     try {
    //       suggestedHsnCodes = JSON.parse(suggestedHsnCodes);
    //     } catch (err) {
    //       suggestedHsnCodes = [];
    //     }
    //   }
    //   categoryData.suggestedHsnCodes = suggestedHsnCodes || [];
    //   categoryData.defaultHsnCode = defaultHsnCode || "";
    // }

    const category = await new Category(categoryData);

    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (parentCategory) {
        parentCategory.children.push(category._id);
        await parentCategory.save();
      }
    }

    // if (parent && (!defaultHsnCode || defaultHsnCode.trim() === "")) {
    //   return res
    //     .status(400)
    //     .json({ message: "HSN code is required for subcategories" });
    // }

    // //  GST check for subcategory
    // if (parent && gstPercentage === 0) {
    //   return res.status(400).json({
    //     message: "GST percentage is required for subcategories",
    //   });
    // }

    await category.save();

    // Update image record with category ID if image was uploaded

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

    // Enhance categories with image information from database
    const enhancedCategories = await Promise.all(
      categories.map(async (category) => {
        const categoryObj = category.toObject();

        // Get image from database
        const categoryImage = await CategoryImage.findOne({
          categoryId: category._id,
          isActive: true,
        }).sort({ createdAt: -1 });

        if (categoryImage) {
          categoryObj.imageInfo = {
            id: categoryImage._id,
            originalName: categoryImage.originalName,
            url: categoryImage.url,
            metadata: categoryImage.metadata,
          };
        }

        // Enhance children with image info too
        if (categoryObj.children && categoryObj.children.length > 0) {
          categoryObj.children = await Promise.all(
            categoryObj.children.map(async (child) => {
              const childImage = await CategoryImage.findOne({
                categoryId: child._id,
                isActive: true,
              }).sort({ createdAt: -1 });

              if (childImage) {
                child.imageInfo = {
                  id: childImage._id,
                  originalName: childImage.originalName,
                  url: childImage.url,
                  metadata: childImage.metadata,
                };
              }

              return child;
            })
          );
        }

        return categoryObj;
      })
    );

    res.status(200).send({
      success: true,
      message: "All Categories List",
      categories: enhancedCategories,
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
    const {
      name,
      parent,
      brands,
      gstPercentage,
      suggestedHsnCodes,
      defaultHsnCode,
    } = req.body;
    console.log("[DEBUG] Update Category Request Body:", req.body);
    console.log("[DEBUG] req.file:", req.file);
    // First, get the current category to check if it's a subcategory
    const currentCategory = await Category.findById(req.params.id);
    if (!currentCategory) {
      return res.status(404).send({ message: "Category not found" });
    }

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
    if (typeof gstPercentage !== "undefined") {
      updateData.gstPercentage = gstPercentage;
    }

    // Only handle HSN codes for subcategories (categories with parent)
    // if (currentCategory.parent || parent) {
    //   if (suggestedHsnCodes !== undefined) {
    //     updateData.suggestedHsnCodes = Array.isArray(suggestedHsnCodes)
    //       ? suggestedHsnCodes
    //       : [];
    //   }
    //   if (typeof defaultHsnCode !== "undefined") {
    //     updateData.defaultHsnCode = defaultHsnCode;
    //   }
    // }

    let oldImagePath = null;
    if (req.file) {
      if (currentCategory.image) {
        oldImagePath = path.join(
          path.resolve(),
          "backend/public",
          currentCategory.image.startsWith("/")
            ? currentCategory.image
            : `/${currentCategory.image}`
        );
      }
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

// Update SubCategory
export const updateSubCategoryController = async (req, res) => {
  try {
    const { name, parent, brands, gstPercentage } = req.body;

    const subCategory = await Category.findById(req.params.id);
    if (!subCategory) {
      return res
        .status(404)
        .json({ success: false, message: "SubCategory not found" });
    }

    const updateData = {};

    //  Name & Slug
    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "SubCategory name must be at least 2 characters long",
        });
      }

      const existing = await Category.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "SubCategory with this name already exists",
        });
      }

      updateData.name = name.trim();
      updateData.slug = slugify(name, { lower: true });
    }

    //  Parent (move subcategory to another category or unlink)
    if (typeof parent !== "undefined") {
      if (parent === "") {
        updateData.parent = null; // unlink
      } else {
        if (!mongoose.Types.ObjectId.isValid(parent)) {
          return res.status(400).json({
            success: false,
            message: "Invalid parent category ID",
          });
        }
        if (parent === req.params.id) {
          return res.status(400).json({
            success: false,
            message: "A subcategory cannot be its own parent",
          });
        }

        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: "Parent category not found",
          });
        }

        updateData.parent = parent;
      }
    }

    // 4. Brands validation
    if (brands !== undefined) {
      if (!Array.isArray(brands)) {
        return res.status(400).json({
          success: false,
          message: "Brands must be an array",
        });
      }

      let brandIds = [];

      for (let b of brands) {
        // Check if passed value is an ObjectId
        if (mongoose.Types.ObjectId.isValid(b)) {
          const brandExists = await Brand.findById(b);
          if (!brandExists) {
            return res.status(400).json({
              success: false,
              message: `Brand not found with ID: ${b}`,
            });
          }
          brandIds.push(b);
        } else {
          // Treat it as a name instead of ID
          const brandByName = await Brand.findOne({ name: b.trim() });
          if (!brandByName) {
            return res.status(400).json({
              success: false,
              message: `Brand not found with name: ${b}`,
            });
          }
          brandIds.push(brandByName._id);
        }
      }

      updateData.brands = brandIds;
    }

    //  GST %
    if (typeof gstPercentage !== "undefined") {
      const gst = Number(gstPercentage);
      if (isNaN(gst) || gst < 0 || gst > 50) {
        return res.status(400).json({
          success: false,
          message: "GST percentage must be between 0 and 50",
        });
      }
      updateData.gstPercentage = gst;
    }

    //  Handle Image Upload
    let oldImagePath = null;
    if (req.file) {
      if (subCategory.image) {
        oldImagePath = path.join(
          path.resolve(),
          "backend/public",
          subCategory.image.startsWith("/")
            ? subCategory.image
            : `/${subCategory.image}`
        );
      }
      updateData.image = `/uploads/categories/${req.file.filename}`;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate("parent")
      .populate("brands");

    //  Delete old image if replaced
    if (req.file && oldImagePath && fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }

    return res.status(200).json({
      success: true,
      message: "SubCategory updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update SubCategory Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating subcategory",
      error: error.message,
    });
  }
};

// Get HSN suggestions for subcategory only (more precise)
export const getHsnSuggestionsController = async (req, res) => {
  try {
    const { subcategoryId } = req.query;

    let suggestions = [];
    let defaultHsn = "";

    // Only fetch HSN codes from subcategory for better precision
    if (subcategoryId) {
      const subcategory = await Category.findById(subcategoryId);
      if (subcategory) {
        suggestions = subcategory.suggestedHsnCodes || [];
        defaultHsn = subcategory.defaultHsnCode || "";
      }
    }

    res.status(200).json({
      success: true,
      suggestedHsnCodes: suggestions,
      defaultHsnCode: defaultHsn,
      source: "subcategory",
    });
  } catch (error) {
    console.error("Error fetching HSN suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching HSN suggestions",
      error: error.message,
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
