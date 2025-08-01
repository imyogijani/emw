import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
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
router.post("/add", authenticateToken, upload.array("images", 10), addProduct);

// Get seller's products
router.get("/seller-products", authenticateToken, getSellerProducts);

// Update product
router.patch(
  "/:productId",
  authenticateToken,
  upload.array("images", 10),
  updateProduct
);

// Get all products
router.get("/", getAllProducts);

router.get("/related/:productId", getRelatedProducts);

//singleProduct
router.get("/:id", getSingleProductById);

// Delete product
router.delete("/:productId", authenticateToken, deleteProduct);

// Delete all products (for testing/admin purposes)
router.delete("/all", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  // This will be handled by a controller function later
  deleteAllProducts(req, res);
});

export default router;
