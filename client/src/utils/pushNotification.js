import { messaging } from "../firebase/firebase";
import { getToken, onMessage } from "firebase/messaging";
import axios from "./axios";

export const requestPushPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      if (!messaging) {
        console.error("Messaging is not initialized");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey:
          "BPosDZ_1paK-111mavBiRyi_r7Jc2AjvVmH1uhEnQmXUd0GPi4U6lDRvFcpy4QBnpS7ios98WQg_A522k11XX4Q",
      });

      if (token) {
        // console.log("Push Token:", token);

        await axios.post("/api/users/update-push-token", {
          userId,
          pushToken: token,
        });

        // Foreground push listener
        onMessage(messaging, (payload) => {
          console.log("📲 Foreground notification received:", payload);
          alert(payload?.notification?.title || "New Notification");
        });
      } else {
        console.warn("❌ No token retrieved");
      }
    } else {
      console.warn("🔒 Notification permission not granted");
    }
  } catch (err) {
    console.error("❌ Error requesting push permission:", err);
  }
};
