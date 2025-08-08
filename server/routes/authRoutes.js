/* eslint-disable no-undef */
import express from "express";
import {
  registerController,
  loginController,
  currentUserController,
  updateProfileController,
  uploadAvatarController,
  verifyToken,
  clearNotification,
  acceptPlanUpdateController,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import upload from "../middlewares/uploadMiddleware.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import path from "path";

const router = express.Router();

// Routes
// Register || POST
// router.post("/register", registerController);
router.post(
  "/register",
  upload.fields([
    { name: "shopImage", maxCount: 1 },
    { name: "shopImages", maxCount: 5 },
  ]),
  registerController
);

// Login || POST
router.post("/login", loginController);

// Get current user || GET
router.get("/current-user", authenticateToken, currentUserController);

// Update profile || PATCH
router.patch(
  "/update-profile",
  authenticateToken,
  upload.fields([
    { name: "shopImage", maxCount: 1 },
    { name: "shopImages", maxCount: 5 },
  ]),
  updateProfileController
);
// Verify token || GET
router.get("/verify-token", authenticateToken, verifyToken);

// Upload avatar || POST
router.post(
  "/upload-avatar",
  authenticateToken,
  upload.single("avatar"),
  uploadAvatarController
);

// Clear notification || PATCH
router.patch("/clear-notification", authenticateToken, clearNotification);

// Seller accepts updated plan
router.patch(
  "/accept-plan-update",
  authenticateToken,
  acceptPlanUpdateController
);

// Serve avatar images
router.get("/uploads/avatars/:filename", (req, res) => {
  const { filename } = req.params;
  res.sendFile(path.join(__dirname, "../public/uploads/avatars/", filename));
});

// Change password :

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
