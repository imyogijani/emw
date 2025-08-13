import express from "express";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";
import {
  getDashboardStats,
  getAllProducts,
  deleteProduct,
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
} from "../controllers/adminController.js";
import {
  updateProduct,
  deleteAllProducts,
} from "../controllers/productController.js";
import { getAllOrdersAdmin } from "../controllers/orderController.js";
import {
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuStats,
} from "../controllers/menuController.js";

const router = express.Router();

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

export default router;
