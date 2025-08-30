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
    const {
      categories,
      brands,
      shopName,
      sellerId,
      shopAddresses,
      incrementOnboarding,
    } = req.body;

    console.log("Obboarding Body", req.body);

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

    // Brands are optional now
    // if (!brands) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "At least one brand is required",
    //   });
    // }

    // Images from multer
    const files = req.files;
    // console.log(
    //   "Uploaded files:",
    //   files?.shopImage,
    //   "Shop Images -->",
    //   files?.shopImages
    // );
    const shopImage = files?.shopImage?.[0]?.filename
      ? `/uploads/shopowner/${files.shopImage[0].filename}`
      : null;

    let shopImages =
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

    //  validate brands (optional)
    let parsedBrands = [];
    if (brands) {
      parsedBrands = Array.isArray(brands) ? brands : JSON.parse(brands);

      if (parsedBrands.length > 0) {
        const validBrands = await Brand.find({
          _id: { $in: parsedBrands },
        });

        if (validBrands.length !== parsedBrands.length) {
          return res.status(400).json({
            success: false,
            message: "Some brands are invalid",
          });
        }
      }
    }

    let parsedAddresses = [];
    if (shopAddresses) {
      parsedAddresses = Array.isArray(shopAddresses)
        ? shopAddresses
        : JSON.parse(shopAddresses);

      // Validate each address
      let validatedAddresses = [];
      for (let addr of parsedAddresses) {
        const { valid, errors, sanitized } = validateAddress(addr);
        if (!valid) {
          return res.status(400).json({
            success: false,
            message: `Invalid address: ${errors.join(", ")}`,
            errors,
          });
        }
        validatedAddresses.push(sanitized);
      }

      seller.shopAddresses = validatedAddresses;
    }
    //  update seller document
    seller.shopName = shopName;
    seller.shopImage = shopImage || seller.shopImage;
    seller.shopImages = shopImages.length > 0 ? shopImages : seller.shopImages;
    seller.categories = parsedCategories;
    seller.brands = parsedBrands || [];

    if (incrementOnboarding) {
      // Mark basic_details step as completed
      if (!seller.completedOnboardingSteps.includes('basic_details')) {
        seller.completedOnboardingSteps.push('basic_details');
      }
      
      // Keep backward compatibility
      seller.onboardingStep = 2;
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

// Start free trial for new sellers
// Handle shop timing step completion
export const completeShopTimingStep = async (req, res) => {
  try {
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Mark shop_timing step as completed
    if (!seller.completedOnboardingSteps.includes('shop_timing')) {
      seller.completedOnboardingSteps.push('shop_timing');
    }
    
    // Update onboarding step for backward compatibility
    if (seller.onboardingStep < 3) {
      seller.onboardingStep = 3;
    }

    await seller.save();

    return res.status(200).json({
      success: true,
      message: "Shop timing step completed successfully",
      completedSteps: seller.completedOnboardingSteps,
    });
  } catch (error) {
    console.error("Shop timing step error:", error);
    return res.status(500).json({
      success: false,
      message: "Error completing shop timing step",
      error: error.message,
    });
  }
};

// Handle document verification step completion
export const completeDocumentStep = async (req, res) => {
  try {
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Mark document_verification step as completed
    if (!seller.completedOnboardingSteps.includes('document_verification')) {
      seller.completedOnboardingSteps.push('document_verification');
    }
    
    // Update onboarding step for backward compatibility
    if (seller.onboardingStep < 4) {
      seller.onboardingStep = 4;
    }

    await seller.save();

    return res.status(200).json({
      success: true,
      message: "Document verification step completed successfully",
      completedSteps: seller.completedOnboardingSteps,
    });
  } catch (error) {
    console.error("Document verification step error:", error);
    return res.status(500).json({
      success: false,
      message: "Error completing document verification step",
      error: error.message,
    });
  }
};

// Handle subscription step completion
export const completeSubscriptionStep = async (req, res) => {
  try {
    const { sellerId, subscriptionPlan } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Handle subscription logic if provided
    if (subscriptionPlan) {
      const subscription = await Subscription.findById(subscriptionPlan);
      if (subscription) {
        // Create user subscription record
        const userSubscription = new UserSubscription({
          user: seller.user,
          subscription: subscription._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + (subscription.durationInMonths * 30 * 24 * 60 * 60 * 1000)),
          status: 'active',
          billingCycle: 'monthly'
        });
        await userSubscription.save();
      }
    }

    // Mark subscription step as completed
    if (!seller.completedOnboardingSteps.includes('subscription')) {
      seller.completedOnboardingSteps.push('subscription');
    }
    
    // Check if all required steps are completed
    const OnboardingConfig = (await import("../models/onboardingConfigModel.js")).default;
    const config = await OnboardingConfig.findOne();
    
    if (config) {
      const requiredSteps = config.steps
        .filter(step => step.isRequired && step.isActive)
        .map(step => step.stepId);
      
      const allRequiredCompleted = requiredSteps.every(stepId => 
        seller.completedOnboardingSteps.includes(stepId)
      );
      
      if (allRequiredCompleted) {
        seller.isOnboardingComplete = true;
        
        // Update user onboarding status
        const user = await User.findById(seller.user);
        if (user) {
          user.isOnboardingComplete = true;
          await user.save();
        }
      }
    }
    
    // Update onboarding step for backward compatibility
    seller.onboardingStep = 5;

    await seller.save();

    return res.status(200).json({
      success: true,
      message: seller.isOnboardingComplete ? 
        "Onboarding completed successfully!" : 
        "Subscription step completed successfully",
      completedSteps: seller.completedOnboardingSteps,
      isOnboardingComplete: seller.isOnboardingComplete,
    });
  } catch (error) {
    console.error("Subscription step error:", error);
    return res.status(500).json({
      success: false,
      message: "Error completing subscription step",
      error: error.message,
    });
  }
};

export const startFreeTrial = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user already used free trial
    const usedTrial = await UserSubscription.findOne({
      user: userId,
      billingCycle: "free",
    });

    if (usedTrial) {
      return res.status(400).json({
        success: false,
        message: "Free trial already used. Please choose a paid plan.",
      });
    }

    // Find or create free trial plan
    let freeTrialPlan = await Subscription.findOne({ planName: "Free Trial" });
    if (!freeTrialPlan) {
      freeTrialPlan = await Subscription.create({
        planName: "Free Trial",
        pricing: { monthly: "free", yearly: "free" },
        includedFeatures: [
          "Product Listing:50",
          "Basic Analytics",
          "Customer Support",
          "Order Management",
          "Inventory Tracking",
        ],
        isVisible: false, // Don't show in regular subscription list
      });
    }

    // Create 7-day free trial subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const trialSubscription = new UserSubscription({
      user: userId,
      subscription: freeTrialPlan._id,
      startDate: new Date(),
      endDate: trialEndDate,
      billingCycle: "free",
      isActive: true,
      paymentStatus: "free",
    });

    await trialSubscription.save();

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      isOnboardingComplete: true,
      subscription: freeTrialPlan._id,
      subscriptionStartDate: new Date(),
    });

    await Seller.findOneAndUpdate(
      { user: userId }, // seller linked to this user
      { isOnboardingComplete: true }
    );

    res.status(200).json({
      success: true,
      message: "7-day free trial started successfully!",
      trialEndDate: trialEndDate,
      subscription: freeTrialPlan,
    });
  } catch (error) {
    console.error("Error starting free trial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start free trial",
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
        includedFeatures: ["productLimit:50", "analytics", "prioritySupport"],
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

    await Seller.findOneAndUpdate(
      { user: userId }, // seller linked to this user
      { isOnboardingComplete: true }
    );

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

export const validateAddress = (address) => {
  let errors = {};

  if (!address.addressLine1 || address.addressLine1.trim() === "") {
    errors.addressLine1 = "Address Line 1 is required";
  }
  if (!address.city || address.city.trim() === "") {
    errors.city = "City is required";
  }
  if (!address.state || address.state.trim() === "") {
    errors.state = "State is required";
  }
  if (!address.pincode || address.pincode.trim() === "") {
    errors.pincode = "Pincode is required";
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    valid: isValid,
    errors,
    sanitized: {
      addressLine1: address.addressLine1?.trim(),
      addressLine2: address.addressLine2?.trim() || "",
      city: address.city?.trim(),
      state: address.state?.trim(),
      pincode: address.pincode?.trim(),
      country: address.country || "India",
      isDefault: address.isDefault || false,
      type: address.type || "store",
    },
  };
};
