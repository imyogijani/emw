// routes/cartRoutes.js
import express from "express";
import {
  addToCart,
  getUserCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from "../controllers/cartController.js";

import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/add", authenticateToken, addToCart);
router.get("/:userId", getUserCart);
router.post("/remove", authenticateToken, removeFromCart);
router.post("/update", authenticateToken, updateCartQuantity);
router.delete("/clear/:userId", clearCart);

export default router;
