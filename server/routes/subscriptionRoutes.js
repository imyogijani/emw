import express from "express";
import {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getSubscriptionByName,
} from "../controllers/subscriptionController.js";
import {
  authenticateToken,
  authorizeAdmin,
  isAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/subscriptions", getAllSubscriptions);

// router.use();

router.post(
  "/subscriptions",
  authenticateToken,
  authorizeAdmin,
  isAdmin,
  createSubscription
);
router.get(
  "/subscriptions/:id",
  authenticateToken,
  authorizeAdmin,
  isAdmin,
  getSubscriptionById
);
router.put("/subscriptions/:id", updateSubscription);
router.delete(
  "/subscriptions/:id",
  authenticateToken,
  authorizeAdmin,
  isAdmin,
  deleteSubscription
);
router.get(
  "/plan-by-name/:planName",
  authenticateToken,
  authorizeAdmin,
  isAdmin,
  getSubscriptionByName
);

export default router;
