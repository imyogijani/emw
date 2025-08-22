import express from "express";
import {
  addShopAddress,
  updateShopAddress,
  deleteShopAddress,
} from "../controllers/shopAddressController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";
import { demoGuard } from "../middlewares/demoGuard.js";

const router = express.Router();

router.post(
  "/:sellerId/address",
  authenticateToken,
  fetchUser,
  demoGuard,
  addShopAddress
);
router.patch(
  "/:sellerId/address/:index",
  authenticateToken,
  fetchUser,
  demoGuard,
  updateShopAddress
);
router.delete(
  "/:sellerId/address/:index",
  authenticateToken,
  fetchUser,
  demoGuard,
  deleteShopAddress
);

export default router;
