// Middleware to prevent demo seller from modifying data
const preventDemoSellerModification = async (req, res, next) => {
  try {
    // Check if the user is demo seller
    if (req.user && req.user.email === "demo@seller.com") {
      // Only allow GET requests for demo seller
      if (req.method !== "GET") {
        return res.status(403).send({
          success: false,
          message:
            "Demo seller account cannot modify data. This is a view-only account.",
        });
      }
    }
    next();
  } catch (error) {
    console.error("Demo seller middleware error:", error);
    res.status(500).send({
      success: false,
      message: "Error in demo seller middleware",
      error: error.message,
    });
  }
};

export default preventDemoSellerModification;
