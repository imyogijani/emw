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
  getOnboardingStep,
  getSellerInfo,
  updateSellerGSTBankDetails,
} from "../controllers/sellerController.js";
import {
  authenticateToken,
  authorizeSeller,
  fetchUser,
} from "../middlewares/authMiddleware.js";
import preventDemoSellerModification from "../middlewares/demoSellerMiddleware.js";
import {
  checkOnboardingSettings,
  checkDashboardAccess,
  getOnboardingSettings,
} from "../middlewares/onboardingMiddleware.js";


const router = express.Router();

// Apply preventDemoSellerModification middleware to all routes
router.use(authenticateToken, authorizeSeller, preventDemoSellerModification);

// Dashboard endpoints - allow access but with appropriate restrictions
router.get("/dashboard-stats", checkDashboardAccess, getSellerDashboard);

router.get("/recent-orders", checkDashboardAccess, getRecentOrdersForSeller);

router.get("/sale-data", checkDashboardAccess, getSalesData);
router.get("/seller-history", checkDashboardAccess, getSellerOrderHistory);

router.get("/seller-customer", checkDashboardAccess, getSellerCustomer);

router.get("/customer-orders", checkDashboardAccess, getCustomerOrdersBySeller);

router.get("/sales-overview", checkDashboardAccess, getSellerSalesOverview);
router.get("/orders-analytics", checkDashboardAccess, getSellerOrdersAnalytics);


router.post(
  "/financial-details",
  fetchUser,
  checkOnboardingSettings,
  updateSellerGSTBankDetails
);

router.get(
  "/onboarding-status",
  authenticateToken,
  authorizeSeller,
  fetchUser,
  getOnboardingStep
);



// seller Info
router.get("/me", authenticateToken, authorizeSeller, fetchUser, getSellerInfo);

export default router;
