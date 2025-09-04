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
// import { importGujaratPincodes } from "./importHSN.js";
// import crypto from "crypto";

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });
console.log("MONGO_URI:", process.env.MONGO_URI);

// MongoDB connection
import connectDB, { checkDatabaseHealth } from "./config/db.js";
import { initializeEnvironmentValidation } from "./utils/envValidator.js";

// Initialize environment validation
initializeEnvironmentValidation();

await connectDB();

// await importGujaratPincodes();

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
// Add cache control headers
app.use((req, res, next) => {
  // For CSS and JS files
  if (req.url.match(/\.(css|js)$/)) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

app.use(express.json());
// Enhanced CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://192.168.1.101:5173",
      "http://89.116.23.115:5173",
      "https://emallworld.com",
      "https://www.emallworld.com",
      "https://api.emallworld.com"
    ];
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-HTTP-Method-Override"
  ],
  credentials: true,
  exposedHeaders: ["Content-Disposition"],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(morgan("dev"));

// Static files for uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/uploads"), {
    maxAge: "1d",
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Remove Cross-Origin-Resource-Policy header to fix ORB blocking
      // res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
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
import newLocationRoutes from "./routes/newLocationRoutes.js";
import shopAddressRoutes from "./routes/shopAddressRoutes.js";
import hsnRoutes from "./routes/hsnRoutes.js";
import shopTimingRoutes from "./routes/shopTimingRoutes.js";
import sellerOnboardingRoutes from "./routes/sellerOnboardingRoutes.js";
import shopCategoryRoutes from "./routes/shopCategoryRoutes.js";
import sellerDocumentRoutes from "./routes/sellerDocumentRoutes.js";
//import paymentRoutes from "./routes/paymentRoutes.js";
//import payoutRoutes from "./routes/payoutRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import wayBillRoutes from "./routes/wayBillRoutes.js";
import shipmentRoutes from "./routes/shipmentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

import "./cronJobs/offerExpiryJob.js";
import "./cronJobs/dealCleanup.js";
import "./cronJobs/disableExpiredPremiums.js";
import "./cronJobs/checkExpiredSubscriptions.js";
// import "./cronJobs/sellerDocumentCleanUp.js";

// Health Check Endpoint
app.get('/health', (req, res) => {
  const dbHealth = checkDatabaseHealth();
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: dbHealth.status,
      readyState: dbHealth.readyState,
      host: dbHealth.host,
      name: dbHealth.name,
      port: dbHealth.port
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
  
  // Set status code based on database connectivity
  const statusCode = dbHealth.status === 'connected' ? 200 : 503;
  
  res.status(statusCode).json(healthStatus);
});

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/locations", newLocationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/variants", productVariantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/invoice", invoiceRoutes);
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
app.use("/api/hsn", hsnRoutes);
app.use("/api/shop-timing", shopTimingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/seller", sellerOnboardingRoutes);
app.use("/api/shop", shopCategoryRoutes);
app.use("/api/seller-documents", sellerDocumentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/waybills", wayBillRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/webhook", webhookRoutes);
//app.use("/api/payment", paymentRoutes);
// app.use("/api/payout", payoutRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/test-notification", testNotificationRouter);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ga-proxy", gaProxyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/images", imageRoutes);

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
