import express from "express";
import { settleOrderPayout } from "../controllers/payoutController.js";
import { createRazorpayBeneficiary } from "../controllers/createRazorpayBeneficiary.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-beneficiary",
  authenticateToken,
  fetchUser,
  createRazorpayBeneficiary
);
// router.post("/settle/:orderId", settleOrderPayout); // Admin only

export default router;
