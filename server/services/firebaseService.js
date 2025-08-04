import admin from "firebase-admin";

export const sendPushNotification = async (token, message) => {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title: "New Alert",
        body: message,
      },
    });
    return true;
  } catch (err) {
    console.error("Push Error:", err);
    return false;
  }
};
