// // pushNotification.js
// import admin from "firebase-admin";
// import path from "path";
// import { fileURLToPath, pathToFileURL } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ Convert to file URL format
// const serviceAccountPath = path.join(__dirname, "../firebase/firebaseKey.json");
// const serviceAccountUrl = pathToFileURL(serviceAccountPath);

// // ✅ Load the JSON as ESM with `assert: { type: "json" }`
// const serviceAccount = await import(serviceAccountUrl.href, {
//   assert: { type: "json" },
// });

// // ✅ Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount.default),
// });

// // ✅ Push notification sender
// export const sendPushNotification = async (token, message) => {
//   try {
//     const payload = {
//       notification: {
//         title: "eMall Alert",
//         body: message,
//       },
//       token,
//     };

//     const res = await admin.messaging().send(payload);
//     console.log("✅ Push sent:", res);
//     return true;
//   } catch (error) {
//     console.error("❌ Push send error:", error);
//     return false;
//   }
// };

// backend/utils/sendPush.js
import admin from "firebase-admin";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to the JSON key
const serviceAccountPath = path.resolve(
  __dirname,
  "../firebase/firebaseKey.json"
);

const rawKey = await readFile(serviceAccountPath, "utf-8");
const serviceAccount = JSON.parse(rawKey);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const sendPushNotification = async (token, message) => {
  try {
    const payload = {
      notification: {
        title: "eMall Alert",
        body: message,
      },
      token,
    };

    const res = await admin.messaging().send(payload);
    console.log("✅ Push sent:", res);
    return true;
  } catch (error) {
    console.error("❌ Push send error:", error);
    return false;
  }
};
