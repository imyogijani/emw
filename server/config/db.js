/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const mongoURL = process.env.MONGO_URI.trim();
    console.log("Attempting to connect to MongoDB...".yellow);

    await mongoose.connect(mongoURL);

    console.log(
      `Connected To MongoDB Database ${mongoose.connection.host}`.bgMagenta
        .white
    );
  } catch (error) {
    console.log("MongoDB Connection Error Details:".red);
    console.log("Error type:", error.name);
    console.log("Error message:", error.message);
    console.log("Stack trace:", error.stack);
    process.exit(1);
  }
};

export default connectDB;
