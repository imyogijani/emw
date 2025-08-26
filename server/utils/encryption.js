import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.APP_SECRET; // strong secret

const APP_SECRET = process.env.APP_SECRET;
// console.log("APP_SECRET:", APP_SECRET);
if (!APP_SECRET) throw new Error("APP_SECRET not defined in .env");

// Encrypt buffer
export const encryptFile = (buffer) => {
  const iv = crypto.randomBytes(16); // random IV
  const salt = crypto.randomBytes(16); // salt for key derivation
  const key = crypto.scryptSync(APP_SECRET, salt, 32); // derive key
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    salt: salt.toString("hex"),
    authTag: authTag.toString("hex"),
  };
};

// Decrypt buffer
export const decryptFile = (encryptedBuffer, ivHex, saltHex, authTagHex) => {
  const iv = Buffer.from(ivHex, "hex");
  const salt = Buffer.from(saltHex, "hex");
  const key = crypto.scryptSync(APP_SECRET, salt, 32);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);
  return decrypted;
};
