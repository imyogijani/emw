export const findOrCreateTechnicalDetails = async (details) => {
  const TechnicalDetails = (await import("../models/technicalDetails.js"))
    .default;

  // Find if same technical detail already exists
  const existing = await TechnicalDetails.findOne(details); // exact match

  if (existing) {
    return { reused: true, doc: existing };
  }

  // Else create new
  const newDoc = new TechnicalDetails(details);
  await newDoc.save();
  return { reused: false, doc: newDoc };
};
