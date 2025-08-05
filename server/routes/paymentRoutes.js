import express from "express";
import {
  initiatePayment,
  initiateSubscriptionPayment,
  // paymentWebhook,
} from "../controllers/paymentController.js";
import { handleRazorpayWebhook } from "../webhooks/razorpayWebhook.js";
import { subscriptionWebhook } from "../webhooks/subscriptionWebhook.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/initiate", authenticateToken, fetchUser, initiatePayment);
router.post(
  "/subscribe",
  authenticateToken,
  fetchUser,
  initiateSubscriptionPayment
);

// router.post("/webhook", paymentWebhook);

router.post("/webhook/order", handleRazorpayWebhook);  
router.post("/webhook/subscription", subscriptionWebhook);
export default router;
