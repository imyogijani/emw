import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/categories", (req, res) => {
  const filePath = path.join(__dirname, "../data/shop-categories.json");
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to load categories" });
    }
    try {
      const categories = JSON.parse(data);
      res.json({ success: true, categories });
    } catch (e) {
      res.status(500).json({ success: false, message: "Invalid categories data" });
    }
  });
});

export default router;
