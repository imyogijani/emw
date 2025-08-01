import express from "express";
import {
  createTechnicalDetails,
  updateTechnicalDetails,
  deleteTechnicalDetails,
  getTechnicalDetailsById,
  getMyTechnicalDetails,
  getAllTechnicalDetails,
} from "../controllers/technicalDetailsController.js";
import {
  authenticateToken,
  authorizeSeller,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeSeller, createTechnicalDetails);
router.patch(
  "/:id",
  authenticateToken,
  authorizeSeller,
  updateTechnicalDetails
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeSeller,
  deleteTechnicalDetails
);
router.get("/my", authenticateToken, authorizeSeller, getMyTechnicalDetails);
router.get("/all", authenticateToken, authorizeAdmin, getAllTechnicalDetails);// admin
router.get("/:id", getTechnicalDetailsById); 

// routes/technicalDetails.js

export default router;
