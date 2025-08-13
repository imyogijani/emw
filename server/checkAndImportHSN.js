import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { importHSNData } from './importHSN.js';
import HSNMaster from './models/hsnMasterModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAndImportHSN() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Check if HSN data exists
    const count = await HSNMaster.countDocuments();
    console.log(`Current HSN records in database: ${count}`);
    
    if (count === 0) {
      console.log('No HSN data found. Importing HSN data...');
      await importHSNData();
      const newCount = await HSNMaster.countDocuments();
      console.log(`HSN data imported successfully. Total records: ${newCount}`);
    } else {
      console.log('HSN data already exists in the database.');
    }
    
    // Test a sample query
    const sampleHSN = await HSNMaster.findOne({ HSN_CD: '0101' });
    if (sampleHSN) {
      console.log('Sample HSN record:', sampleHSN);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

checkAndImportHSN();