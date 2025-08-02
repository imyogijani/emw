import express from "express";
import {
  createVariant,
  getVariant,
  getProductVariants,
  updateVariant,
  deleteVariant,
} from "../controllers/variantController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/add", authenticateToken, upload.single("image"), createVariant);
router.get("/:id", getVariant); //  fixed
router.get("/product/:productId", getProductVariants); //  fixed
router.patch("/:id", upload.single("image"), updateVariant);
router.delete("/:id", deleteVariant);

export default router;
