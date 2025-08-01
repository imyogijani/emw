// backend/cronExpireDeals.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Deal from "./models/dealModel.js";

// Exported function for use in cron and server
export async function expireDeals() {
  // Only connect if not already connected (for server integration)
  if (mongoose.connection.readyState === 0) {
    dotenv.config({
      path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
    });
    const MONGO_URL = process.env.MONGO_URL;
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  const now = new Date();
  // Find deals that are approved or active and endDate < now
  const expiredDeals = await Deal.updateMany(
    {
      status: { $in: ["approved", "active"] },
      endDate: { $lt: now },
    },
    { $set: { status: "ended" } }
  );
  if (expiredDeals.modifiedCount !== undefined) {
    console.log(`Expired deals updated: ${expiredDeals.modifiedCount}`);
  }
}

// If run directly, execute once and exit
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  expireDeals()
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error("Error expiring deals:", err);
      process.exit(1);
    });
}
