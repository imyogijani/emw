import cron from "node-cron";
import Deal from "../models/dealModel.js";
import Product from "../models/productModel.js";

cron.schedule("*/10 * * * *", async () => {
  try {
    const now = new Date();

    // 1. Find all deals that expired & still linked in product
    const expiredDeals = await Deal.find({
      endDate: { $lt: now },
      status: "approved",
    });

    for (const deal of expiredDeals) {
      // 2. Set product.activeDeal to null
      await Product.updateOne(
        { _id: deal.product, activeDeal: deal._id },
        { $set: { activeDeal: null } }
      );

      // 3. (Optional) Update deal status to "expired"
      await Deal.findByIdAndUpdate(deal._id, {
        status: "expired",
      });
    }

    console.log("✅ Expired deals cleaned up");
  } catch (error) {
    console.error("❌ Error in deal cleanup cron:", error);
  }
});
