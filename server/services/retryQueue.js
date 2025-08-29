// services/retryQueue.js
import Queue from "bull";
import { createShipment } from "../controllers/shipmentController.js"; // aapka shipment create logic

// Redis connection (retry queue ke liye Redis lagta hai)
const shipmentQueue = new Queue("shipment-retry-queue", {
  redis: { host: "127.0.0.1", port: 6379 }, // apne Redis ka config
});

// Job processor
shipmentQueue.process(async (job, done) => {
  try {
    console.log("🔄 Retrying shipment...", job.data);

    // Shipment dubara create karna
    const result = await createShipment(
      job.data.order,
      job.data.item,
      job.data.seller,
      job.data.shippingAddress
    );

    if (result) {
      console.log("✅ Retry success:", result.waybill);
      done();
    } else {
      throw new Error("Shipment retry failed");
    }
  } catch (error) {
    console.error("❌ Retry failed:", error.message);
    done(error); // ye Bull queue ko batayega ki fail hua
  }
});

// Retry function export
export const addToRetryQueue = async (payload) => {
  await shipmentQueue.add(payload, {
    attempts: 5, // max 5 retries
    backoff: {
      type: "exponential", // 2s, 4s, 8s, ...
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
};

export default shipmentQueue;
