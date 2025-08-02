import express from "express";
import {
  initiatePayment,
  paymentWebhook,
} from "../controllers/paymentController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/initiate", authenticateToken, fetchUser, initiatePayment);
router.post("/webhook", paymentWebhook);
export default router;
