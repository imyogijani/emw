// routes/waybillRoutes.js
import express from "express";
const router = express.Router();
import { getWaybill, createWaybill } from "../controllers/waybillController.js";

// GET waybill
router.get("/", getWaybill);

// POST new waybill
router.post("/", createWaybill);

export default router;
