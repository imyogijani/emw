import HSNMaster from '../models/hsnMasterModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all HSN codes
export const getAllHSNCodes = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    let query = {};
    
    // If search parameter is provided, search in both code and description
    if (search) {
      query = {
        $or: [
          { HSN_CD: { $regex: search, $options: 'i' } },
          { HSN_Description: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const hsnCodes = await HSNMaster.find(query)
      .select('HSN_CD HSN_Description')
      .limit(parseInt(limit))
      .sort({ HSN_CD: 1 });
    
    res.status(200).json({
      success: true,
      data: hsnCodes,
      count: hsnCodes.length
    });
  } catch (error) {
    console.error('Error fetching HSN codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HSN codes',
      error: error.message
    });
  }
};

// Get HSN code by code
export const getHSNByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const hsnCode = await HSNMaster.findOne({ HSN_CD: code });
    
    if (!hsnCode) {
      return res.status(404).json({
        success: false,
        message: 'HSN code not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: hsnCode
    });
  } catch (error) {
    console.error('Error fetching HSN code:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HSN code',
      error: error.message
    });
  }
};

// Get GST rate by HSN code
export const getGSTRateByHSN = async (req, res) => {
  try {
    const { hsnCode } = req.params;
    
    if (!hsnCode) {
      return res.status(400).json({
        success: false,
        message: 'HSN code is required'
      });
    }
    
    // Read GST mapping file
    const gstMappingPath = path.join(__dirname, '../data/HSN_GST_MAPPING.json');
    const gstMappingData = JSON.parse(fs.readFileSync(gstMappingPath, 'utf8'));
    
    // Extract first 2 digits of HSN code for chapter-level mapping
    const chapterCode = hsnCode.substring(0, 2);
    
    // Look for exact HSN code first, then fall back to chapter code
    let gstInfo = gstMappingData.HSN_GST_MAPPING[hsnCode] || gstMappingData.HSN_GST_MAPPING[chapterCode];
    
    if (!gstInfo) {
      return res.status(404).json({
        success: false,
        message: 'GST rate not found for this HSN code',
        hsnCode: hsnCode,
        chapterCode: chapterCode
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        hsnCode: hsnCode,
        chapterCode: chapterCode,
        gstRate: gstInfo.gstRate,
        description: gstInfo.description
      }
    });
  } catch (error) {
    console.error('Error fetching GST rate:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching GST rate',
      error: error.message
    });
  }
};