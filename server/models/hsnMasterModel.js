import mongoose from 'mongoose';

const hsnSchema = new mongoose.Schema({
  HSN_CD: { type: String, required: true, unique: true },
  HSN_Description: { type: String, required: true }
});

const HSNMaster = mongoose.model('hsn_master', hsnSchema);

export default HSNMaster;
