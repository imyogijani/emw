import { createClient } from "redis";
import redisMock from "redis-mock";

let redisClient;

// Dev/testing  (mock)
if (process.env.USE_REDIS_MOCK === "true") {
  redisClient = redisMock.createClient();
} else {
  // Real Redis client
  redisClient = createClient({
    url: "redis://localhost:6379",
  });
}

// Error logs
redisClient.on("error", (err) => {
  console.error("❌ [Redis Error] =>", err.message);
});

redisClient.on("reconnecting", () => {
  console.warn("⚠️ [Redis] Reconnecting...");
});

redisClient.on("connect", () => {
  console.log("🔗 [Redis] Connection established...");
});

redisClient.on("ready", () => {
  console.log("✅ [Redis] Client is ready for commands...");
});

redisClient.on("end", () => {
  console.warn("🔌 [Redis] Connection closed.");
});

//  only for real Redis client connections
if (!process.env.USE_REDIS_MOCK) {
  await redisClient.connect();
}

export default redisClient;

// Live/Production (e.g. AWS, Render, Railway, etc.) →
// Yaha tumhe Redis ka cloud URL dena hoga, jo service provider deta hai. Example:

// const redisClient = createClient({
//   url: "redis://default:password@redis-xxxx.c123.ap-south-1-1.ec2.cloud.redislabs.com:6379",
// });
