import express from "express";
import {
  createTechnicalDetails,
  updateTechnicalDetails,
  deleteTechnicalDetails,
  getTechnicalDetailsById,
  getMyTechnicalDetails,
  getAllTechnicalDetails,
  saveTechnicalDetails,
} from "../controllers/technicalDetailsController.js";
import {
  authenticateToken,
  authorizeSeller,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";

import { checkAccountStatus } from "../middlewares/checkStatus.js";

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  authorizeSeller,
  checkAccountStatus,
  createTechnicalDetails
);
router.post(
  "/:subCategoryId",
  authenticateToken,
  authorizeSeller,
  checkAccountStatus,
  saveTechnicalDetails
);
router.patch(
  "/:id",
  authenticateToken,
  authorizeSeller,
  checkAccountStatus,
  updateTechnicalDetails
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeSeller,
  deleteTechnicalDetails
);
router.get("/my", authenticateToken, authorizeSeller, getMyTechnicalDetails);
router.get("/all", authenticateToken, authorizeAdmin, getAllTechnicalDetails); // admin
router.get("/:id", getTechnicalDetailsById);

// routes/technicalDetails.js

export default router;
