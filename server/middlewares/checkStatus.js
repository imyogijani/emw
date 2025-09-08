import User from "../models/userModel.js";
import Seller from "../models/sellerModel.js";

export const checkAccountStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    //  Block banned user
    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned. Please contact support.",
      });
    }

    //  If seller exists, check seller account
    if (user.sellerId) {
      const seller = await Seller.findById(user.sellerId);

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: "Seller account not found",
        });
      }

      //  Block banned seller
      if (seller.status === "banned") {
        return res.status(403).json({
          success: false,
          message:
            "Your seller account has been banned. Please contact support.",
        });
      }

      //  Seller onboarding not complete
      if (!seller.isOnboardingComplete) {
        return res.status(403).json({
          success: false,
          message: "Please complete onboarding steps to continue.",
        });
      }

      //  Seller not active → block all actions (like add product)
      if (seller.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Your seller account is not active. Please contact support.",
        });
      }
    }

    //  Everything ok → proceed
    next();
  } catch (error) {
    console.error("checkAccountStatus error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
