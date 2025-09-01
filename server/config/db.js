/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("⚠️  MONGO_URI is not defined in environment variables".yellow);
      console.warn("   Database features will be disabled. Server will continue without database.".yellow);
      return;
    }

    const mongoURL = process.env.MONGO_URI.trim();
    console.log("Attempting to connect to MongoDB...".yellow);

    // Set connection timeout to prevent hanging
    await mongoose.connect(mongoURL, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000,
    });

    console.log(
      `Connected To MongoDB Database ${mongoose.connection.host}`.bgMagenta
        .white
    );
  } catch (error) {
    console.log("MongoDB Connection Error Details:".red);
    console.log("Error type:", error.name);
    console.log("Error message:", error.message);
    console.warn("⚠️  Failed to connect to MongoDB. Server will continue without database.".yellow);
    console.warn("   To fix this:".yellow);
    console.warn("   1. Make sure MongoDB is running locally, or".yellow);
    console.warn("   2. Update MONGO_URI in .env to use MongoDB Atlas".yellow);
    // Don't exit the process, let the server continue
  }
};

export default connectDB;
