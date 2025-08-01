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
import { expireDeals } from "./cronExpireDeals.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with absolute path
dotenv.config({ path: path.join(__dirname, "../.env") });

// Debug logging
console.log("MONGO_URI:", process.env.MONGO_URI);

import connectDB from "./config/db.js";
//mongodb Connection
connectDB();

// rest object
const app = express();

//middlewares
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(morgan("dev"));
// app.use(fileUpload());

// Configure static file serving with proper headers and caching
app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/uploads"), {
    maxAge: "1d", // Cache for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (
        path.endsWith(".jpg") ||
        path.endsWith(".jpeg") ||
        path.endsWith(".png") ||
        path.endsWith(".gif")
      ) {
        res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
        res.setHeader("Content-Type", "image/" + path.split(".").pop());
      }
    },
  })
);

// Serve other static files
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1h",
    etag: true,
  })
);

//routs
//1 test route
// app.get("/", (req, res) => {
//   res.status(200).json({
//     message: "Welcome to LifeConnect",
//   });
// });
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
import "./cronJobs/offerExpiryJob.js";
import "./cronJobs/dealCleanup.js";
import "./cronJobs/disableExpiredPremiums.js";
import "./cronJobs/checkExpiredSubscriptions.js";

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
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
app.use("/api/users", userRoutes);
app.use("/api/test-notification", testNotificationRouter);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/analytics", gaProxyRoutes);
app.use("/api/notifications", notificationRoutes);

// app.use("/api/v1/inventory", require("./routes/inventoryRoutes"));

// Schedule deal expiration every hour
cron.schedule("0 * * * *", async () => {
  try {
    await expireDeals();
    console.log("[CRON] Deal expiration check completed.");
  } catch (err) {
    console.error("[CRON] Error running deal expiration:", err);
  }
});

// to see sever is proper running
// http://localhost:8080/
// http://localhost:5173/
//add port
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `Node server running in ${process.env.DEV_MODE} mode on Port ${process.env.PORT}`
      .bgBlue.white
  );
});
