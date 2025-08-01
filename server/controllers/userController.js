// controllers/userController.js
import User from "../models/userModel.js";

export const updatePushToken = async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await User.findByIdAndUpdate(userId, { pushToken });
    res.status(200).json({ message: "Push token updated" });
  } catch (err) {
    console.error("Error updating push token:", err);
    res.status(500).json({ message: "Server error" });
  }
};
