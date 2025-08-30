import fs from "fs";
import path from "path";
import SellerDocument from "../models/sellerDocument.js";
import Seller from "../models/sellerModel.js";
import { encryptFile, decryptFile } from "../utils/encryption.js";
import { processFile } from "../utils/fileProcessing.js";
import {
  addressProofDocs,
  identityProofDocs,
  businessProofDocs,
  documentCategoriesMap,
} from "../utils/documentCategories.js";

// Upload documents
export const uploadDocuments = async (req, res) => {
  try {
    const sellerId = req.user.sellerId;
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedDocs = [];
    let validationFailed = null; // track error msg

    // STEP 1: Validation phase
    for (const fieldName in files) {
      console.log("Got fieldName:", fieldName);
      const fileArray = files[fieldName];

      for (const file of fileArray) {
        const selectedCategories = req.body[fieldName + "_categories"];

        if (!selectedCategories) {
          validationFailed = `Please select categories for ${fieldName}`;
          break;
        }

        const categoryArr = selectedCategories.split(",");
        const allowedCategories = documentCategoriesMap[fieldName];

        if (!allowedCategories) {
          validationFailed = `Invalid document type: ${fieldName}`;
          break;
        }

        const isValid = categoryArr.some((c) =>
          allowedCategories.includes(c.trim())
        );

        if (!isValid) {
          validationFailed = `Invalid category selected for ${fieldName}. Allowed: ${allowedCategories.join(
            ", "
          )}`;
          break;
        }
      }

      if (validationFailed) break; // stop outer loop too
    }

    // Agar validation fail hua → sab temp files delete karke return kar do
    if (validationFailed) {
      for (const fieldName in files) {
        for (const file of files[fieldName]) {
          deleteFile(file.path); // cleanup all temp files
        }
      }

      return res.status(400).json({
        success: false,
        message: validationFailed,
      });
    }

    // STEP 2: Abhi tak sab validation pass hua → abhi files process + save karo
    for (const fieldName in files) {
      const fileArray = files[fieldName];
      for (const file of fileArray) {
        const selectedCategories = req.body[fieldName + "_categories"];
        const categoryArr = selectedCategories.split(",");

        const { encrypted, iv, salt, authTag } = await processFile(file.path);

        const encryptedFilePath = path.join(
          "storage/private_docs",
          file.filename + ".enc"
        );
        fs.writeFileSync(encryptedFilePath, encrypted);
        // get original extension
        const originalExt = path.extname(file.originalname);
        console.log("Upload doc : ", originalExt);

        const doc = await SellerDocument.create({
          seller: sellerId,
          docType: fieldName,
          docNumber: req.body[fieldName + "_number"] || null,
          categories: categoryArr,
          filePath: encryptedFilePath,
          iv,
          salt,
          authTag,
          originalExt,
        });

        uploadedDocs.push(doc);
        deleteFile(file.path); // temp delete after save
      }
    }

    if (req.body.incrementOnboarding) {
      const seller = await Seller.findById(sellerId);
      if (seller) {
        // seller.onboardingStep = (seller.onboardingStep || 0) + 1; // dynamic increment
        seller.onboardingStep = 4; // dynamic increment
        await seller.save();
      }
    }

    res.status(201).json({ success: true, uploadedDocs });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

// Download / View document
// export const viewDocument = async (req, res) => {
//   try {
//     const { docId } = req.params;
//     const doc = await SellerDocument.findById(docId);
//     if (!doc) return res.status(404).json({ message: "Document not found" });

//     // Access control
//     if (
//       req.user.role !== "admin" &&
//       (!req.user.sellerId ||
//         doc.seller.toString() !== req.user.sellerId.toString())
//     ) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const encryptedBuffer = fs.readFileSync(doc.filePath);
//     const decrypted = decryptFile(
//       encryptedBuffer,
//       doc.iv,
//       doc.salt,
//       doc.authTag
//     );

//     const ext = path.extname(doc.filePath).replace(".enc", "").toLowerCase();
//     let mimeType = "application/pdf";
//     if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
//     else if (ext === ".png") mimeType = "image/png";
//     else if (ext === ".pdf") mimeType = "application/pdf";

//     res.setHeader("Content-Type", mimeType);
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename="${doc.docType}${ext}"`
//     );

//     res.send(decrypted);
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Failed to view document", error: error.message });
//   }
// };

export const viewDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await SellerDocument.findById(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const encryptedBuffer = fs.readFileSync(doc.filePath);
    const decrypted = decryptFile(
      encryptedBuffer,
      doc.iv,
      doc.salt,
      doc.authTag
    );

    // set correct MIME type
    let mimeType = "application/octet-stream";
    if (doc.originalExt === ".pdf") mimeType = "application/pdf";
    else if (doc.originalExt === ".jpg" || doc.originalExt === ".jpeg")
      mimeType = "image/jpeg";
    else if (doc.originalExt === ".png") mimeType = "image/png";

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${doc.docType}${doc.originalExt}"`
    );

    res.send(decrypted);
  } catch (err) {
    console.error("View error:", err);
    res.status(500).json({ message: "Error viewing file" });
  }
};

// DOWNLOAD Document (force download)
// export const downloadDocument = async (req, res) => {
//   try {
//     const { docId } = req.params;
//     const doc = await SellerDocument.findById(docId);
//     if (!doc) return res.status(404).json({ message: "Document not found" });

//     // Access control
//     if (
//       req.user.role !== "admin" &&
//       (!req.user.sellerId ||
//         doc.seller.toString() !== req.user.sellerId.toString())
//     ) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const encryptedBuffer = fs.readFileSync(doc.filePath);
//     const decrypted = decryptFile(
//       encryptedBuffer,
//       doc.iv,
//       doc.salt,
//       doc.authTag
//     );

//     // detect mime type
//     let mimeType = "application/pdf";
//     if (doc.docType.endsWith(".jpg") || doc.docType.endsWith(".jpeg"))
//       mimeType = "image/jpeg";
//     else if (doc.docType.endsWith(".png")) mimeType = "image/png";

//     res.setHeader("Content-Type", mimeType);

//     // ⬇️ force download
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="${doc.docType}"`
//     );

//     res.send(decrypted);
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Failed to download document", error: error.message });
//   }
// };

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

    //  detect mime type from originalExt
    let mimeType = "application/octet-stream";
    if (doc.originalExt === ".pdf") mimeType = "application/pdf";
    else if (doc.originalExt === ".jpg" || doc.originalExt === ".jpeg")
      mimeType = "image/jpeg";
    else if (doc.originalExt === ".png") mimeType = "image/png";

    res.setHeader("Content-Type", mimeType);

    //  force download with correct extension
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${doc.docType}${doc.originalExt}"`
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

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const updatedDocs = [];

    //  Iterate over uploaded fields
    for (const fieldName in files) {
      const fileArray = files[fieldName];

      //  Purana doc check karo (same docType ke liye ek hi rakhenge)
      const oldDoc = await SellerDocument.findOne({
        seller: sellerId,
        docType: fieldName,
      });

      if (oldDoc) {
        // Ole encrypted file delete
        if (fs.existsSync(oldDoc.filePath)) {
          fs.unlinkSync(oldDoc.filePath);
        }
        await SellerDocument.deleteOne({ _id: oldDoc._id });
      }

      //  Now new files process
      for (const file of fileArray) {
        const { encrypted, iv, salt, authTag } = await processFile(file.path);

        const encryptedFilePath = path.join(
          "storage/private_docs",
          file.filename + ".enc"
        );

        fs.writeFileSync(encryptedFilePath, encrypted);

        // DB me sirf latest wala save
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

        // Temporary upload file delete
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

// 📌 GET /api/seller-documents
// Query params: ?page=1&limit=10&status=pending&docType=pan
export const getSellerDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      docType,
      startDate,
      endDate,
    } = req.query;
    const sellerId =
      req.user.role === "admin" ? req.query.sellerId : req.user.sellerId;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    const filter = { seller: sellerId };

    //  Optional filters
    if (status) filter.status = status;
    if (docType) filter.docType = docType;
    if (startDate && endDate) {
      filter.uploadedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const skip = (page - 1) * limit;

    //  Paginated query
    const [docs, total] = await Promise.all([
      SellerDocument.find(filter)
        .sort({ uploadedAt: -1 }) // latest first
        .skip(skip)
        .limit(Number(limit)),
      SellerDocument.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      data: docs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
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

// Admin :

// Example: /api/admin/documents?page=1&limit=10&status=pending&docType=pan&sellerId=64a9c01...
export const adminGetDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      docType,
      startDate,
      endDate,
      sellerId,
      order = "desc",
      sortBy = "uploadedAt",
    } = req.query;

    const filter = {};

    if (sellerId) filter.seller = sellerId;
    if (status) filter.status = status;
    if (docType) filter.docType = docType;
    if (startDate && endDate) {
      filter.uploadedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const skip = (page - 1) * limit;

    const sortOrder = order === "asc" ? 1 : -1;

    const [docs, total] = await Promise.all([
      SellerDocument.find(filter)
        .populate("seller", "ownerName shopName") //  show seller info
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      SellerDocument.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      data: docs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};

//  PATCH /api/admin/documents/:docId/status
// Body: { "status": "verified" }  OR  { "status": "rejected" }
export const adminUpdateDocumentStatus = async (req, res) => {
  try {
    const { docId } = req.params;
    const { status, comment } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Use verified/rejected." });
    }

    if (status === "rejected" && (!comment || comment.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Admin comment is required when rejecting a document.",
      });
    }

    const doc = await SellerDocument.findById(docId).populate(
      "seller",
      "ownerName shopName"
    );
    if (!doc) return res.status(404).json({ message: "Document not found" });

    doc.status = status;
    doc.adminComment = status === "rejected" ? comment : null;
    await doc.save();

    res.status(200).json({
      success: true,
      message: `Document ${status} successfully`,
      document: doc,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update document status",
      error: error.message,
    });
  }
};
