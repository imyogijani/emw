/* eslint-disable no-undef */
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // Check if authorization header exists and has correct format
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
        errorCode: "NO_AUTH_HEADER",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization header format. Expected 'Bearer <token>'",
        errorCode: "INVALID_AUTH_FORMAT",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided in authorization header",
        errorCode: "NO_TOKEN",
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured in environment variables");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
        errorCode: "JWT_SECRET_MISSING",
      });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error("JWT Verification Error:", {
          name: err.name,
          message: err.message,
          expiredAt: err.expiredAt,
        });

        // Handle specific JWT errors
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token has expired. Please log in again.",
            errorCode: "TOKEN_EXPIRED",
            expiredAt: err.expiredAt,
          });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            success: false,
            message: "Invalid token. Please log in again.",
            errorCode: "INVALID_TOKEN",
          });
        } else if (err.name === "NotBeforeError") {
          return res.status(401).json({
            success: false,
            message: "Token not active yet",
            errorCode: "TOKEN_NOT_ACTIVE",
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Token verification failed",
            errorCode: "TOKEN_VERIFICATION_FAILED",
          });
        }
      }

      // Token is valid, check if decoded data is complete
      if (!decoded.userId) {
        return res.status(401).json({
          success: false,
          message: "Invalid token payload",
          errorCode: "INVALID_TOKEN_PAYLOAD",
        });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
        });
      }

      if (user.status === "banned") {
        return res.status(403).json({
          success: false,
          message: "Your account has been banned. Please contact support.",
          errorCode: "USER_BANNED",
        });
      }

      req.userId = decoded.userId;
      // req.user = user;
      next();
    });
  } catch (error) {
    console.error("Auth Middleware Error:", {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
    return res.status(500).json({
      success: false,
      message: "Internal authentication error",
      errorCode: "AUTH_MIDDLEWARE_ERROR",
    });
  }
};

export const fetchUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Fetch User Error:", error);
    return res.status(500).send({
      success: false,
      error,
      message: "Failed to fetch user",
    });
  }
};

export const authorizeAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.role.toLowerCase() !== "admin") {
      return res.status(403).send({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Admin Authorization Error:", error);
    return res.status(500).send({
      success: false,
      error,
      message: "Admin authorization failed",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    // If user is not already fetched, fetch it
    if (!req.user) {
      const user = await User.findById(req.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      req.user = user;
    }
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export function customerOnly(req, res, next) {
  if (!req.user || req.user.role !== "customer") {
    return res
      .status(403)
      .json({ success: false, message: "Customer login required" });
  }
  next();
}

export const authorizeSeller = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role.toLowerCase() !== "shopowner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Seller only.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Seller Authorization Error:", error);
    return res.status(500).json({
      success: false,
      error,
      message: "Seller authorization failed",
    });
  }
};
