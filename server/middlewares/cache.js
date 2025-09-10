// // middlewares/cache.js
// import redisClient from "../config/redis.js";

// // Middleware for caching GET APIs
// export const cacheMiddleware = (ttl = 60) => {
//   return async (req, res, next) => {
//     try {
//       const cacheKey = req.originalUrl;

//       console.log("\n---------------------------");
//       console.log("⚡ [CACHE MIDDLEWARE]");
//       console.log("🔍 Triggered for:", req.method, "CashKey --> ", cacheKey);
//       console.log(`⏳ TTL: ${ttl} seconds`);

//       // 1️⃣ Redis me check karo
//       const cachedData = await redisClient.get(cacheKey);

//       console.log("🔑 Cache Data:", cachedData);

//       if (cachedData) {
//         console.log("🔑 Cache Data Found:", cachedData.slice(0, 100) + "..."); // sirf first 100 chars print karna safe hai
//         console.log("✅ STATUS: HIT");
//         console.log("📦 Data Size:", cachedData.length, "chars");
//         console.log("---------------------------\n");
//         return res.json(JSON.parse(cachedData));
//       } else {
//         console.log("🔑 Cache Data: NONE (MISS)");
//         console.log("❌ STATUS: MISS");
//       }

//       // 2️⃣ Response ko intercept karke cache me save karna
//       const originalJson = res.json.bind(res);
//       const originalSend = res.send.bind(res);

//       res.json = async (data) => {
//         try {
//           const stringified = JSON.stringify(data);
//           await redisClient.setEx(cacheKey, ttl, stringified);
//           console.log("💾 STATUS: SAVED (json)");
//         } catch (err) {
//           console.error("⚠️ Cache Save Failed (json):", err.message);
//         }
//         return originalJson(data);
//       };

//       res.send = async (data) => {
//         try {
//           const stringified =
//             typeof data === "string" ? data : JSON.stringify(data);
//           await redisClient.setEx(cacheKey, ttl, stringified);
//           console.log("💾 STATUS: SAVED (send)");
//         } catch (err) {
//           console.error("⚠️ Cache Save Failed (send):", err.message);
//         }
//         return originalSend(data);
//       };

//       next();
//     } catch (err) {
//       console.error("🚨 [CACHE MIDDLEWARE ERROR]:", err.message);
//       console.log("---------------------------\n");
//       next();
//     }
//   };
// };

// middlewares/cache.js
import redisClient from "../config/redis.js";

// Middleware for caching GET APIs
export const cacheMiddleware = (ttl = 60) => {
  return async (req, res, next) => {
    try {
      const cacheKey = req.originalUrl;

      console.log("\n---------------------------");
      console.log("⚡ [CACHE MIDDLEWARE]");
      console.log("🔍 Triggered for:", req.method, "CacheKey -->", cacheKey);
      console.log(`⏳ TTL: ${ttl} seconds`);
      console.log(
        "🧪 Redis Mode:",
        process.env.USE_REDIS_MOCK === "true" ? "MOCK" : "REAL"
      );

      // 1️⃣ Check cache
      let cachedData;
      if (typeof redisClient.get === "function") {
        cachedData = await redisClient.get(cacheKey);
      }

      if (cachedData) {
        console.log("🔑 Cache Data Found:", cachedData.slice(0, 100) + "...");
        console.log("✅ STATUS: HIT");
        console.log("📦 Data Size:", cachedData.length, "chars");
        console.log("---------------------------\n");
        return res.json(JSON.parse(cachedData));
      } else {
        console.log("🔑 Cache Data: NONE (MISS)");
        console.log("❌ STATUS: MISS");
      }

      // 2️⃣ Response intercept
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      const saveToCache = async (data, type = "json") => {
        const stringified =
          typeof data === "string" ? data : JSON.stringify(data);
        if (typeof redisClient.setEx === "function") {
          try {
            await redisClient.setEx(cacheKey, ttl, stringified);
            console.log(`💾 STATUS: SAVED (${type})`);
            console.log("📦 Saved Data Size:", stringified.length, "chars");
          } catch (err) {
            console.error(`⚠️ Cache Save Failed (${type}):`, err.message);
          }
        } else {
          console.log(`💾 [MOCK] Cache not saved (${type})`);
        }
      };

      res.json = async (data) => {
        await saveToCache(data, "json");
        return originalJson(data);
      };

      res.send = async (data) => {
        await saveToCache(data, "send");
        return originalSend(data);
      };

      next();
    } catch (err) {
      console.error("🚨 [CACHE MIDDLEWARE ERROR]:", err.message);
      console.log("---------------------------\n");
      next();
    }
  };
};
    