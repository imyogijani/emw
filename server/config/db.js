/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import mongoose from "mongoose";
import colors from "colors";

const connectDB = async (retryCount = 0, maxRetries = 3) => {
  try {
    // Validate environment variables
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      console.log('📝 Please set MONGO_URI in your .env file');
      console.log('📝 Server will continue without database connection');
      return null;
    }

    // Log connection attempt
    console.log(`🔄 Attempting to connect to MongoDB... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
    console.log(`📍 MongoDB URI: ${process.env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    const mongoURL = process.env.MONGO_URI.trim();

    // Enhanced connection options for production
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain a minimum of 5 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
    };

    const conn = await mongoose.connect(mongoURL, connectionOptions);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📍 Database: ${conn.connection.name}`);
    console.log(`📍 Port: ${conn.connection.port}`);
    console.log(`📍 Ready State: ${conn.connection.readyState}`);

    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📝 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error(`❌ MongoDB connection error (Attempt ${retryCount + 1}):`, {
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      name: error.name
    });

    // Retry logic for production resilience
    if (retryCount < maxRetries) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      console.log(`🔄 Retrying connection in ${retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return connectDB(retryCount + 1, maxRetries);
    } else {
      console.error('❌ Failed to connect to MongoDB after maximum retries');
      console.log('📝 Server will continue without database connection');
      console.log('📝 Please check your MongoDB connection string and network connectivity');
      
      // In production, you might want to exit the process
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 Production environment detected - database connection is critical');
        console.error('🚨 Consider implementing proper database failover or exit the process');
      }
      
      return null;
    }
  }
};

// Health check function for database connection
export const checkDatabaseHealth = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: states[state] || 'unknown',
    readyState: state,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    port: mongoose.connection.port
  };
};

export default connectDB;
