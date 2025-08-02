import express from "express";
import { settleOrderPayout } from "../controllers/payoutController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/settle/:orderId", protect, adminOnly, settleOrderPayout); // Admin only

export default router;
