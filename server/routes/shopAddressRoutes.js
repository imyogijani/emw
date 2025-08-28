import express from "express";
import {
  addShopAddress,
  updateShopAddress,
  deleteShopAddress,
} from "../controllers/shopAddressController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";
import { demoGuard } from "../middlewares/demoGuard.js";
import { checkOnboardingSettings } from "../middlewares/onboardingMiddleware.js";

const router = express.Router();

router.post(
  "/:sellerId/address",
  authenticateToken,
  fetchUser,
  demoGuard,
  checkOnboardingSettings,
  addShopAddress
);
router.patch(
  "/:sellerId/address/:index",
  authenticateToken,
  fetchUser,
  demoGuard,
  checkOnboardingSettings,
  updateShopAddress
);
router.delete(
  "/:sellerId/address/:index",
  authenticateToken,
  fetchUser,
  demoGuard,
  checkOnboardingSettings,
  deleteShopAddress
);

export default router;
