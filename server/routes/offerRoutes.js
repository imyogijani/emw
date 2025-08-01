import express from "express";
import {
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
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

export default router;
