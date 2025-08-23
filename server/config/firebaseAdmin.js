// config/firebaseAdmin.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// 🔑 Use your Firebase service account key JSON file
const serviceAccount = JSON.parse(
  // readFileSync(new URL("../firebase/firebaseKey.json", import.meta.url))
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
