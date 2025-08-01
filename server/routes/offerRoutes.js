import express from "express";
import {
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
  getTodaysOffers,
} from "../controllers/offerController.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/create", authenticateToken, authorizeAdmin, createOffer);
router.get("/all", authenticateToken, getAllOffers);
router.put("/update/:id", authenticateToken, authorizeAdmin, updateOffer);
router.delete("/delete/:id", authenticateToken, authorizeAdmin, deleteOffer);
router.get("/today", getTodaysOffers);

export default router;
