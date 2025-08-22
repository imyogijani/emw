// import { errorHandler } from "../utils/error.js";

// export const restrictDemoAccess = async (req, res, next) => {
//   try {
//     if (
//       req.user.demoAccess &&
//       ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
//     ) {
//       return next(
//         errorHandler(403, "Demo accounts cannot perform write operations")
//       );
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

export const restrictDemoAccess = (req, res, next) => {
  try {
    if (
      req.user?.demoAccess &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only read access is allowed",
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
