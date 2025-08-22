import express from "express";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { demoGuard } from "../middlewares/demoGuard.js";
import { restrictDemoAccess } from "../middlewares/demoAccessMiddleware.js";
import {
  addProduct,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  getAllProducts,
  deleteAllProducts,
  getSingleProductById,
  getRelatedProducts,
} from "../controllers/productController.js";

// import { checkIsPremium } from "../middlewares/checkPremium.js";

const router = express.Router();

// Add new product
router.post(
  "/add",
  authenticateToken,
  upload.array("images", 10),
  fetchUser,
  demoGuard,
  restrictDemoAccess,
  addProduct
);

// Get seller's products
router.get("/seller-products", authenticateToken, getSellerProducts);

// Get all products
router.get("/", getAllProducts);

router.get("/related/:productId", getRelatedProducts);

//singleProduct
router.get("/:id", getSingleProductById);

// Update product
router.patch(
  "/:productId",
  authenticateToken,
  fetchUser,
  demoGuard,
  restrictDemoAccess,
  upload.array("images", 10),
  updateProduct
);

// Delete product
router.delete(
  "/:productId",
  authenticateToken,
  fetchUser,
  demoGuard,
  restrictDemoAccess,
  deleteProduct
);

// Delete all products (for testing/admin purposes)
router.delete("/all", authenticateToken, fetchUser, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  // This will be handled by a controller function later
  deleteAllProducts(req, res);
});

export default router;
