import express from "express";
import {
  upsertShopTiming,
  getShopTiming,
  deleteShopTiming,
  updateShopTiming,
} from "../controllers/shopTimingController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create or update shop timing for seller
router.post("/:sellerId", authenticateToken, fetchUser, upsertShopTiming);

// Get shop timing
router.get("/:sellerId", authenticateToken, fetchUser, getShopTiming);

router.patch("/:sellerId", authenticateToken, fetchUser, updateShopTiming);

// Delete shop timing
router.delete("/:sellerId", authenticateToken, fetchUser, deleteShopTiming);

export default router;
