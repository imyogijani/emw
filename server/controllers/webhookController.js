// controllers/webhookController.js
import Order from "../models/orderModel.js";

export const delhiveryWebhook = async (req, res) => {
  try {
    // 🔐 Verify secret header (optional but recommended)
    if (process.env.WEBHOOK_SECRET) {
      const sig =
        req.headers["x-webhook-signature"] ||
        req.headers["x-delhivery-signature"];
      if (!sig || sig !== process.env.WEBHOOK_SECRET) {
        return res
          .status(401)
          .json({ ok: false, message: "Invalid signature" });
      }
    }

    const payload = req.body; // body should be JSON
    // Example payload from Delhivery (adjust per docs)
    // { waybill: "WB123", status: "Delivered", event: "DELIVERED", timestamp: "2025-08-28T10:00:00Z" }

    const waybill = payload.waybill || payload.wb || payload.awb;
    const status = payload.status || payload.event || payload.current_status;

    if (!waybill) {
      return res.status(400).json({ ok: false, message: "No waybill found" });
    }

    // Find all orders containing this waybill in items
    const orders = await Order.find({ "items.deliveryTrackingId": waybill });

    if (!orders || orders.length === 0) {
      console.warn("⚠️ Webhook for unknown waybill:", waybill);
      return res.json({ ok: true, message: "waybill_not_found" });
    }

    for (const order of orders) {
      let changed = false;

      for (const item of order.items) {
        if (String(item.deliveryTrackingId) === String(waybill)) {
          const lower = String(status).toLowerCase();

          if (lower.includes("delivered")) {
            item.shipmentStatus = "success";
            item.deliveryStatus = "delivered";
            item.deliveredAt = new Date(payload.timestamp || Date.now());
            order.deliveredAt = item.deliveredAt;

            // add timeline entry
            order.timeline.push({ status: "delivered", time: new Date() });
          } else if (
            lower.includes("in transit") ||
            lower.includes("intransit") ||
            lower.includes("transit")
          ) {
            item.shipmentStatus = "success"; // shipment created & moving
            item.deliveryStatus = "shipped";
            order.timeline.push({ status: "in_transit", time: new Date() });
          } else if (lower.includes("out for delivery")) {
            item.deliveryStatus = "out_for_delivery";
            order.timeline.push({ status: "in_transit", time: new Date() });
          } else if (lower.includes("rto") || lower.includes("return")) {
            item.deliveryStatus = "returned";
            order.timeline.push({ status: "cancelled", time: new Date() });
          } else {
            // fallback
            item.deliveryStatus = lower;
          }

          changed = true;
        }
      }

      if (changed) {
        // 🚀 Auto-update orderStatus globally if all items delivered
        const allDelivered = order.items.every(
          (it) => it.deliveryStatus === "delivered"
        );
        if (allDelivered) {
          order.orderStatus = "delivered";
          order.deliveredAt = new Date();
        }

        await order.save();
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
