import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    emailVerificationEnabled: {
      type: Boolean,
      default: true,
      required: true,
    },
    customerEmailVerification: {
      type: Boolean,
      default: true,
      required: true,
    },
    sellerEmailVerification: {
      type: Boolean,
      default: true,
      required: true,
    },
    // Add more settings as needed in the future
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      emailVerificationEnabled: true,
      customerEmailVerification: true,
      sellerEmailVerification: true,
    });
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function (updates) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }
  return settings;
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;