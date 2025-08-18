import ShopTiming from "../models/shopTimingModel.js";
import { validateShopTimings } from "../utils/validateShopTiming.js";
import Seller from "../models/sellerModel.js";

// Create or update shop timing
export const upsertShopTiming = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const {
      shopTimingMode,
      shopTimings,
      appointmentDetails,
      incrementOnboarding,
    } = req.body;

    // Validate mode
    if (!["24/7", "scheduled", "appointment"].includes(shopTimingMode)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid shopTimingMode" });
    }

    // If mode is scheduled, validate timings
    if (shopTimingMode === "scheduled") {
      const error = validateShopTimings(shopTimings);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
    }

    // Upsert document
    let shopTiming = await ShopTiming.findOne({ seller: sellerId });
    if (shopTiming) {
      // Update existing
      shopTiming.shopTimingMode = shopTimingMode;
      shopTiming.shopTimings =
        shopTimingMode === "scheduled" ? shopTimings : {};
      shopTiming.appointmentDetails =
        shopTimingMode === "appointment" ? appointmentDetails : {};
      await shopTiming.save();
    } else {
      // Create new
      shopTiming = new ShopTiming({
        seller: sellerId,
        shopTimingMode,
        shopTimings: shopTimingMode === "scheduled" ? shopTimings : {},
        appointmentDetails:
          shopTimingMode === "appointment" ? appointmentDetails : {},
      });
      await shopTiming.save();
    }

    if (incrementOnboarding) {
      const seller = await Seller.findById(sellerId);
      if (seller) {
        seller.onboardingStep = (seller.onboardingStep || 0) + 1; // dynamic increment
        await seller.save();
      }
    }

    res.status(200).json({ success: true, data: shopTiming });
  } catch (error) {
    console.error("Error in upsertShopTiming:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get shop timing by seller
export const getShopTiming = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const shopTiming = await ShopTiming.findOne({ seller: sellerId });
    if (!shopTiming) {
      return res
        .status(404)
        .json({ success: false, message: "Shop timing not found" });
    }
    res.status(200).json({ success: true, data: shopTiming });
  } catch (error) {
    console.error("Error in getShopTiming:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete shop timing (optional)
export const deleteShopTiming = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    await ShopTiming.findOneAndDelete({ seller: sellerId });
    res.status(200).json({ success: true, message: "Shop timing deleted" });
  } catch (error) {
    console.error("Error in deleteShopTiming:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateShopTiming = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const { shopTimingMode, shopTimings, appointmentDetails } = req.body;

    const shopTiming = await ShopTiming.findOne({ seller: sellerId });
    if (!shopTiming) {
      return res
        .status(404)
        .json({ success: false, message: "Shop timing not found" });
    }

    // 1️⃣ Update shopTimingMode if provided
    if (shopTimingMode) {
      if (!["24/7", "scheduled", "appointment"].includes(shopTimingMode)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid shopTimingMode" });
      }
      shopTiming.shopTimingMode = shopTimingMode;
    }

    // 2️⃣ Update shopTimings partially if provided
    if (shopTimings && typeof shopTimings === "object") {
      // Validate only if mode is scheduled
      if (
        shopTimingMode === "scheduled" ||
        shopTiming.shopTimingMode === "scheduled"
      ) {
        const error = validateShopTimings(shopTimings);
        if (error) {
          return res.status(400).json({ success: false, message: error });
        }
      }

      // Merge day-wise instead of replacing all
      Object.keys(shopTimings).forEach((day) => {
        shopTiming.shopTimings[day] = shopTimings[day];
      });
    }

    // 3️⃣ Update appointmentDetails partially if provided
    if (appointmentDetails && typeof appointmentDetails === "object") {
      shopTiming.appointmentDetails = {
        ...shopTiming.appointmentDetails,
        ...appointmentDetails,
      };
    }

    await shopTiming.save();
    res.status(200).json({ success: true, data: shopTiming });
  } catch (error) {
    console.error("Error in patchShopTiming:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
