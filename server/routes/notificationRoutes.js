import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notificationController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken, fetchUser);

// Notification routes
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/:notificationId/read", markAsRead);
router.put("/mark-all-read", markAllAsRead);
router.delete("/:notificationId", deleteNotification);

export default router;
