// controllers/sellerOnboardingController.js
import Seller from "../models/sellerModel.js";
import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";
import userModel from "../models/userModel.js";

import UserSubscription from "../models/userSubscriptionModel.js";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";

export const onboardingStep1 = async (req, res) => {
  try {
    const { categories, brands, shopName, sellerId } = req.body;

    // console.log("Obboarding Body", req.body);

    //  sellerId check
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
    }

    //  check seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    //  basic validations
    if (!shopName || shopName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Shop name is required",
      });
    }

    if (!categories) {
      return res.status(400).json({
        success: false,
        message: "At least one category is required",
      });
    }

    if (!brands) {
      return res.status(400).json({
        success: false,
        message: "At least one brand is required",
      });
    }

    // Images from multer
    const files = req.files;
    const shopImage = files?.shopImage?.[0]?.filename
      ? `/uploads/shopowner/${files.shopImage[0].filename}`
      : null;

    const shopImages =
      files?.shopImages?.map((file) => `/uploads/shopowner/${file.filename}`) ||
      [];

    if (shopImage) {
      shopImages.unshift(shopImage); // main image first
    }

    //  validate categories
    let parsedCategories = Array.isArray(categories)
      ? categories
      : JSON.parse(categories);

    if (parsedCategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one category is required",
      });
    }

    const validCategories = await Category.find({
      _id: { $in: parsedCategories },
    });

    if (validCategories.length !== parsedCategories.length) {
      return res.status(400).json({
        success: false,
        message: "Some categories are invalid",
      });
    }

    //  validate brands
    let parsedBrands = Array.isArray(brands) ? brands : JSON.parse(brands);

    if (parsedBrands.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one brand is required",
      });
    }

    const validBrands = await Brand.find({
      _id: { $in: parsedBrands },
    });

    if (validBrands.length !== parsedBrands.length) {
      return res.status(400).json({
        success: false,
        message: "Some brands are invalid",
      });
    }

    //  update seller document
    seller.shopName = shopName;
    seller.shopImage = shopImage || seller.shopImage;
    seller.shopImages = shopImages.length > 0 ? shopImages : seller.shopImages;
    seller.categories = parsedCategories;
    seller.brands = parsedBrands;

    if (seller.onboardingStep) {
      seller.onboardingStep = seller.onboardingStep + 1;
    }

    const updatedSeller = await seller.save();

    return res.status(200).json({
      success: true,
      message: "Onboarding Step 1 completed 🎉",
      seller: updatedSeller,
    });
  } catch (error) {
    console.error("Onboarding Step 1 Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error in onboarding step 1",
      error: error.message,
    });
  }
};

// Complete onboarding and assign trial
export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware

    const seller = await Seller.findOne({ user: userId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found for this user",
      });
    }

    // Check if user already has subscription
    // const existingSub = await UserSubscription.findOne({
    //   user: userId,
    //   isActive: true,
    // });

    // if (existingSub) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "User already has active subscription",
    //   });
    // }

    const usedTrial = await UserSubscription.findOne({
      user: userId,
      billingCycle: "free", // or planName: "Free Trial"
    });
    if (usedTrial) {
      return res.status(400).json({
        success: false,
        message: "Free Trial already used. Please choose a paid plan.",
      });
    }

    // Find the free trial plan (optional if you keep in Subscription collection)
    let freeTrialPlan = await Subscription.findOne({ planName: "Free Trial" });
    if (!freeTrialPlan) {
      // If not exist, create once in DB
      freeTrialPlan = await Subscription.create({
        planName: "Free Trial",
        pricing: {},
        includedFeatures: ["50 products", "analytics", "priorities"],
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7); // 7 days trial

    const userSub = new UserSubscription({
      user: userId,
      subscription: freeTrialPlan._id,
      startDate,
      endDate,
      billingCycle: "free",
      paymentStatus: "free",
      isActive: true,
    });

    await userSub.save();

    seller.status = "active";
    await seller.save();

    return res.status(201).json({
      success: true,
      message: "Onboarding completed. Free Trial started for 7 days",
      subscription: userSub,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
