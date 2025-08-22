import mongoose from "mongoose";
import bcrypt from "bcrypt";
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
    console.log("Connected to MongoDB for seeding");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const createDemoSeller = async () => {
  let session;
  try {
    // Start a session for atomic operations
    session = await mongoose.startSession();
    session.startTransaction();

    // 1. Create demo user first
    const hashedPassword = await bcrypt.hash("12345678", 10);

    const demoUser = new userModel({
      firstName: "Demo",
      lastName: "Seller",
      role: "shopowner",
      email: "demo@seller.com",
      mobile: "9876543210",
      password: hashedPassword,
      names: "Demo Seller",
      isOnboardingComplete: true, // Skip onboarding
      emailVerified: true, // No email verification needed
    });

    const savedUser = await demoUser.save({ session });

    // 2. Create demo seller profile with user reference
    const demoSeller = new Seller({
      user: savedUser._id, // Set user reference
      shopName: "Demo Shop",
      shopImage: "https://example.com/demo-shop.jpg",
      ownerName: "Demo Seller",
      description: "This is a demo seller account for testing purposes.",
      categories: [],
      location: "Demo Location",
      shopAddresses: [
        {
          addressLine1: "Demo Street",
          addressLine2: "Demo Area",
          city: "Demo City",
          state: "Demo State",
          pincode: "123456",
          country: "India",
          isDefault: true,
        },
      ],
      status: "active",
      isVerified: true,
      rating: 5.0,
      totalRatings: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalEarnings: 0,
      bankDetails: {
        accountHolder: "Demo Seller",
        accountNumber: "XXXXXXXXXXXXX",
        bankName: "Demo Bank",
        ifscCode: "DEMO0001234",
      },
    });

    const savedSeller = await demoSeller.save({ session });

    // 3. Update user with seller reference
    savedUser.sellerId = savedSeller._id;
    await savedUser.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    console.log("Demo seller account created successfully!");
    console.log("Email: demo@seller.com");
    console.log("Password: 12345678");
  } catch (error) {
    // Rollback the transaction on error
    if (session) {
      await session.abortTransaction();
    }
    console.error("Error creating demo seller:", error);
    process.exit(1);
  } finally {
    if (session) {
      session.endSession();
    }
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the seeder
connectDB().then(() => {
  createDemoSeller();
});
