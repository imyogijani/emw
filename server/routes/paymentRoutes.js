import express from "express";
import {
  initiatePayment,
  verifyPayment,
  // paymentWebhook,
} from "../controllers/paymentController.js";
import { handleRazorpayWebhook } from "../webhooks/razorpayWebhook.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/initiate", authenticateToken, fetchUser, initiatePayment);
router.post("/verify", verifyPayment);

// router.post("/webhook", paymentWebhook);

router.post("/webhook/order", handleRazorpayWebhook);
export default router;
