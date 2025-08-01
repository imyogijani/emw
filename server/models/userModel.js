/* eslint-disable no-dupe-keys */
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: ["admin", "shopowner", "client"],
    },
    avatar: {
      type: String,
      default: null,
    },
    names: {
      type: String,
      required: function () {
        if (this.role === "client" || this.role === "admin") {
          return true;
        }
        return false;
      },
    },
    // shopownerName: {
    //   type: String,
    //   required: function () {
    //     if (this.role === "shopowner") {
    //       return true;
    //     }
    //     return false;
    //   },
    // },
    // shopName: {
    //   type: String,
    //   required: function () {
    //     if (this.role === "shopowner") {
    //       return true;
    //     }
    //     return false;
    //   },
    // },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    address: {
      type: String,
      required: function () {
        return this.role === "client" || this.role === "shopowner";
      },
    },
    phone: {
      type: String,
      required: [true, "Phone Number is required"],
    },
    avatar: {
      type: String,
      default: null,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    subscriptionFeatures: {
      type: [String],
      default: [],
    },
    notification: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    // shopImage: {
    //   type: String,
    //   default: null,
    // },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    pushToken: { type: String, default: null },
  },
  { timestamps: true }
);

const userModel = mongoose.model("users", userSchema);
export default userModel;
