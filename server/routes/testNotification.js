// routes/testNotification.js
import express from "express";
import { createNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/test", async (req, res) => {
  const { userId, type = "system", message = "🔔 Test Notification", channels = ["push", "inApp", "email"] } = req.body;

  try {
    const result = await createNotification({
      recipient: userId,
      title: "Test Notification",
      message,
      type,
      channels,
    });

    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
