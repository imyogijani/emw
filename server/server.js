/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import express from "express";
import dotenv from "dotenv";
import colors from "colors";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { exec } from "child_process";
import crypto from "crypto";

import { expireDeals } from "./cronExpireDeals.js";
import { importHSNData } from "./importHSN.js";
// import crypto from "crypto";

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });
console.log("MONGO_URI:", process.env.MONGO_URI);

// MongoDB connection
import connectDB from "./config/db.js";
connectDB();

// Create Express app
const app = express();
// const crypto = require("crypto");
// const { exec } = require("child_process");

// Middleware to parse JSON and store raw body
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Webhook secret (change to your real GitHub webhook secret)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Webhook route
app.post("/webhook", (req, res) => {
  try {
    const payload = req.rawBody;
    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    const digest = "sha256=" + hmac.update(payload).digest("hex");
    const signature = req.get("X-Hub-Signature-256");

    if (!signature || digest !== signature) {
      return res.status(403).send("Invalid signature");
    }

    console.log("✅ Valid webhook received");

    // Pull latest changes
    exec(
      "cd /var/www/emw && git pull origin main && cd client && npm run build",
      (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Build error:", stderr);
          return res.status(500).send("Deployment failed");
        }
        console.log("✅ Code pulled & frontend built");
        res.send("Deployed");
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Webhook error");
  }
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.1.101:5173",
      "http://89.116.23.115:5173",
      "https://emallworld.com",
      "https://www.emallworld.com",
    ], // Add production domain here if needed

    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(morgan("dev"));

// Static files for uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/uploads"), {
    maxAge: "1d",
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (
        path.endsWith(".jpg") ||
        path.endsWith(".jpeg") ||
        path.endsWith(".png") ||
        path.endsWith(".gif")
      ) {
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("Content-Type", "image/" + path.split(".").pop());
      }
    },
  })
);

// Public assets
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1h",
    etag: true,
  })
);

// Routes
import testRoutes from "./routes/testRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import gaProxyRoutes from "./routes/gaProxyRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import technicalDetailsRoutes from "./routes/technicalDetailsRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import menuRoutes from "./routes/menuItemRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import testNotificationRouter from "./routes/testNotification.js";
import productVariantRoutes from "./routes/productVariantRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import shopAddressRoutes from "./routes/shopAddressRoutes.js";
import shopTimingRoutes from "./routes/shopTimingRoutes.js";
//import paymentRoutes from "./routes/paymentRoutes.js";
//import payoutRoutes from "./routes/payoutRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import "./cronJobs/offerExpiryJob.js";
import "./cronJobs/dealCleanup.js";
import "./cronJobs/disableExpiredPremiums.js";
import "./cronJobs/checkExpiredSubscriptions.js";

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/variants", productVariantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/technical-details", technicalDetailsRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/shopaddress", shopAddressRoutes);
app.use("/api/shop-timing", shopTimingRoutes);
app.use("/api/users", userRoutes);
//app.use("/api/payment", paymentRoutes);
// app.use("/api/payout", payoutRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/test-notification", testNotificationRouter);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ga-proxy", gaProxyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// CRON: check for expired deals every hour
cron.schedule("0 * * * *", async () => {
  try {
    await expireDeals();
    console.log("[CRON] Deal expiration check completed.");
  } catch (err) {
    console.error("[CRON] Error running deal expiration:", err);
  }
});

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", "192.168.1.101", "89.116.23.115", () => {
  console.log(
    `Node server running in ${process.env.DEV_MODE} mode on Port ${PORT}`.bgBlue
      .white
  );
});
