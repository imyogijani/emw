// /cronJobs/disableExpiredPremiums.js
import cron from "node-cron";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Seller from "../models/sellerModel.js";

const disableExpiredPremiums = cron.schedule("30 0 * * *", async () => {
  try {
    const now = new Date();

    const expiredUsers = await User.find({
      role: "shopowner",
      subscriptionEndDate: { $lt: now },
    });

    console.log(`Found ${expiredUsers.length} expired users`);

    for (const user of expiredUsers) {
      const seller = await Seller.findOne({ user: user._id });
      if (!seller) continue;

      const result = await Product.updateMany(
        { seller: seller._id, isPremium: true },
        { $set: { isPremium: false } }
      );

      console.log(
        `Disabled ${result.modifiedCount} premium products for seller ${seller._id}`
      );
    }
  } catch (error) {
    console.error("❌ Cron error in disabling premium products:", error);
  }
});

//  Start the job automatically
disableExpiredPremiums.start();

// Export (optional)
export default disableExpiredPremiums;
