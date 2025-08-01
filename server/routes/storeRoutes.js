// routes/storeRoutes.js
import express from "express";
import {
  getAllStores,
  getSingleStore,
  getMyProductsController,
} from "../controllers/storeController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
const router = express.Router();

// GET /api/stores
router.get("/", getAllStores);
router.get("/sellers/:id", getSingleStore); // SellerId
router.get("/my-products", authenticateToken, getMyProductsController);

export default router;
