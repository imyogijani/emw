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
  updateShopownerSubscription,
  getShopownerDetails,
  getSellerDetails,
  getAllLocations,
  addState,
  addCity,
  deleteState,
  deleteCity,
  getAdminOrdersController,
  getSettings,
  updateSettings,
  getIncompleteOnboardingUsers,
  forceCompleteOnboarding,
  resetOnboarding,
  getOnboardingStats,
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
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuStats,
} from "../controllers/menuController.js";

import {
  adminGetDocuments,
  adminUpdateDocumentStatus,
} from "../controllers/sellerDocumentController.js";

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
router.delete("/users/:id", authenticateToken, authorizeAdmin, deleteUser);
router.get("/sellers/:id", authenticateToken, authorizeAdmin, getSellerDetails);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/subscription", updateShopownerSubscription);

// Orders management
router.get("/orders", getAllOrdersAdmin);
router.get("/recent-orders", getAdminOrdersController);
router.patch("/orders/:orderId/status", updateAdminOrderStatus);

// Menu management
router.post("/menu-items", createMenuItem);
router.get("/menu-items", getAllMenuItems);
router.get("/menu-items/:id", getMenuItemById);
router.put("/menu-items/:id", updateMenuItem);
router.delete("/menu-items/:id", deleteMenuItem);
router.get("/menu-stats", getMenuStats);

// Shopowner details (for admin)
router.get("/shopowner/:id", getShopownerDetails);

// Location management
router.get("/locations", getAllLocations);
router.post("/locations/state", addState);
router.post("/locations/city", addCity);
router.delete("/locations/state/:stateName", deleteState);
router.delete("/locations/city/:stateName/:cityName", deleteCity);

// Documents controller

router.get("/documents", adminGetDocuments);
router.patch("/documents/:docId/status", adminUpdateDocumentStatus);

// Settings management
router.get("/settings", getSettings);
router.post("/settings", updateSettings);

// Onboarding management
router.get("/onboarding/incomplete", getIncompleteOnboardingUsers);
router.patch("/onboarding/:userId/force-complete", forceCompleteOnboarding);
router.patch("/onboarding/:userId/reset", resetOnboarding);
router.get("/onboarding/stats", getOnboardingStats);

export default router;
