import Settings from "../models/settingsModel.js";

export const checkSystemSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    console.log("System settings:", settings);

    // Maintenance gate (optional)
    if (settings.maintenanceMode && !req.user?.role?.includes("admin")) {
      return res.status(503).json({
        success: false,
        message: "System is under maintenance. Please try later.",
      });
    }

    // Attach to req for controllers
    req.systemSettings = settings;
    next();
  } catch (e) {
    console.error("Settings middleware error", e);
    res.status(500).json({ success: false, message: "System check failed" });
  }
};
