// controllers/sellerOnboardingController.js
import Seller from "../models/sellerModel.js";
import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";
import userModel from "../models/userModel.js";

// import UserSubscription from "../models/userSubscriptionModel.js";
// import Subscription from "../models/subscriptionModel.js";
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
    const seller = await Seller.findById(sellerId).populate(
      "user",
      "phone email"
    );
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

      //  Only first index address is default
      if (validatedAddresses.length > 0) {
        const newAddr = validatedAddresses[0];

        if (seller.shopAddresses.length > 0) {
          // merge old + new
          seller.shopAddresses[0] = {
            ...seller.shopAddresses[0]._doc, // purana fields rakho
            ...newAddr, // jo naye aaye overwrite karega
          };
        } else {
          // agar pehle koi address hi nahi tha
          seller.shopAddresses = [newAddr];
        }
      }
    }

    //  update seller document
    seller.shopName = shopName;
    seller.shopImage = shopImage || seller.shopImage;
    seller.shopImages = shopImages.length > 0 ? shopImages : seller.shopImages;
    seller.categories = parsedCategories;
    seller.brands = parsedBrands || [];

    if (incrementOnboarding) {
      // seller.onboardingStep = seller.onboardingStep + 1;
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

export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user._id; // from fetchUser middleware
    const { gstNumber, beneficiaryName, accountNumber, ifscCode } = req.body;

    // === 1. Mandatory Bank Details Validation ===
    if (!beneficiaryName || beneficiaryName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Beneficiary name must be at least 3 characters",
      });
    }
    if (!/^[A-Za-z ]+$/.test(beneficiaryName)) {
      return res.status(400).json({
        success: false,
        message: "Beneficiary name should contain only alphabets and spaces",
      });
    }
    if (!accountNumber || !/^[0-9]{9,18}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Account number must be 9-18 digits",
      });
    }
    if (!ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid IFSC code format (e.g. HDFC0001234)",
      });
    }

    // === 2. Find Seller linked to this User ===
    const seller = await Seller.findOne({ user: userId });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    // === 3. Optional GST Validation + Uniqueness Check ===
    if (gstNumber) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid GST number format",
        });
      }

      // check uniqueness (exclude current seller if updating)
      const existingGST = await Seller.findOne({
        gstNumber,
        _id: { $ne: seller._id },
      });
      if (existingGST) {
        return res.status(400).json({
          success: false,
          message: "GST number is already registered with another seller",
        });
      }

      seller.gstNumber = gstNumber;
      // seller.gstVerified = false;
    }

    // === 4. Bank Account Uniqueness Check ===
    const existingBank = await Seller.findOne({
      "bankDetails.account_number": accountNumber,
      _id: { $ne: seller._id },
    });
    if (existingBank) {
      return res.status(400).json({
        success: false,
        message:
          "Bank account number is already registered with another seller",
      });
    }

    // Save Bank Details
    seller.bankDetails = {
      beneficiary_name: beneficiaryName.trim(),
      account_number: accountNumber,
      ifsc: ifscCode.toUpperCase(),
    };

    // === 5. Mark Seller Onboarding Complete ===
    seller.isOnboardingComplete = true;
    seller.status = "active";
    await seller.save();

    // === 6. Update User record also ===
    await User.findByIdAndUpdate(userId, {
      isOnboardingComplete: true,
      status: "active",
      sellerId: seller._id,
    });

    return res.status(200).json({
      success: true,
      message: "Seller onboarding completed successfully",
      seller,
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Start free trial for new sellers
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
      { isOnboardingComplete: true, status: "active" }
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
