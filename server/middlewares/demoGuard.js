export const demoGuard = (req, res, next) => {
  if (req.user && req.user.email === "demo@seller.com") {
    console.log("Demo Guard Triggered", req.user.email);
    return res.status(403).json({
      success: false,
      message: "Demo account is read-only. You cannot perform this action.",
    });
  }
  next();
};
