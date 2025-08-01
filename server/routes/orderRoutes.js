import express from "express";
import {
  authenticateToken,
  customerOnly,
  fetchUser,
} from "../middlewares/authMiddleware.js";
import {
  getUserOrders,
  createOrder,
  getOrderById,
  getAllOrdersAdmin,
  getOrderTimeline,
  getSellerOrderHistory,
  confirmOrderReceived,
} from "../controllers/orderController.js";

const router = express.Router();

// Get user's orders
// router.get("/user-orders", authenticateToken, getUserOrders);
router.get("/user-orders", authenticateToken, getUserOrders);

router.patch(
  "/confirm-received/:orderId",
  authenticateToken,
  confirmOrderReceived
);

router.get("/admin-orders", authenticateToken, fetchUser, getAllOrdersAdmin);
router.get("/seller-history", authenticateToken, getSellerOrderHistory);
router.get("/details/:orderId", authenticateToken, getOrderById);
router.get(
  "/:orderId/timeline",
  authenticateToken,
  fetchUser,
  getOrderTimeline
);
// router.get("/:orderId/timeline", authenticateToken, getOrderTimeline);
// router.get("/orders/history", authenticateToken, getSellerOrderHistory);

// Create a new order (checkout) - only customers allowed
router.post("/create", authenticateToken, fetchUser, createOrder);

export default router;
