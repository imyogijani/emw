import fs from "fs";
import mongoose from "mongoose";
import HSNMaster from "./models/hsnMasterModel.js";

const rawData = fs.readFileSync("./data/HSN_SAC.json", "utf-8");
const jsonData = JSON.parse(rawData);

export async function importHSNData() {
  try {
    const hsnArray = jsonData.HSN_MSTR;
    await HSNMaster.insertMany(hsnArray);
    console.log("HSN data imported successfully");
  } catch (err) {
    console.error("Error importing data:", err);
  }
}

// importHSNData();
