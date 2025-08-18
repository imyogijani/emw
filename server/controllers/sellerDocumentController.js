import fs from "fs";
import path from "path";
import SellerDocument from "../models/sellerDocument.js";
import { encryptFile, decryptFile } from "../utils/encryption.js";
import { processFile } from "../utils/fileProcessing.js";

// Upload documents
export const uploadDocuments = async (req, res) => {
  try {
    const sellerId = req.user.sellerId; // from auth middleware
    const files = req.files;
    if (!files || files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    const uploadedDocs = [];

    for (const fieldName in files) {
      const fileArray = files[fieldName]; // yeh array hota hai
      for (const file of fileArray) {
        const { encrypted, iv, salt, authTag } = await processFile(file.path);

        const encryptedFilePath = path.join(
          "storage/private_docs",
          file.filename + ".enc"
        );
        fs.writeFileSync(encryptedFilePath, encrypted);

        const doc = await SellerDocument.create({
          seller: sellerId,
          docType: fieldName,
          docNumber: req.body[fieldName + "_number"] || null,
          filePath: encryptedFilePath,
          iv,
          salt,
          authTag,
        });

        uploadedDocs.push(doc);
        // fs.unlinkSync(file.path);
        deleteFile(file.path);
      }
    }

    res.status(201).json({ success: true, uploadedDocs });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Upload failed", error: error.message });
  }
};

// Download / View document
export const viewDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await SellerDocument.findById(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Access control
    if (
      req.user.role !== "admin" &&
      (!req.user.sellerId ||
        doc.seller.toString() !== req.user.sellerId.toString())
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const encryptedBuffer = fs.readFileSync(doc.filePath);
    const decrypted = decryptFile(
      encryptedBuffer,
      doc.iv,
      doc.salt,
      doc.authTag
    );

    // 🔑 Detect mime-type dynamically
    let mimeType = "application/pdf";
    if (doc.docType.endsWith(".jpg") || doc.docType.endsWith(".jpeg"))
      mimeType = "image/jpeg";
    else if (doc.docType.endsWith(".png")) mimeType = "image/png";

    res.setHeader("Content-Type", mimeType);

    // 🟢 inline show in browser (not download)
    res.setHeader("Content-Disposition", `inline; filename="${doc.docType}"`);

    res.send(decrypted);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to view document", error: error.message });
  }
};

// DOWNLOAD Document (force download)
export const downloadDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await SellerDocument.findById(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Access control
    if (
      req.user.role !== "admin" &&
      (!req.user.sellerId ||
        doc.seller.toString() !== req.user.sellerId.toString())
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const encryptedBuffer = fs.readFileSync(doc.filePath);
    const decrypted = decryptFile(
      encryptedBuffer,
      doc.iv,
      doc.salt,
      doc.authTag
    );

    // detect mime type
    let mimeType = "application/pdf";
    if (doc.docType.endsWith(".jpg") || doc.docType.endsWith(".jpeg"))
      mimeType = "image/jpeg";
    else if (doc.docType.endsWith(".png")) mimeType = "image/png";

    res.setHeader("Content-Type", mimeType);

    // ⬇️ force download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${doc.docType}"`
    );

    res.send(decrypted);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to download document", error: error.message });
  }
};

// Update documents (single ya multiple)
export const updateDocuments = async (req, res) => {
  try {
    const sellerId = req.user.sellerId;
    const files = req.files;
    if (!files || Object.keys(files).length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    const updatedDocs = [];

    for (const fieldName in files) {
      const fileArray = files[fieldName];
      for (const file of fileArray) {
        // 🔎 Pehle purana doc check karo
        const oldDoc = await SellerDocument.findOne({
          seller: sellerId,
          docType: fieldName,
        });

        // Agar purana hai to uska file delete karo
        if (oldDoc) {
          if (fs.existsSync(oldDoc.filePath)) {
            fs.unlinkSync(oldDoc.filePath);
          }
          await SellerDocument.deleteOne({ _id: oldDoc._id });
        }

        // 🔐 Encrypt new file
        const { encrypted, iv, salt, authTag } = await processFile(file.path);
        const encryptedFilePath = path.join(
          "storage/private_docs",
          file.filename + ".enc"
        );
        fs.writeFileSync(encryptedFilePath, encrypted);

        // 🔄 Save new doc
        const newDoc = await SellerDocument.create({
          seller: sellerId,
          docType: fieldName,
          docNumber: req.body[fieldName + "_number"] || null,
          filePath: encryptedFilePath,
          iv,
          salt,
          authTag,
        });

        updatedDocs.push(newDoc);

        // Temp file delete
        deleteFile(file.path);
      }
    }

    res.status(200).json({
      success: true,
      message: "Documents updated successfully",
      updatedDocs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update documents",
      error: error.message,
    });
  }
};

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      //   console.log(`Deleted temp file: ${filePath}`);
    }
  } catch (err) {
    console.error(`Failed to delete temp file: ${filePath}`, err);
  }
};
