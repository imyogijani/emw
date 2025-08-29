// routes/webhookRoutes.js
import express from "express";
import {
  delhiveryWebhook,
  razorpayWebhook,
} from "../controllers/webhookController.js";

const router = express.Router();

// Delhivery webhook endpoint - no auth (but verify signature header if possible)
router.post("/delhivery", express.json(), delhiveryWebhook);

// Razorpay webhook
router.post("/razorpay", express.json({ type: "*/*" }), razorpayWebhook);

export default router;
