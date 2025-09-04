import express from "express";
import Seller from "../models/sellerModel.js";
// import Subscription from "../models/subscriptionModel.js";

import {
  authenticateToken,
  authorizeSeller,
  fetchUser,
} from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { getOnboardingSettings } from "../middlewares/onboardingMiddleware.js";

import {
  onboardingStep1,
  completeOnboarding,
  startFreeTrial,
} from "../controllers/onBoardingController.js";

const router = express.Router();

router.post(
  "/complete-profile",
  authenticateToken,
  authorizeSeller,
  upload.single("shopLogo"),
  fetchUser,
  async (req, res) => {
    try {
      const { shopName, categories, brands, workingHours, subscriptionPlan } =
        req.body;

      // Get seller profile
      const seller = await Seller.findOne({ user: req.userId });
      if (!seller) {
        return res
          .status(404)
          .json({ success: false, message: "Seller not found" });
      }

      // Update seller profile
      seller.shopName = shopName;
      seller.categories = JSON.parse(categories);
      seller.brands = JSON.parse(brands);
      seller.shopImage = req.file
        ? `/uploads/${req.file.filename}`
        : seller.shopImage;

      // Save shop timings
      const timings = JSON.parse(workingHours);
      // await axios.post(`/api/shop-timing/${seller._id}`, { timings });

      // Handle subscription
      if (subscriptionPlan) {
        const subscription = await Subscription.findOne({
          planId: subscriptionPlan,
        });
        if (subscription) {
          seller.subscription = subscription._id;
          seller.subscriptionStartDate = new Date();
          seller.subscriptionEndDate = new Date(
            new Date().setMonth(
              new Date().getMonth() + subscription.durationInMonths
            )
          );
        }
      }

      await seller.save();

      res.json({
        success: true,
        message: "Profile completed successfully",
        seller,
      });
    } catch (error) {
      console.error("Complete profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to complete profile",
        error: error.message,
      });
    }
  }
);

router.post(
  "/onboarding/step1",
  upload.fields([
    { name: "shopImage", maxCount: 1 },
    { name: "shopImages", maxCount: 5 },
  ]),
  getOnboardingSettings,
  onboardingStep1
);

router.post(
  "/onboarding/complete",
  authenticateToken,
  authorizeSeller,
  fetchUser,
  getOnboardingSettings,
  completeOnboarding
);

router.post(
  "/start-free-trial",
  authenticateToken,
  authorizeSeller,
  fetchUser,
  startFreeTrial
);

export default router;
