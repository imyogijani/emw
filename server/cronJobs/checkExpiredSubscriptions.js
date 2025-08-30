import UserSubscription from "../models/userSubscriptionModel.js";
import User from "../models/userModel.js";
import Seller from "../models/sellerModel.js";
import { logger } from "../utils/logger.js";
import cron from "node-cron";

const checkExpiredSubscriptions = cron.schedule("0 * * * *", async () => {
  logger("🔁 Cron: Checking expired subscriptions...");

  const now = new Date();

  const expiredSubs = await UserSubscription.find({
    isActive: true,
    endDate: { $lt: now },
  });

  if (expiredSubs.length === 0) {
    logger("✅ Koi bhi expired subscription nahi mila.");
    return;
  }

  for (const sub of expiredSubs) {
    const userId = sub.user;

    // 1. Mark subscription inactive
    sub.isActive = false;
    await sub.save();

    // 2. Mark user as inactive
    const user = await User.findById(userId);
    if (user) {
      user.status = "inactive";
      user.subscription = null;
      user.subscriptionFeatures = [];
      user.subscriptionStartDate = null;
      user.subscriptionEndDate = null;
      await user.save();
    }

    // 3. If seller, also mark seller inactive
    if (user && user.sellerId) {
      await Seller.findByIdAndUpdate(user.sellerId, {
        $set: { status: "inactive" },
      });
    }

    logger(
      `⛔ User ${
        user?.email || userId
      } ka plan expire ho gaya. Status set to inactive.`
    );
  }

  logger("🧹 Expired subscription cleanup completed.");
});

export default checkExpiredSubscriptions;
