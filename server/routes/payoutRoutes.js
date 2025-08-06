import express from "express";
import { settleOrderPayout } from "../controllers/payoutController.js";
import { createSellerSubAccount } from "../controllers/createRazorpayBeneficiary.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-beneficiary",
  authenticateToken,
  fetchUser,
  createSellerSubAccount
);
// router.post("/settle/:orderId", settleOrderPayout); // Admin only

export default router;
