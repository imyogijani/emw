import express from "express";
import {
  createBrandController,
  getAllBrandsController,
  getBrandByIdController,
  updateBrandController,
  deleteBrandController,
  getProductsByBrand,
} from "../controllers/brandController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";
import { restrictDemoAccess } from "../middlewares/demoAccessMiddleware.js";

import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();
router.post(
  "/create",
  authenticateToken,
  restrictDemoAccess,
  fetchUser,
  upload.single("logo"),
  createBrandController
);
router.get("/", getAllBrandsController);
router.get("/products-by-brand/:brandId", getProductsByBrand);
router.get("/:id", getBrandByIdController);
router.put(
  "/:id",
  authenticateToken,
  restrictDemoAccess,
  fetchUser,
  upload.single("logo"),
  updateBrandController
);
router.delete(
  "/:id",
  authenticateToken,
  restrictDemoAccess,
  fetchUser,
  deleteBrandController
);
export default router;
