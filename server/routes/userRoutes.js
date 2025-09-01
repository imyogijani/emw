// routes/userRoutes.js
import express from "express";
import {
  updatePushToken,
  getCustomerWithOrderSummary,
  getUserAddress,
} from "../controllers/userController.js";

import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/update-push-token", updatePushToken);
router.get("/customer/:userId", getCustomerWithOrderSummary);
router.get("/address", authenticateToken, fetchUser, getUserAddress);

export default router;
