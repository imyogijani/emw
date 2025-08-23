// utils/documentCategories.js
export const addressProofDocs = [
  "aadhaar",
  "voterId",
  "electricityBill",
  "passport",
  "rentAgreement",
  "bankPassbook",
  "telephoneBill",
  "bankAccountStatement",
  "rationCard",
  "governmentIdCard",
];

export const identityProofDocs = [
  "aadhaar",
  "pan",
  "drivingLicense",
  "voterId",
  "passport",
  "lastIssuedPassport",
];

export const businessProofDocs = [
  "gst",
  "udyam",
  "certificateOfIncorporation",
  "memorandumOfAssociation",
  "partnershipDeed",
  "trustDeed",
];

// utils/documentCategories.js
export const documentCategoriesMap = {
  aadhaar: ["identity", "address"],
  pan: ["identity"],
  gst: ["business"],
  udyam: ["business"],
  drivingLicense: ["identity", "address"],
  voterId: ["identity", "address"],
  electricityBill: ["address"],
  passport: ["identity", "address"],
  rentAgreement: ["address"],
  bankPassbook: ["bank", "address"],
  telephoneBill: ["address"],
  bankAccountStatement: ["bank", "address"],
  certificateOfIncorporation: ["business"],
  memorandumOfAssociation: ["business"],
  partnershipDeed: ["business"],
  trustDeed: ["business"],
  lastIssuedPassport: ["identity"],
  addressProof: ["address"],
  bankProof: ["bank"],
  birthCertificate: ["identity"],
  gasConnection: ["address"],
  incomeTaxOrder: ["identity", "business"],
  rationCard: ["identity", "address"],
  governmentIdCard: ["identity"],
  pensionDocuments: ["identity", "bank"],
  certificateFromEmployer: ["identity", "business"],
  // other docs add here
};

export function getCategories(docType) {
  const cats = [];
  if (addressProofDocs.includes(docType)) cats.push("address");
  if (identityProofDocs.includes(docType)) cats.push("identity");
  if (businessProofDocs.includes(docType)) cats.push("business");
  return cats;
}
