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
      onboardingEnabled,
      onboardingRequiredSteps,
    } = req.body;

    const updates = {};

    // ✅ Step 1: Only allow boolean values for boolean fields
    for (const [k, v] of Object.entries({
      emailVerificationEnabled,
      customerEmailVerification,
      sellerEmailVerification,
      maintenanceMode,
      allowRegistration,
      onboardingEnabled,
    })) {
      if (typeof v !== "undefined" && typeof v !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `Invalid value for ${k}, must be boolean`,
        });
      }
      if (typeof v === "boolean") updates[k] = v;
    }

    // Handle onboardingRequiredSteps array
    if (onboardingRequiredSteps !== undefined) {
      if (!Array.isArray(onboardingRequiredSteps)) {
        return res.status(400).json({
          success: false,
          message: "onboardingRequiredSteps must be an array",
        });
      }
      const validSteps = [
        "shopTiming",
        "shopDetails",
        "legalDocuments",
        "basicDetails",
      ];
      const invalidSteps = onboardingRequiredSteps.filter(
        (step) => !validSteps.includes(step)
      );
      if (invalidSteps.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid onboarding steps: ${invalidSteps.join(", ")}`,
        });
      }
      updates.onboardingRequiredSteps = onboardingRequiredSteps;
    }

    // Step 2: Apply master toggle logic
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

export const updateOnboardingSettings = async (req, res) => {
  try {
    const { onboardingEnabled, onboardingRequiredSteps } = req.body;
    const updates = {};

    // Validate onboardingEnabled
    if (typeof onboardingEnabled !== "undefined") {
      if (typeof onboardingEnabled !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "onboardingEnabled must be boolean",
        });
      }
      updates.onboardingEnabled = onboardingEnabled;
    }

    // ✅ Always fetch current settings
    const current = await Settings.getSettings();

    // Valid step list
    const validSteps = [
      "shopTiming",
      "shopDetails",
      "legalDocuments",
      "basicDetails",
    ];

    // ✅ Ensure DB always has all valid steps
    let dbSteps = current.onboardingRequiredSteps || [];
    const normalizedSteps = validSteps.map((name) => {
      const found = dbSteps.find((s) => s.name === name);
      return found
        ? { ...(found.toObject?.() || found) }
        : { name, enabled: false }; // default if missing
    });

    // If onboarding disabled → mark all false
    if (onboardingEnabled === false) {
      updates.onboardingRequiredSteps = normalizedSteps.map((s) => ({
        ...s,
        enabled: false,
      }));
    }

    // If onboarding enabled → update selected steps
    if (onboardingEnabled === true && onboardingRequiredSteps !== undefined) {
      if (!Array.isArray(onboardingRequiredSteps)) {
        return res.status(400).json({
          success: false,
          message: "onboardingRequiredSteps must be an array of objects",
        });
      }

      // Merge updates
      const updatedSteps = normalizedSteps.map((step) => {
        const updateStep = onboardingRequiredSteps.find(
          (s) => s.name === step.name
        );
        if (updateStep) {
          if (typeof updateStep.enabled !== "boolean") {
            return res.status(400).json({
              success: false,
              message: `Invalid enabled value for step ${updateStep.name}`,
            });
          }
          return { ...step, enabled: updateStep.enabled };
        }
        return step;
      });

      updates.onboardingRequiredSteps = updatedSteps;
    }

    // Save to DB
    const saved = await Settings.updateSettings(updates);

    res.json({
      success: true,
      message: "Onboarding settings updated",
      settings: saved,
    });
  } catch (error) {
    console.error("Update onboarding error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
