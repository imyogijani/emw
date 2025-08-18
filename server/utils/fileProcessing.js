import sharp from "sharp"; // for image compression
import fs from "fs";
import path from "path";
import { encryptFile } from "./encryption.js";

// Compress & encrypt
export const processFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let buffer = fs.readFileSync(filePath);

  // If image, compress it
  if ([".jpg", ".jpeg", ".png"].includes(ext)) {
    buffer = await sharp(buffer)
      .resize({ width: 1200 }) // optional resize
      .jpeg({ quality: 80 }) // compress 80%
      .toBuffer();
  }

  const { encrypted, iv, salt, authTag } = encryptFile(buffer);
  return { encrypted, iv, salt, authTag };
};
