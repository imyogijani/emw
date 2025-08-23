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
  updateSellerGST,
} from "../controllers/sellerController.js";
import {
  authenticateToken,
  authorizeSeller,
  fetchUser,
} from "../middlewares/authMiddleware.js";
import preventDemoSellerModification from "../middlewares/demoSellerMiddleware.js";

import { createCashfreeBeneficiary } from "../controllers/createCashfreeBeneficiary.js";

const router = express.Router();

// Apply preventDemoSellerModification middleware to all routes
router.use(authenticateToken, authorizeSeller, preventDemoSellerModification);

router.get("/dashboard-stats", getSellerDashboard);

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

router.post(
  "/gst-number",
  authenticateToken,
  authorizeSeller,
  fetchUser,
  updateSellerGST
);

export default router;
