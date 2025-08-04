// routes/invoiceRoutes.js
import express from "express";
import {
  getAllInvoicesAdmin,
  getInvoicesByUser,
  getInvoicesBySeller,
} from "../controllers/invoiceController.js";

const router = express.Router();

// Admin routes
router.get("/admin", getAllInvoicesAdmin);

// User route
router.get("/user/:id", getInvoicesByUser);

// Seller route
router.get("/seller/:id", getInvoicesBySeller);

export default router;
