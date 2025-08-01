import express from "express";
import {
  getAdminAnalytics,
  getSellerAnalytics,
  getUserAnalytics,
} from "../controllers/analyticssController.js";
import {
  authenticateToken,
  authorizeAdmin,
  fetchUser,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin analytics (requires admin)
router.get("/admin", authenticateToken, authorizeAdmin, getAdminAnalytics);

// Seller analytics (requires seller)
router.get("/seller", authenticateToken, fetchUser, getSellerAnalytics);
router.get("/user", authenticateToken, fetchUser, getUserAnalytics);
router.get("/seller", authenticateToken, fetchUser, getSellerAnalytics);


export default router;
