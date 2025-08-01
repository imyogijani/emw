/* eslint-disable no-undef */
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({
        success: false,
        message: "No token provided 🔒",
      });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          success: false,
          message: "Authentication Failed 🥲",
        });
      } else {
        req.userId = decoded.userId;
        next();
      }
    });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).send({
      success: false,
      error,
      message: "Authentication Failed",
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
