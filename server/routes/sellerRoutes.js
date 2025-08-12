import express from "express";
import {
  getSellerDashboard,
  getRecentOrdersForSeller,
  getSalesData,
  getSellerOrderHistory,
  getSellerCustomer,
  getCustomerOrdersBySeller,
  getSellerSalesOverview,
  getSellerOrdersAnalytics,
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

router.get(
  "/seller-customer",
  authenticateToken,
  authorizeSeller,
  getSellerCustomer
);

router.get(
  "/customer-orders",
  authenticateToken,
  authorizeSeller,
  getCustomerOrdersBySeller
);

router.get(
  "/sales-overview",
  authenticateToken,
  authorizeSeller,
  getSellerSalesOverview
);
router.get(
  "/orders-analytics",
  authenticateToken,
  authorizeSeller,
  getSellerOrdersAnalytics
);
// router.post(
//   "/create-cashfree-beneficiary",
//   authenticateToken,
//   authorizeSeller,
//   createCashfreeBeneficiary
// );

export default router;
