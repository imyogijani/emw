import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
import UserSubscription from "../models/userSubscriptionModel.js";
import Seller from "../models/sellerModel.js";
// import Subscription from "../models/subscriptionModel.js";

export const assignSubscriptionToUser = async (
  userId,
  subscriptionId,
  billingCycle = "monthly",
  paymentStatus = "paid"
) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error("Invalid subscription plan");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if same plan is already active
    const existingActive = await UserSubscription.findOne({
      user: userId,
      subscription: subscriptionId,
      isActive: true,
    });

    if (existingActive) {
      // throw new Error("User already has this subscription active.");
      // Optional: return existingActive;
    }

    const startDate = new Date();
    const endDate = new Date();

    if (billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      throw new Error("Invalid billing cycle");
    }

    // Deactivate any old subscriptions
    await UserSubscription.updateMany(
      { user: userId, isActive: true },
      { $set: { isActive: false } }
    );

    // Create new user subscription
    const userSub = await UserSubscription.create({
      user: userId,
      subscription: subscriptionId,
      startDate,
      endDate,
      billingCycle,
      featuresUsed: {},
      isActive: true,
      paymentStatus,
    });

    // Update user details
    user.subscription = subscriptionId;
    user.subscriptionStartDate = startDate;
    user.subscriptionEndDate = endDate;
    user.subscriptionFeatures = subscription.includedFeatures;
    user.status = "active"; // update user status to active

    await user.save();

    //  If user is also a seller
    if (user.sellerId) {
      await Seller.findByIdAndUpdate(user.sellerId, {
        $set: {
          status: "active",
        },
      });
    }

    return {
      success: true,
      message: "Subscription assigned successfully",
      data: userSub,
    };
  } catch (error) {
    console.error("Subscription assignment error:", error.message);
    return {
      success: false,
      message: "Failed to assign subscription",
      error: error.message,
    };
  }
};
//  Assign subscription to user
// export const assignSubscriptionToUser = async (userId, subscriptionId) => {
//   const subscription = await Subscription.findById(subscriptionId);
//   if (!subscription) throw new Error("Invalid subscription plan");

//   const user = await User.findById(userId);
//   if (!user) throw new Error("User not found");

//   const now = new Date();
//   const endDate = new Date();
//   endDate.setMonth(endDate.getMonth() + 1); // Example: 1 month

//   user.subscription = subscriptionId;
//   user.subscriptionStartDate = now;
//   user.subscriptionEndDate = endDate;
//   user.isPremium = true; // or based on plan
//   user.subscriptionFeatures = subscription.includedFeatures;

//   await user.save();
// };

// Check subscription validity
// export const checkSubscriptionValid = async (userId) => {
//   const user = await User.findById(userId).populate("subscription");
//   if (!user) throw new Error("User not found");

//   if (!user.subscription || !user.subscriptionEndDate)
//     throw new Error("No active subscription");

//   const now = new Date();
//   if (now > user.subscriptionEndDate) throw new Error("Subscription expired");

//   return true;
// };

export const isUserSubscriptionActive = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        active: false,
        message: "User not found",
      };
    }

    if (!user.subscription || !user.subscriptionEndDate) {
      return {
        success: true,
        active: false,
        message: "No active subscription found for this user",
      };
    }

    const currentDate = new Date();

    if (user.subscriptionEndDate > currentDate) {
      return {
        success: true,
        active: true,
        message: "User subscription is active",
      };
    } else {
      return {
        success: true,
        active: false,
        message: "User subscription has expired",
      };
    }
  } catch (error) {
    console.error("Subscription check error:", error.message);
    return {
      success: false,
      active: false,
      message: "Something went wrong while checking subscription",
      error: error.message,
    };
  }
};
