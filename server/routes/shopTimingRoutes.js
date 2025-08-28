import express from "express";
import {
  upsertShopTiming,
  getShopTiming,
  deleteShopTiming,
  updateShopTiming,
} from "../controllers/shopTimingController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";
import { checkOnboardingSettings } from "../middlewares/onboardingMiddleware.js";

const router = express.Router();

// Create or update shop timing for seller
router.post("/:sellerId", authenticateToken, fetchUser, checkOnboardingSettings, upsertShopTiming);

// Get shop timing
router.get("/:sellerId", authenticateToken, fetchUser, getShopTiming);

router.patch("/:sellerId", authenticateToken, fetchUser, checkOnboardingSettings, updateShopTiming);

// Delete shop timing
router.delete("/:sellerId", authenticateToken, fetchUser, checkOnboardingSettings, deleteShopTiming);

export default router;
