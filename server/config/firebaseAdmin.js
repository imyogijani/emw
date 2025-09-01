// config/firebaseAdmin.js
import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

let firebaseAdmin = null;

try {
  // Check if service account key exists
  const serviceAccountPath = new URL("./serviceAccountKey.json", import.meta.url);
  
  if (existsSync(serviceAccountPath)) {
    // 🔑 Use your Firebase service account key JSON file
    const serviceAccount = JSON.parse(
      readFileSync(serviceAccountPath)
    );

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firebaseAdmin = admin;
  } else {
    console.warn("⚠️  Firebase service account key not found. Firebase features will be disabled.");
    console.warn("   To enable Firebase, add serviceAccountKey.json to the config directory.");
  }
} catch (error) {
  console.warn("⚠️  Firebase initialization failed:", error.message);
  console.warn("   Firebase features will be disabled.");
}

export default firebaseAdmin;
