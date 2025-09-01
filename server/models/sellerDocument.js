import mongoose from "mongoose";

const sellerDocumentSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },
  docType: {
    type: String,
    enum: [
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
    ],
    required: true,
  },
  docNumber: { type: String },
  categories: [
    {
      type: String,
      enum: ["identity", "address", "business", "bank"],
      // required: true,
    },
  ],
  filePath: { type: String, required: true }, // path in storage/private_docs
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  authTag: { type: String, required: true },
  adminComment: {
    type: String, // only filled when Rejected
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  originalExt: { type: String, required: false },
  uploadedAt: { type: Date, default: Date.now },
});

sellerDocumentSchema.index({ seller: 1, docType: 1 });

const SellerDocument = mongoose.model("SellerDocument", sellerDocumentSchema);
export default SellerDocument;
