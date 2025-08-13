import express from "express";
import {
  createCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
  updateCategoryController,
  getSubcategoriesController,
  categoriesWithShopCountController,
  getHsnSuggestionsController,
} from "../controllers/categoryController.js";
import { getGSTRateByHSN } from "../controllers/hsnController.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// routes
// Create Category
router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  upload.single("image"),
  createCategoryController
);

// Create Subcategory
router.post(
  "/subcategory",
  authenticateToken,
  authorizeAdmin,
  upload.single("image"),
  createCategoryController
);

// Update Category
router.put(
  "/update-category/:id",
  authenticateToken,
  authorizeAdmin,
  updateCategoryController
);

// Add this POST route for file upload updates
router.post(
  "/update-category/:id",
  authenticateToken,
  authorizeAdmin,
  upload.single("image"),
  updateCategoryController
);

// Get All Categories
router.get("/get-category", categoryController);

//get all subcategory
router.get("/get-sub-category/:parentId", getSubcategoriesController);

// Single Category
router.get("/single-category/:slug", singleCategoryController);

// Delete Category
router.delete(
  "/delete-category/:id",
  authenticateToken,
  authorizeAdmin,
  deleteCategoryController
);

// Get all categories with shop count
router.get("/get-category-with-shop-count", categoriesWithShopCountController);

// Get HSN suggestions for category/subcategory
router.get("/hsn-suggestions", getHsnSuggestionsController);

// Get GST rate by HSN code
router.get("/gst-rate/:hsnCode", getGSTRateByHSN);

export default router;
