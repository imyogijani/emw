
// routes/userRoutes.js
import express from "express";
import { updatePushToken } from "../controllers/userController.js";
const router = express.Router();

router.post("/update-push-token", updatePushToken);

export default router;
