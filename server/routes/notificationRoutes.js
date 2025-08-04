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
// routes/notifications.js
router.post("/save", async (req, res) => {
  const { title, message, type, relatedId, relatedModel } = req.body;

  const notification = new Notification({
    recipient: req.user._id,
    title,
    message,
    type,
    relatedId,
    relatedModel,
    channels: ["inApp"],
    sent: { inApp: true },
  });

  await notification.save();
  res.status(200).json({ success: true });
});

export default router;
