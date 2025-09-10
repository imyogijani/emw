import express from "express";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";
import {
  getDashboardStats,
  getAllProducts,
  deleteProduct,
  toggleDemoAccess,
  getSellersWithDemoStatus,
  getAllShops,
  getAllUsers,
  deleteUser,
  updateUser,
  getShopownerDetails,
  getSellerDetails,
  getAdminOrdersController,
  getSettings,
  updateSettings,
  getIncompleteOnboardingUsers,
  forceCompleteOnboarding,
  resetOnboarding,
  getOnboardingStats,
  updateOnboardingSettings,
} from "../controllers/adminController.js";

import {
  updateProduct,
  deleteAllProducts,
} from "../controllers/productController.js";
import {
  getAllOrdersAdmin,
  updateAdminOrderStatus,
} from "../controllers/orderController.js";

import {
  adminGetDocuments,
  adminUpdateDocumentStatus,
} from "../controllers/sellerDocumentController.js";

// import { updateOnboardingSettings } from "../controllers/settingsController.js";

// Settings controller import removed - using updateSettings from adminController instead

const router = express.Router();

// Demo access routes
router.get(
  "/sellers-demo-status",
  authenticateToken,
  authorizeAdmin,
  getSellersWithDemoStatus
);
router.patch(
  "/toggle-demo-access/:userId",
  authenticateToken,
  authorizeAdmin,
  toggleDemoAccess
);

// Protect all routes
router.use(authenticateToken);
router.use(authorizeAdmin);

// Dashboard stats
router.get("/dashboard-stats", getDashboardStats);

// Products management
router.get("/all-products", getAllProducts);
// router.get("/productsAll", adminGetAllProducts);
router.delete("/products/all", deleteAllProducts);
router.delete("/products/:id", deleteProduct);
router.put("/products/:id", updateProduct);

// Shops management
router.get("/shops", getAllShops);

// Users management
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/sellers/:id", getSellerDetails);
router.patch("/users/:id", updateUser);

// Orders management
router.get("/orders", getAllOrdersAdmin);
router.get("/recent-orders", getAdminOrdersController);
router.patch("/orders/:orderId/status", updateAdminOrderStatus);

// Shopowner details (for admin)
router.get("/shopowner/:id", getShopownerDetails);

// Documents controller

router.get("/documents", adminGetDocuments);
router.patch("/documents/:docId/status", adminUpdateDocumentStatus);

// Settings management
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.patch("/settings/onboarding-skip", updateOnboardingSettings);

// Onboarding management
router.get("/onboarding/incomplete", getIncompleteOnboardingUsers);
router.patch("/onboarding/:userId/force-complete", forceCompleteOnboarding);
router.patch("/onboarding/:userId/reset", resetOnboarding);
router.get("/onboarding/stats", getOnboardingStats);

export default router;
