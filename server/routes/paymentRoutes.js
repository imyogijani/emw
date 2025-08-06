import express from "express";
import {
  initiatePayment,
  initiateSubscriptionPayment,
  verifyPayment,
  verifySubscriptionPayment,
  // paymentWebhook,
} from "../controllers/paymentController.js";
import { handleRazorpayWebhook } from "../webhooks/razorpayWebhook.js";
import { subscriptionPaymentWebhook } from "../webhooks/subscriptionWebhook.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/initiate", authenticateToken, fetchUser, initiatePayment);
router.post("/verify", verifyPayment);
router.post(
  "/subscribe",
  authenticateToken,
  fetchUser,
  initiateSubscriptionPayment
);

router.post("/verify", verifySubscriptionPayment);

// router.post("/webhook", paymentWebhook);

router.post("/webhook/order", handleRazorpayWebhook);
router.post("/webhook/subscription", subscriptionPaymentWebhook);
export default router;
