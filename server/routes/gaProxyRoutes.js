// import express from "express";
// import axios from "axios";
// import dotenv from "dotenv";

// dotenv.config();

// const router = express.Router();

// // POST /api/analytics/ga-event
// // Proxy Google Analytics Measurement Protocol events from frontend
// router.post("/ga-event", async (req, res) => {
//   try {
//     const { payload } = req.body;
//     if (!payload) {
//       return res.status(400).json({ success: false, message: "Missing payload" });
//     }

//     // Google Analytics 4 Measurement Protocol endpoint
//     const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
//     const GA_API_SECRET = process.env.GA_API_SECRET;
//     if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
//       return res.status(500).json({ success: false, message: "GA credentials not set" });
//     }

//     const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;
//     const gaRes = await axios.post(url, payload, {
//       headers: { "Content-Type": "application/json" },
//     });
//     res.status(gaRes.status).json({ success: true });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error proxying GA event", error: error.message });
//   }
// });

// export default router;

import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
router.post("/ga-event", async (req, res) => {
  try {
    const { payload } = req.body;

    if (!payload) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payload" });
    }

    const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
    const GA_API_SECRET = process.env.GA_API_SECRET;

    if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
      return res
        .status(500)
        .json({ success: false, message: "GA credentials not set" });
    }

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

    const gaRes = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    // Safe optional logging
    console.log(
      "GA Event Tracked:",
      payload?.events?.[0]?.name,
      payload?.events?.[0]?.params
    );

    res.status(gaRes.status).json({ success: true });
  } catch (error) {
    console.error(
      "GA Event Proxy Error:",
      error?.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Error proxying GA event",
      error: error?.response?.data || error.message,
    });
  }
});

export default router;
