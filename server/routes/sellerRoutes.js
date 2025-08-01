import express from "express";
import {
  getSellerDashboard,
  getRecentOrdersForSeller,
  getSalesData,
  getSellerOrderHistory,
} from "../controllers/sellerController.js";
import {
  authenticateToken,
  authorizeSeller,
} from "../middlewares/authMiddleware.js";

import { createCashfreeBeneficiary } from "../controllers/createCashfreeBeneficiary.js";

const router = express.Router();

router.get(
  "/dashboard-stats",
  authenticateToken,
  authorizeSeller,
  getSellerDashboard
);

router.get(
  "/recent-orders",
  authenticateToken,
  authorizeSeller,
  getRecentOrdersForSeller
);

router.get("/sale-data", authenticateToken, authorizeSeller, getSalesData);
router.get(
  "/seller-history",
  authenticateToken,
  authorizeSeller,
  getSellerOrderHistory
);

router.post(
  "/create-cashfree-beneficiary",
  authenticateToken,
  authorizeSeller,
  createCashfreeBeneficiary
);

export default router;
