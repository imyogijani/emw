import express from "express";
import path from "path";
import multer from "multer";
import {
  uploadDocuments,
  viewDocument,
  downloadDocument,
  updateDocuments,
  getSellerDocuments,
} from "../controllers/sellerDocumentController.js";
import {
  authenticateToken,
  fetchUser,
  authorizeSeller,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Temporary folder for upload before encryption
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "storage/temp_uploads/"),
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name; // file ka original name without extension
    const ext = path.extname(file.originalname); // .pdf, .jpg, etc.
    const timestamp = Date.now();

    // fieldname = jo input field hai → "aadhaar", "pan", etc.
    const docType = file.fieldname;

    // final filename: originalname_timestamp_doctype.ext
    const finalName = `${originalName}_${timestamp}_${docType}${ext}`;

    cb(null, finalName);
  },
});

// File filter for images / PDF only
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF / JPG / PNG files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const docTypes = [
  "aadhaar",
  "pan",
  "gst",
  "udyam",
  "addressProof",
  "bankProof",
  "drivingLicense",
  "voterId",
  "electricityBill",
  "passport",
  "rentAgreement",
  "bankPassbook",
  "telephoneBill",
  "bankAccountStatement",
  "birthCertificate",
  "gasConnection",
  "incomeTaxOrder",
  "rationCard",
  "governmentIdCard",
  "certificateOfIncorporation",
  "pensionDocuments",
  "memorandumOfAssociation",
  "partnershipDeed",
  "trustDeed",
  "certificateFromEmployer",
  "lastIssuedPassport",
];

// fields array banaye
const uploadFields = docTypes.map((doc) => ({ name: doc, maxCount: 1 }));

router.post(
  "/upload",
  authenticateToken,
  fetchUser,
  authorizeSeller,
  (req, res, next) => {
    // Custom middleware logic (if any)
    console.log("Upload document request received", req.body);
    next();
  },
  upload.fields(uploadFields),
  uploadDocuments
);

router.get(
  "/view/:docId",
  authenticateToken,
  fetchUser,
  authorizeSeller,
  viewDocument
);

router.get(
  "/download/:docId",
  authenticateToken,
  fetchUser,
  authorizeSeller,
  downloadDocument
);

router.patch(
  "/update",
  authenticateToken,
  fetchUser,
  authorizeSeller,
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "passport", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    // aur jo bhi chahiye
  ]),
  updateDocuments
);

router.get(
  "/",
  authenticateToken,
  fetchUser,
  authorizeSeller,
  getSellerDocuments
);

export default router;
