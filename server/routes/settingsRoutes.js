import { Router } from "express";
import {
  getSettings,
  updateSettings,
  updateOnboardingSettings,
} from "../controllers/settingsController.js";
// TODO: add admin auth middleware in real app
const router = Router();

router.get("/", getSettings);
router.put("/", updateSettings);
router.put("/onboarding", updateOnboardingSettings);

export default router;
