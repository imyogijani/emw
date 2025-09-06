import express from "express";
import {
  getAttributesBySubCategory,
  createOrUpdateAttributeRule,
  getAttributeRule,
} from "../controllers/attributeController.js";

import {
  authenticateToken,
  fetchUser,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();
// Admin routes
router.post(
  "/admin",
  authenticateToken,
  authorizeAdmin,
  createOrUpdateAttributeRule
);
router.get(
  "/admin/:subCategoryId",
  authenticateToken,
  authorizeAdmin,
  getAttributeRule
);

// Seller route
router.get("/:subCategoryId", authenticateToken, getAttributesBySubCategory);

export default router;
