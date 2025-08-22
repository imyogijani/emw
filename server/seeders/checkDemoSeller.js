import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import userModel from "../models/userModel.js";
import Seller from "../models/sellerModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// MongoDB connection
const connectDB = async () => {
  try {
    const uri =
      "mongodb+srv://yogeshtundiya945:Yogesh945@foodecom.4nnke5y.mongodb.net/";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const checkDemoSeller = async () => {
  try {
    const demoUser = await userModel.findOne({ email: "demo@seller.com" });
    console.log("Demo User:", demoUser);

    if (demoUser) {
      const demoSeller = await Seller.findOne({ user: demoUser._id });
      console.log("Demo Seller:", demoSeller);
    }

    // Update demo user to skip onboarding if needed
    if (demoUser && !demoUser.isOnboardingComplete) {
      demoUser.isOnboardingComplete = true;
      demoUser.emailVerified = true;
      await demoUser.save();
      console.log("Updated demo user to skip onboarding");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

// Run the check
connectDB().then(() => {
  checkDemoSeller();
});
