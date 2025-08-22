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

const updateDemoSeller = async () => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Update demo user
      const demoUser = await userModel.findOne({ email: "demo@seller.com" });
      if (!demoUser) {
        throw new Error("Demo user not found");
      }

      // 2. Get or create demo seller
      let demoSeller = await Seller.findOne({ user: demoUser._id });
      if (!demoSeller) {
        throw new Error("Demo seller not found");
      }

      // 3. Update user settings
      demoUser.isOnboardingComplete = true;
      demoUser.emailVerified = true;
      demoUser.sellerId = demoSeller._id;
      await demoUser.save({ session });

      // 4. Update seller settings
      demoSeller.isOnboardingComplete = true;
      demoSeller.isVerified = true;
      demoSeller.status = "active";
      demoSeller.onboardingStep = 5; // Complete all steps
      await demoSeller.save({ session });

      // 5. Commit transaction
      await session.commitTransaction();
      console.log("Demo seller account updated successfully!");
      console.log("Email: demo@seller.com");
      console.log("Password: 12345678");
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

// Run the update
connectDB().then(() => {
  updateDemoSeller();
});
