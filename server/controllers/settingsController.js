import Settings from "../models/settingsModel.js";

export const getSettings = async (_req, res) => {
  const s = await Settings.getSettings();
  res.json({ success: true, settings: s });
};

// ✅ Controller
export const updateSettings = async (req, res) => {
  try {
    const {
      emailVerificationEnabled,
      customerEmailVerification,
      sellerEmailVerification,
      maintenanceMode,
      allowRegistration,
    } = req.body;

    const updates = {};

    // ✅ Step 1: Only allow boolean values
    for (const [k, v] of Object.entries({
      emailVerificationEnabled,
      customerEmailVerification,
      sellerEmailVerification,
      maintenanceMode,
      allowRegistration,
    })) {
      if (typeof v !== "undefined" && typeof v !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `Invalid value for ${k}, must be boolean`,
        });
      }
      if (typeof v === "boolean") updates[k] = v;
    }

    // ✅ Step 2: Apply master toggle logic
    if (typeof updates.emailVerificationEnabled === "boolean") {
      if (updates.emailVerificationEnabled === true) {
        // Master ON → ignore role-based toggles
        updates.customerEmailVerification = true;
        updates.sellerEmailVerification = true;
      } else {
        // Master OFF → allow role-based values from body
        updates.customerEmailVerification =
          typeof customerEmailVerification === "boolean"
            ? customerEmailVerification
            : false;
        updates.sellerEmailVerification =
          typeof sellerEmailVerification === "boolean"
            ? sellerEmailVerification
            : false;
      }
    }

    // ✅ Step 3: Save to DB
    const saved = await Settings.updateSettings(updates);

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: saved,
    });
  } catch (e) {
    console.error("Update settings error:", e);
    res.status(500).json({
      success: false,
      message: "Error updating settings",
      error: e.message,
    });
  }
};
