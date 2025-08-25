import { Router } from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";
// TODO: add admin auth middleware in real app
const router = Router();

router.get("/", getSettings);
router.put("/", updateSettings);

export default router;
