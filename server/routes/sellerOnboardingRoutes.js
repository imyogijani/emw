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
 
} from "../controllers/onBoardingController.js";

const router = express.Router();


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



export default router;
