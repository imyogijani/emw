import userModel from "../models/userModel.js";
import Subscription from "../models/subscriptionModel.js";

export const checkIsPremium = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId).populate("subscription");

    if (!user || user.role !== "shopowner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const subscription = user.subscription;
    if (!subscription || !subscription.planName.toLowerCase().includes("premium")) {
      return res.status(403).json({ message: "Only premium shopowners can add products" });
    }

    next(); // go to addProduct controller
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


