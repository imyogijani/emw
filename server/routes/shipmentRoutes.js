// routes/shipmentRoutes.js
import express from "express";
import {
  generateShipmentsForOrder,
  listSellerShipments,
  downloadLabel,
  requestPickup,
  trackShipment,
} from "../controllers/shipmentController.js";
import { authenticateToken, fetchUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only after order is created & payment confirmed
router.post("/generate", authenticateToken, generateShipmentsForOrder);

// Seller panel list
router.get(
  "/seller/:sellerId",
  authenticateToken,
  fetchUser,
  listSellerShipments
);

// Download label by waybill
router.get("/label/:waybill", authenticateToken, downloadLabel);

// Optional Pickup trigger (seller clicks)
// router.post("/pickup", authenticateToken, fetchUser, async (req, res) => {
//   const data = await createPickupRequest(req.body.pickupLocation);
//   res.json({ success: !!data, data });
// });

// Improve logic : Cron job - daily check any seller forget manually  not pickup request sends .
router.post("/request-pickup", authenticateToken, fetchUser, requestPickup);

// Track
router.get("/track/:waybill", authenticateToken, async (req, res) => {
  const data = await trackShipment(req.params.waybill);
  res.json({ success: !!data, data });
});

export default router;
