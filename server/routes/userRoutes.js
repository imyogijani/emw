
// routes/userRoutes.js
import express from "express";
import { updatePushToken,getCustomerWithOrderSummary } from "../controllers/userController.js";
const router = express.Router();

router.post("/update-push-token", updatePushToken);
router.get("/customer/:userId", getCustomerWithOrderSummary);

export default router;
