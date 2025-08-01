import Notification from "../models/notificationModel.js";
// import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js"; // tumhara nodemailer function
import { sendPushNotification } from "../utils/sendPush.js"; // firebase wali file





export const createNotification = async ({
  recipient,
  title,
  message,
  type = "system",
  channels = ["inApp"],
  ...rest
}) => {
  try {
    const user = await User.findById(recipient);
    const sentStatus = {};

    // Email
    if (channels.includes("email") && user?.email) {
      sentStatus.email = await sendEmail(user.email, title, message);
    }

    // Push
    if (channels.includes("push") && user?.pushToken) {
      sentStatus.push = await sendPushNotification(user.pushToken, message);
    }

    // In-App (always saved to DB)
    const notification = new Notification({
      title,
      message,
      type,
      recipient,
      channels,
      sent: sentStatus,
      ...rest,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
};

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const filter = { recipient: req.user._id };

    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate("sender", "names email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create notification (utility function for internal use)
// export const createNotification = async (notificationData) => {
//   try {
//     const notification = new Notification(notificationData);
//     await notification.save();
//     return notification;
//   } catch (error) {
//     console.error("Error creating notification:", error);
//     throw error;
//   }
// };



export const sendSubscriptionChangeNotification = async ({
  userId,
  oldPlan,
  newPlan,
  newFeatures,
}) => {
  try {
    const notification = new Notification({
      title: "Subscription Plan Changed",
      message: `Your subscription has been updated from ${oldPlan} to ${newPlan}. Click to review your new plan features!`,
      type: "system",
      recipient: userId,
      relatedModel: "users",
      priority: "high",
      actionUrl: `/subscription/review?plan=${encodeURIComponent(newPlan)}`,
      metadata: {
        oldPlan,
        newPlan,
        newFeatures,
      },
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating subscription change notification:", error);
    throw error;
  }
};
