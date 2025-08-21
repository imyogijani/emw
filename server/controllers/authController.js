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
import Settings from "../models/settingsModel.js";

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

/**
 * User Registration Controller
 * 
 * SECURITY PROTOCOL: Admin users bypass email verification requirements
 * - Admin users are automatically verified during registration
 * - This is a documented security exception for administrative access
 * - See: server/docs/ADMIN_SECURITY_PROTOCOLS.md for full documentation
 */
const registerController = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      names,
      mobile,
    } = req.body;

    console.log("register body request :", req.body);

    // 1. Validate mobile number format
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).send({
        success: false,
        message: "Please enter a valid 10-digit mobile number starting with 6-9",
      });
    }

    // 2. Check existing user by email or mobile
    const existingUser = await userModel.findOne({ 
      $or: [{ email }, { mobile }] 
    });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'mobile number';
      return res.status(409).send({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Get email verification settings
    const settings = await Settings.getSettings();
    
    // 5. Prepare base user data (no role assigned initially)
    const userData = {
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      password: hashedPassword,
      names: names || `${firstName} ${lastName}`.trim(),
      mobile: mobile || "",
      isOnboardingComplete: false, // Track onboarding completion
      emailVerified: false, // Track email verification (will be set based on settings)
    };

    // SECURITY PROTOCOL: Admin users bypass email verification requirement
    // This is a documented exception for administrative access
    if (req.body.role === 'admin') {
      userData.role = 'admin';
      userData.emailVerified = true; // Admin users don't require email verification
      userData.isOnboardingComplete = true; // Admin users skip onboarding
    } else {
      // For non-admin users, check if email verification is disabled globally
      if (!settings.emailVerificationEnabled) {
        userData.emailVerified = true; // Skip verification if master setting is disabled
      }
    }

    // 6. Save user
    const user = await new userModel(userData).save();

    // 7. Success response
    return res.status(201).send({
      success: true,
      message: "User registered successfully! Please verify your email to continue.",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        isOnboardingComplete: user.isOnboardingComplete,
        emailVerified: user.emailVerified,
      },
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

/**
 * User Login Controller
 * 
 * SECURITY PROTOCOL: Admin users bypass email verification checks
 * - Admin users can login without email verification
 * - This maintains operational efficiency for system administrators
 * - See: server/docs/ADMIN_SECURITY_PROTOCOLS.md for full documentation
 */
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

    // Email verification check - SECURITY PROTOCOL: Admin users bypass this requirement
    // Also check dynamic settings for other user types
    const settings = await Settings.getSettings();
    const requiresVerification = settings.emailVerificationEnabled && 
      (user.role === 'admin' ? false : 
       user.role === 'customer' ? settings.customerEmailVerification :
       user.role === 'seller' ? settings.sellerEmailVerification : true);
    
    if (!user.emailVerified && requiresVerification) {
      return res.status(403).send({
        success: false,
        message: "Please verify your email before logging in.",
        requiresEmailVerification: true,
      });
    }

    //  Banned  check
    if (user.status === "banned") {
      return res.status(403).send({
        success: false,
        message: "Your account has been banned. Please contact support.",
      });
    }

    // Check subscription status for shopowners (only if they have completed onboarding)
    if (user.role === "shopowner" && user.subscription && user.isOnboardingComplete) {
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

    // Prepare response based on onboarding status
    const responseData = {
      success: true,
      message: "Login successful 🎉",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete,
        emailVerified: user.emailVerified,
        names: user.names,
        avatar: user.avatar,
        status: user.status,
      },
    };

    // ADMIN PROTOCOL: Admin users skip onboarding and go directly to dashboard
    if (user.role === 'admin') {
      responseData.redirectToAdminDashboard = true;
      responseData.message = "Admin login successful! Redirecting to dashboard.";
    } else {
      // Add onboarding status to response for non-admin users
      if (!user.isOnboardingComplete) {
        responseData.requiresOnboarding = true;
        responseData.message = "Login successful! Please complete your onboarding.";
      }
    }

    return res.status(200).send(responseData);
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
      .populate(
        "sellerId",
        "shopName ownerName shopAddresses shopImage shopImages"
      );
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
    const { names, phone, mobile } = req.body;
    if (names !== undefined) updateUserData.names = names;
    if (phone !== undefined) updateUserData.phone = phone;
    if (mobile !== undefined) {
      // Validate mobile number format if provided
      if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit mobile number starting with 6-9",
        });
      }
      updateUserData.mobile = mobile;
    }
    // Validate and update address

    console.log("Update profile", req.body);

    let address = req.body.address;
    if (typeof address === "string") {
      try {
        address = JSON.parse(address);
      } catch (error) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid address format" });
      }
    }

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
      const { shopName, categories } = req.body;

      if (shopName !== undefined) updateSellerData.shopName = shopName;
      if (address !== undefined) updateSellerData.address = address;

      // Handle main image
      if (files.shopImage && files.shopImage[0]) {
        updateSellerData.shopImage = files.shopImage[0].filename;
      }

      // Handle multiple images (append only or full replacement — here append)
      // if (files.shopImages && files.shopImages.length > 0) {
      //   const newImages = files.shopImages.map((file) => file.filename);
      //   const seller = await Seller.findOne({ user: user._id });
      //   const existingImages = seller?.shopImages || [];
      //   updateSellerData.shopImages = [...existingImages, ...newImages];
      // }

      if (files.shopImage && files.shopImage[0]) {
        // Store path instead of just filename
        updateSellerData.shopImage = `/uploads/shopowner/${files.shopImage[0].filename}`;
      }

      if (files.shopImages && files.shopImages.length > 0) {
        const seller = await Seller.findOne({ user: user._id });
        const existingImages = seller?.shopImages || [];

        const newImages = files.shopImages.map(
          (file) => `/uploads/shopowner/${file.filename}` //  add folder path
        );

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
    console.log("Forgot", req.body);
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
  console.log("Request body:", req.body);
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

// Email verification controller
const verifyEmailController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    await user.save();

    return res.status(200).send({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).send({
      success: false,
      message: "Error verifying email",
      error: error.message,
    });
  }
};

// Resend verification email controller
const resendVerificationController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).send({
        success: false,
        message: "Email is already verified",
      });
    }

    // In a real implementation, you would send the verification email here
    // For now, we'll just return a success message
    return res.status(200).send({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).send({
      success: false,
      message: "Error sending verification email",
      error: error.message,
    });
  }
};

// Update user role controller
const updateRoleController = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.userId; // From auth middleware

    if (!role || !['client', 'shopowner'].includes(role)) {
      return res.status(400).send({
        success: false,
        message: "Valid role is required (client or shopowner)",
      });
    }

    // Find and update user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Get email verification settings
    const settings = await Settings.getSettings();
    
    // Check if email verification is required for the new role
    const newRoleRequiresVerification = settings.emailVerificationEnabled &&
      (role === 'shopowner' ? settings.sellerEmailVerification :
       role === 'client' ? settings.customerEmailVerification : false);
    
    // If switching to a role that requires verification and user is not verified
    if (newRoleRequiresVerification && !user.emailVerified) {
      return res.status(403).send({
        success: false,
        message: "Please verify your email before switching to this role.",
        requiresEmailVerification: true,
      });
    }

    // Update user role
    user.role = role;
    await user.save();

    // Create seller profile if role is shopowner
    if (role === 'shopowner') {
      const existingSeller = await Seller.findOne({ user: userId });
      if (!existingSeller) {
        // Generate unique shop name using user ID and timestamp
        const uniqueShopName = `Shop_${userId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;
        
        const seller = new Seller({
          user: userId,
          shopName: uniqueShopName, // Unique temporary name
          ownerName: user.names || `${user.firstName} ${user.lastName}`.trim(),
          description: "",
          categories: [],
          location: "",
          specialist: [],
          status: "inactive", // Inactive until onboarding is complete
          kycVerified: false,
          onboardingStep: 0, // Track onboarding progress
        });

        const savedSeller = await seller.save();
        user.sellerId = savedSeller._id;
        await user.save();
      }
    }

    return res.status(200).send({
      success: true,
      message: "Role updated successfully!",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete,
        emailVerified: user.emailVerified,
        sellerId: user.sellerId, // Include sellerId for shopowner role
      },
    });
  } catch (error) {
    console.error("Update role error:", error);
    return res.status(500).send({
      success: false,
      message: "Error updating role",
      error: error.message,
    });
  }
};

// Complete onboarding controller
const completeOnboardingController = async (req, res) => {
  try {
    const { onboardingData, userType } = req.body;
    const userId = req.userId; // From auth middleware

    // Find user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Update user onboarding status
    user.isOnboardingComplete = true;
    
    // Store onboarding data based on user type
    if (userType === 'customer' && onboardingData) {
      // Store customer preferences and settings
      user.preferences = onboardingData.preferences || [];
      user.location = onboardingData.location || {};
      user.notificationSettings = onboardingData.notifications || {};
    }

    await user.save();

    return res.status(200).send({
      success: true,
      message: "Onboarding completed successfully!",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    return res.status(500).send({
      success: false,
      message: "Error completing onboarding",
      error: error.message,
    });
  }
};

export {
  registerController,
  loginController,
  currentUserController,
  uploadAvatarController,
  verifyEmailController,
  resendVerificationController,
  updateRoleController,
  completeOnboardingController,
};
