import { messagingPromise } from "../firebase/firebase";
import { getToken, onMessage } from "firebase/messaging";
import axios from "./axios";

export const requestPushPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();

    // console.log("🔍 Current Notification Permission:", Notification.permission);

    // if (Notification.permission === "granted") {
    //   console.log("✅ User has already allowed notifications.");
    // } else if (Notification.permission === "denied") {
    //   console.log("🚫 User has denied notifications.");
    // } else if (Notification.permission === "default") {
    //   console.log("⚠️ User has not yet made a choice (default).");
    // }

    if (permission !== "granted") {
      console.warn("🔒 Notification permission not granted");
      return;
    }

    const messaging = await messagingPromise; // Wait until it's ready

    if (!messaging) {
      console.error("Messaging is not initialized or not supported");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey:
        "BPosDZ_1paK-111mavBiRyi_r7Jc2AjvVmH1uhEnQmXUd0GPi4U6lDRvFcpy4QBnpS7ios98WQg_A522k11XX4Q",
    });

    if (!token) {
      console.warn("❌ No token retrieved");
      return;
    }

    await axios.post("/api/users/update-push-token", {
      userId,
      pushToken: token,
    });

    onMessage(messaging, (payload) => {
      console.log("📲 Foreground notification received:", payload);
      alert(payload?.notification?.title || "New Notification");
    });
  } catch (err) {
    console.error("❌ Error requesting push permission:", err);
  }
};
