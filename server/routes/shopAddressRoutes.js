import express from "express";
import {
  addShopAddress,
  updateShopAddress,
  deleteShopAddress,
} from "../controllers/shopAddressController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:sellerId/address", authenticateToken, fetchUser, addShopAddress);
router.patch(
  "/:sellerId/address/:index",
  authenticateToken,
  fetchUser,
  updateShopAddress
);
router.delete(
  "/:sellerId/address/:index",
  authenticateToken,
  fetchUser,
  deleteShopAddress
);

export default router;
