// Premium check middleware removed - all shopowners can add products
export const checkIsPremium = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId);

    if (!user || user.role !== "shopowner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // All shopowners can now add products (subscription removed)
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


