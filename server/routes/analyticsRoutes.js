import express from "express";
import { getAdminAnalytics, getSellerAnalytics } from "../controllers/analyticsController.js";
import { authenticateToken, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin analytics (requires admin)
router.get("/admin", authenticateToken, authorizeAdmin, getAdminAnalytics);

// Seller analytics (requires seller)
router.get("/seller", authenticateToken, getSellerAnalytics);

export default router;
