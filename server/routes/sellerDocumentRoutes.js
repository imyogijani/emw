import express from "express";
import multer from "multer";
import {
  uploadDocuments,
  viewDocument,
  downloadDocument,
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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
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

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 },
// }).fields([
//   { name: "aadhaar", maxCount: 1 },
//   { name: "pan", maxCount: 1 },
//   { name: "passport", maxCount: 1 },
//   { name: "drivingLicense", maxCount: 1 },
//   { name: "gst", maxCount: 1 },
//   { name: "udyam", maxCount: 1 },
//   { name: "addressProof", maxCount: 1 },
//   { name: "bankProof", maxCount: 1 },
//   { name: "voterId", maxCount: 1 },
//   { name: "electricityBill", maxCount: 1 },
//   { name: "rentAgreement", maxCount: 1 },
//   { name: "bankPassbook", maxCount: 1 },
//   { name: "telephoneBill", maxCount: 1 },
//   { name: "bankAccountStatement", maxCount: 1 },
//   { name: "birthCertificate", maxCount: 1 },
//   { name: "gasConnection", maxCount: 1 },
//   { name: "incomeTaxOrder", maxCount: 1 },
//   { name: "governmentIdCard", maxCount: 1 },
//   { name: "certificateOfIncorporation", maxCount: 1 },
//   { name: "pensionDocuments", maxCount: 1 },
//   { name: "memorandumOfAssociation", maxCount: 1 },
//   { name: "partnershipDeed", maxCount: 1 },
//   { name: "trustDeed", maxCount: 1 },
//   { name: "certificateFromEmployer", maxCount: 1 },
//   { name: "lastIssuedPassport", maxCount: 1 },
// ]);

router.post(
  "/upload",
  authenticateToken,
  fetchUser,
  authorizeSeller,
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "passport", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    // aur jitne documents chahiye add karo
  ]),
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

export default router;
