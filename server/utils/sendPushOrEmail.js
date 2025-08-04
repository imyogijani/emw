import { sendPushNotification } from "../services/firebaseService.js";
import { sendEmail } from "../utils/sendEmail.js";
import Notification from "../models/notificationModel.js";

export const sendPushOrEmail = async (user, { title, message, type, relatedId, relatedModel }) => {
  const sent = {};

 
  if (channels.includes("push") && user.pushToken) {
    sent.push = await sendPushNotification(user.pushToken, message);
  }

  if (channels.includes("email") && user.emailVerified && user.email) {
    sent.email = await sendEmail(user.email, title, message);
  }

  // In-App only if user interacts
  //  Don't save in DB now

  //  Optional: Only log push/email metadata (analytics/logs)
  console.log(`Notification sent to ${user._id}`);
};
