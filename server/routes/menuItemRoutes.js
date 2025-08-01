import express from "express";
import {
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getHomeMenuItems,
  toggleStatus,
  getAllProductMenusWithFilters,
} from "../controllers/menuItemController.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeAdmin, createMenuItem);
router.get("/home", getHomeMenuItems);
router.get("/products", getAllProductMenusWithFilters);
router.get("/all", getAllMenuItems);
router.get("/:id", getMenuItemById);
router.put("/:id", authenticateToken, authorizeAdmin, updateMenuItem);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteMenuItem);
router.patch("/:id/status", authenticateToken, authorizeAdmin, toggleStatus);

export default router;
