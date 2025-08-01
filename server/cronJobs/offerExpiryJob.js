// cronJobs/offerExpiryJob.js
import cron from "node-cron";
import Offer from "../models/offerModel.js";

cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  try {
    const result = await Offer.updateMany(
      { endDate: { $lt: now }, isActive: true },
      { $set: { isActive: false } }
    );
    console.log(`✅ Expired offers deactivated: ${result.modifiedCount}`);
  } catch (err) {
    console.error("❌ Cron job error:", err.message);
  }
});
