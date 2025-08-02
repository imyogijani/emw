// routes/checkoutRoutes.js
import express from "express";
import {
  checkoutSummary,
  applyCoupon,
} from "../controllers/checkoutController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/summary", authenticateToken, fetchUser, checkoutSummary);
// router.post("/apply-coupon", protect, applyCoupon);

router.post("/apply-coupon", authenticateToken, fetchUser, applyCoupon);
export default router;
