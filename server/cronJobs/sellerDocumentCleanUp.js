import cron from "node-cron";
import fs from "fs";
import path from "path";
import logger from "../utils/logger.js"; // your custom logger

const TEMP_FOLDER = "storage/temp_uploads";

// Run every 30 seconds
const tempFolderCleanup = cron.schedule("0 * * * * *", () => {
  logger("🔁 Cron: Starting temp folder cleanup...");

  try {
    const files = fs.readdirSync(TEMP_FOLDER);

    if (files.length === 0) {
      logger("✅ No temp files to delete.");
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(TEMP_FOLDER, file);
      try {
        fs.unlinkSync(filePath);
        logger(`🗑️ Deleted temp file: ${filePath}`);
      } catch (err) {
        logger(`Failed to delete file: ${filePath}`, err);
      }
    });

    logger("🧹 Temp folder cleanup completed.");
  } catch (err) {
    logger("Failed to read temp folder:", err);
  }
});

export default tempFolderCleanup;
