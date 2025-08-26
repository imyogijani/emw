import { messagingPromise } from "../firebase/firebase";
import { getToken, onMessage } from "firebase/messaging";
import axios from "./axios";

export const requestPushPermission = async (userId) => {
  try {
    // Check if notifications are supported
    if (!("Notification" in window)) {
      console.warn("🚫 This browser does not support notifications");
      return;
    }

    const permission = await Notification.requestPermission();

    console.log("🔍 Current Notification Permission:", Notification.permission);

    if (permission !== "granted") {
      console.warn("🔒 Notification permission not granted:", permission);
      return;
    }

    const messaging = await messagingPromise; // Wait until it's ready

    if (!messaging) {
      console.error("❌ Messaging is not initialized or not supported");
      return;
    }

    // Validate userId
    if (!userId) {
      console.error("❌ User ID is required for push notification setup");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey:
        "BPosDZ_1paK-111mavBiRyi_r7Jc2AjvVmH1uhEnQmXUd0GPi4U6lDRvFcpy4QBnpS7ios98WQg_A522k11XX4Q",
    });

    if (!token) {
      console.warn("❌ No FCM token retrieved");
      return;
    }

    console.log("✅ FCM Token retrieved successfully");

    // Update push token on server
    try {
      await axios.post("/api/users/update-push-token", {
        userId,
        pushToken: token,
      });
      console.log("✅ Push token updated on server");
    } catch (tokenError) {
      console.error("❌ Failed to update push token on server:", tokenError);
      throw tokenError;
    }

    // Set up foreground message listener
    onMessage(messaging, (payload) => {
      console.log("📲 Foreground notification received:", payload);

      // Create a more user-friendly notification display
      if (payload?.notification) {
        const { title, body } = payload.notification;

        // Use browser notification if available, fallback to alert
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title || "New Notification", {
            body: body || "",
            icon: "/favicon.png",
          });
        } else {
          alert(`${title || "New Notification"}${body ? "\n" + body : ""}`);
        }
      }
    });
  } catch (err) {
    console.error("❌ Error requesting push permission:", err);
  }
};
