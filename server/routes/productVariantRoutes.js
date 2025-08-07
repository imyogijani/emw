import express from "express";
import {
  createVariant,
  getVariant,
  getProductVariants,
  updateVariant,
  deleteVariant,
} from "../controllers/productVariantController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/add", authenticateToken, upload.single("image"), createVariant);
router.get("/:id", getVariant); //  fixed
router.get("/product/:productId", getProductVariants); //  fixed
router.patch("/:id", upload.single("image"), updateVariant);
router.delete("/:id", deleteVariant);

//product

// //add product :
// router.post("/product/add", authenticateToken, upload.array("images", 10), addProduct);

// // Update product
// router.patch(
//   "/:productId",
//   authenticateToken,
//   upload.array("images", 10),
//   updateProduct
// );

// // Delete product
// router.delete("/product/:productId", authenticateToken, deleteProduct);

// // Delete all products (for testing/admin purposes)
// router.delete("/product/all", authenticateToken, (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ message: "Access denied. Admins only." });
//   }
//   // This will be handled by a controller function later
//   deleteAllProducts(req, res);
// });

export default router;
