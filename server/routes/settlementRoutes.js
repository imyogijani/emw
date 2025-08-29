// routes/settlement.routes.js
import express from "express";
import {
  getMonthlySettlementReport,
  settleMonthlyPayouts,
  getSellerMonthlyPayouts,
} from "../controllers/settlementController.js";
// import { isAdmin } from "../middleware/auth.js"; // your admin check
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/admin/monthly-settlement-report",
  authenticateToken,
  fetchUser,
  getMonthlySettlementReport
);
router.post(
  "/admin/settle-month",
  authenticateToken,
  fetchUser,
  settleMonthlyPayouts
);
router.get(
  "/seller-payouts/:sellerId",
  authenticateToken,
  fetchUser,
  getSellerMonthlyPayouts
);

export default router;
