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
  try {
    // 1. Create demo seller profile first
    const demoSeller = new Seller({
      shopName: "Demo Shop",
      shopImage: "https://example.com/demo-shop.jpg", // Replace with your default shop image
      ownerName: "Demo Seller",
      description: "This is a demo seller account for testing purposes.",
      categories: [], // You can add default categories if needed
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

    await demoSeller.save();

    console.log("Demo seller account created successfully!");
    console.log("Email: demo@seller.com");
    console.log("Password: 12345678");

    // Disconnect from database
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error creating demo seller:", error);
    process.exit(1);
  }
};

// Run the seeder
connectDB().then(() => {
  createDemoSeller();
});
