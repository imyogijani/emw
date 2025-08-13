/* eslint-disable no-undef */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import userModel from "../models/userModel.js";
import Subscription from "../models/subscriptionModel.js"; // Changed to default import
import Seller from "../models/sellerModel.js";
import Category from "../models/categoryModel.js";
import crypto from "crypto";
// import { sendEmail } from "../utils/sendEmail.js";
import Product from "../models/productModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//registration
// const registerController = async (req, res) => {
//   try {
//     const { email, password, role, subscriptionId, shopName, ...rest } =
//       req.body;

//     const existingUser = await userModel.findOne({ email });
//     if (existingUser) {
//       return res.status(409).send({
//         success: false,
//         message: "User already exists",
//       });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     let userData = {
//       email,
//       password: hashedPassword,
//       role,
//       ...rest,
//     };

//     if (role === "shopowner" && subscriptionId) {
//       const subscription = await Subscription.findById(subscriptionId);
//       if (!subscription) {
//         return res.status(400).send({
//           success: false,
//           message: "Invalid subscription plan provided",
//         });
//       }
//       userData.subscription = subscriptionId;
//       userData.subscriptionStartDate = new Date();
//       userData.shopName = shopName; // Add shopName for shopowner
//       userData.subscriptionFeatures = subscription.includedFeatures; // Store features at registration
//     }

//     const user = new userModel(userData);
//     await user.save();

//     return res.status(201).send({
//       success: true,
//       message: "User registered successfully 🎉",
//       user,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in register API",
//       error,
//     });
//   }
// };

const registerController = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      subscriptionId,
      shopName,
      shopownerName,
      avatar,
      // shopImage,
      // shopImages,
      description,
      // categories,
      location,
      addressLine,
      // addressLine2,
      city,
      state,
      pincode,
      country,
      names,
      phone,
      gstNumber,
    } = req.body;

    const files = req.files;
    const shopImage = files?.shopImage?.[0]?.filename || null;
    const shopImages =
      files?.shopImages?.map((file) => `/uploads/shopowner/${file.filename}`) ||
      [];
    if (shopImage) {
      shopImages.unshift(`/uploads/shopowner/${shopImage}`);
    }

    console.log("register body request :", req.body);

    // 1. Check existing user
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "User already exists",
      });
    }

    // 2. Hash password
    console.log("Hashed Password:", password);
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!addressLine || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message:
          "All address fields are required (addressLine, city, state, pincode)",
      });
    }

    // const requiredAddressFields = { addressLine, city, state, pincode };
    // for (const [fieldName, fieldValue] of Object.entries(
    //   requiredAddressFields
    // )) {
    //   if (!fieldValue || fieldValue.trim() === "") {
    //     return res.status(400).json({
    //       success: false,
    //       message: `${fieldName} is required`,
    //     });
    //   }
    // }

    // construct address object
    const address = {
      addressLine,
      // addressLine2: addressLine2 ? addressLine2.trim() : "",
      city,
      state,
      pincode,
      country: country || "India",
    };

    // 3. Prepare base user data
    const userData = {
      email,
      password: hashedPassword,
      role,
      names,
      phone,
      address,
      avatar: avatar || null,
    };

    // 4. If shopowner, handle subscription & shop fields
    let parsedCategories = [];
    if (role === "shopowner") {
      if (!subscriptionId || !shopName || !shopownerName) {
        return res.status(400).json({
          success: false,
          message:
            "Missing shopowner fields (subscriptionId, shopName, shopownerName)",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription",
        });
      }

      if (typeof req.body.categories === "string") {
        try {
          parsedCategories = JSON.parse(req.body.categories);
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: "Invalid categories format",
          });
        }
      } else {
        parsedCategories = req.body.categories || [];
      }

      const validCategories = await Category.find({
        _id: { $in: parsedCategories },
      });

      if (validCategories.length !== parsedCategories.length) {
        return res.status(400).json({
          success: false,
          message: "Some categories are invalid",
        });
      }

      userData.subscription = subscriptionId;
      userData.subscriptionStartDate = new Date();
      userData.subscriptionFeatures = subscription.includedFeatures;
      userData.shopName = shopName;
      userData.shopownerName = shopownerName;
      userData.shopImage = shopImage || null;
    } else {
      parsedCategories = req.body.categories || [];
    }

    // New add gst :
    let validatedGST = null;

    if (role === "shopowner" && gstNumber) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

      //  Check format
      if (!gstRegex.test(gstNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid GST number format",
        });
      }

      //  Check if already exists in another seller
      const existingGST = await Seller.findOne({ gstNumber: gstNumber.trim() });
      if (existingGST) {
        return res.status(409).json({
          success: false,
          message: "GST number already in use",
        });
      }

      //  Save for later use
      validatedGST = gstNumber.trim();
    }

    // 5. Save user
    const user = await new userModel(userData).save();

    // 6. Create seller if shopowner
    if (role === "shopowner") {
      const seller = new Seller({
        user: user._id,
        shopName,
        shopImage,
        shopImages,
        ownerName: user.names || "", // Or from formData.shopownerName
        description: description || "",
        categories: parsedCategories || [],
        location: location || "",
        // address: user.address || "",
        // address: "",
        specialist: [],
        status: "active",
        gstNumber: validatedGST, //  save it here
        kycVerified: false,
      });

      const savedSeller = await seller.save();

      // Link seller to user
      user.sellerId = savedSeller._id;
      await user.save();
    }

    // 7. Success response
    return res.status(201).send({
      success: true,
      message: "User registered successfully 🎉",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).send({
      success: false,
      message: "Error in register API",
      error: error.message,
    });
  }
};

//login call back
const loginController = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.body.email })
      .populate("subscription")
      .populate("sellerId");

    // Email check
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email not found",
      });
    }

    // Password check
    const comparePassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!comparePassword) {
      return res.status(401).send({
        success: false,
        message: "Password incorrect",
      });
    }

    // Check subscription status for shopowners
    if (user.role === "shopowner" && user.subscription) {
      const oneMonth = 30 * 24 * 60 * 60 * 1000; // milliseconds in a month
      const now = new Date();
      const subscriptionEndDate = new Date(
        user.subscriptionStartDate.getTime() + oneMonth
      );

      if (now > subscriptionEndDate) {
        return res.status(403).send({
          success: false,
          message: "Your subscription has expired. Please renew to continue.",
        });
      }
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).send({
      success: true,
      message: "Login successful 🎉",
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login 🥲",
      error,
    });
  }
};

//current user controller
const currentUserController = async (req, res) => {
  try {
    let userQuery = userModel.findById(req.userId);
    // Always populate subscription for shopowners
    userQuery = userQuery
      .populate("subscription")
      .populate("sellerId", "shopName ownerName shopAddresses");
    const user = await userQuery;
    return res.status(200).send({
      success: true,
      message: "User Fetched successfully🎉",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Unable to get current user😌",
      error,
    });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const files = req.files || {};
    const updateUserData = {};
    const updateSellerData = {};

    // === USER FIELDS (Common) ===
    const { names, phone, address } = req.body;
    if (names !== undefined) updateUserData.names = names;
    if (phone !== undefined) updateUserData.phone = phone;
    // Validate and update address
    if (address !== undefined) {
      if (
        !address.addressLine ||
        !address.city ||
        !address.state ||
        !address.pincode ||
        !address.country
      ) {
        return res.status(400).send({
          success: false,
          message:
            "All address fields are required when updating address (addressLine, city, state, pincode, country).",
        });
      }
      updateUserData.address = address; // save to user model
    }

    // === SELLER FIELDS (Shopowner only) ===
    if (user.role === "shopowner") {
      const { shopName, shopownerName, categories } = req.body;

      if (shopName !== undefined) updateSellerData.shopName = shopName;
      if (shopownerName !== undefined)
        updateSellerData.ownerName = shopownerName;
      if (address !== undefined) updateSellerData.address = address;

      // Handle main image
      if (files.shopImage && files.shopImage[0]) {
        updateSellerData.shopImage = files.shopImage[0].filename;
      }

      // Handle multiple images (append only or full replacement — here append)
      if (files.shopImages && files.shopImages.length > 0) {
        const newImages = files.shopImages.map((file) => file.filename);
        const seller = await Seller.findOne({ user: user._id });
        const existingImages = seller?.shopImages || [];
        updateSellerData.shopImages = [...existingImages, ...newImages];
      }

      const seller = await Seller.findOne({ user: userId });

      // === GST Number Handling ===
      if (req.body.gstNumber !== undefined) {
        const gst = req.body.gstNumber.trim();

        // If GST is already set, prevent updating it
        if (seller.gstNumber) {
          return res.status(400).json({
            success: false,
            message: "GST Number is already set and cannot be changed",
          });
        }

        // Validate format
        const gstRegex =
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(gst)) {
          return res.status(400).json({
            success: false,
            message: "Invalid GST Number format",
          });
        }

        // Check uniqueness
        const existingGST = await Seller.findOne({ gstNumber: gst });
        if (existingGST) {
          return res.status(409).json({
            success: false,
            message: "This GST Number is already used by another seller",
          });
        }

        // Save it to update object
        updateSellerData.gstNumber = gst;
      }

      // Handle categories (replace entirely)
      // Handle categories (replace entirely)
      if (categories) {
        let parsedCategories;
        try {
          parsedCategories = JSON.parse(categories); // From form-data stringified array

          if (!Array.isArray(parsedCategories)) {
            throw new Error("Categories must be an array");
          }

          // Validate ObjectId format
          if (!parsedCategories.every((id) => id.length === 24)) {
            return res.status(400).json({
              success: false,
              message: "One or more category IDs are not valid ObjectId format",
            });
          }

          const validCategories = await Category.find({
            _id: { $in: parsedCategories },
          });

          if (validCategories.length !== parsedCategories.length) {
            return res.status(400).json({
              success: false,
              message: "One or more category IDs are invalid",
            });
          }

          updateSellerData.categories = parsedCategories;
        } catch (err) {
          console.error("Categories parsing failed:", err.message);
          return res.status(400).json({
            success: false,
            message: "Invalid categories format. Must be JSON array of IDs.",
          });
        }
      }

      // === Update Seller ===
      const updatedSeller = await Seller.findOneAndUpdate(
        { user: userId },
        { $set: updateSellerData },
        { new: true }
      );
      // If seller address changed, update all their products' location
      if (address !== undefined) {
        await Product.updateMany(
          { seller: updatedSeller._id }, // find products of this seller
          {
            $set: {
              "location.city": address.city,
              "location.state": address.state,
              "location.country": address.country,
            },
          }
        );
      }

      // === Update User ===
      const updatedUser = await userModel
        .findByIdAndUpdate(userId, updateUserData, { new: true })
        .populate("subscription");

      return res.status(200).json({
        success: true,
        message: "Shopowner profile updated successfully",
        user: updatedUser,
        seller: updatedSeller,
      });
    }

    // === Update user (non-shopowner) ===
    const updatedUser = await userModel
      .findByIdAndUpdate(userId, updateUserData, { new: true })
      .populate("subscription");

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

// Upload avatar controller
const uploadAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "No image file provided",
      });
    }

    // Validate file type
    if (!req.file.mimetype.match(/^image\/(jpeg|png|gif)$/)) {
      // Clean up invalid file
      fs.unlinkSync(req.file.path);
      return res.status(400).send({
        success: false,
        message: "Invalid file type. Only JPG, PNG and GIF files are allowed.",
      });
    }

    const user = await userModel.findById(req.userId);
    if (!user) {
      // Clean up file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Create the URL for the uploaded avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Remove old avatar file if it exists
    if (user.avatar) {
      try {
        const oldAvatarPath = path.join(__dirname, "..", "public", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      } catch (err) {
        console.error("Error removing old avatar:", err);
        // Continue with the update even if old file cleanup fails
      }
    }
    // console.log("Uploaded file:", req.file);

    user.avatar = avatarUrl;
    await user.save();

    return res.status(200).send({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl,
      user,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error cleaning up file on error:", err);
      }
    }

    console.error("Avatar upload error:", error);
    return res.status(500).send({
      success: false,
      message: "Error uploading avatar. Please try again.",
      error: error.message,
    });
  }
};

//verify token
export const verifyToken = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error in token verification",
      error,
    });
  }
};

// Clear notification for shopowner
export const clearNotification = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.notification = null;
    await user.save();
    res.json({ success: true, message: "Notification cleared" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing notification",
      error: error.message,
    });
  }
};

// Seller accepts updated plan (from review page)
export const acceptPlanUpdateController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planName } = req.body;
    const user = await userModel.findById(userId);
    if (!user || user.role !== "shopowner") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const plan = await Subscription.findOne({ planName });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // Assuming 1-month plan duration

    user.subscription = plan._id;
    user.subscriptionFeatures = plan.includedFeatures;
    user.subscriptionStartDate = new Date();
    user.subscriptionEndDate = endDate;

    await user.save();
    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating plan",
      error: error.message,
    });
  }
};

// POST /api/v1/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    // Send this URL via email (use nodemailer or any email service)
    console.log("Send this reset link:", resetUrl);

    // await sendEmail({
    //   to: email,
    //   subject: "Reset Your Password",
    //   html: `<p>Click <a href="${resetUrl}">here</a> to reset password.</p>`,
    // });

    return res.status(200).json({
      success: true,
      message: "Reset password link sent to your email",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/v1/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const hashedNewPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedNewPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successful 🎉" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  registerController,
  loginController,
  currentUserController,
  uploadAvatarController,
};
