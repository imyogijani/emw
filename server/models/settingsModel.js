import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    emailVerificationEnabled: { type: Boolean, default: true, required: true },
    customerEmailVerification: { type: Boolean, default: true, required: true },
    sellerEmailVerification: { type: Boolean, default: true, required: true },
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    onboardingEnabled: { type: Boolean, default: false, required: true },
    // onboardingRequiredSteps: {
    //   type: [String],
    //   default: ['shopTiming', 'shopDetails', 'legalDocuments'],
    //   required: true
    // },

    onboardingRequiredSteps: {
      type: [
        {
          name: { type: String, required: true },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: [
        { name: "shopTiming", enabled: true },
        { name: "shopDetails", enabled: true },
        { name: "legalDocuments", enabled: true },
      ],
    },
  },
  { timestamps: true }
);

// Single document policy
settingsSchema.statics.getSettings = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

settingsSchema.statics.updateSettings = async function (updates) {
  const current = await this.getSettings();
  Object.assign(current, updates);
  await current.save();
  return current;
};

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
