import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

//  __dirname banane ka tarika (ESM me)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//  Correct file path
const filePath = path.join(__dirname, "../data/india-pincodes.json");

//  Read file
const pincodesData = JSON.parse(fs.readFileSync(filePath, "utf8"));

//  Get all states
export const getStates = async (req, res) => {
  try {
    const searchQuery = (req.query.search || "").trim().toLowerCase();
    const states = Object.keys(pincodesData).map((state) => state.trim());

    const filteredStates = searchQuery
      ? states.filter((state) => state.toLowerCase().includes(searchQuery))
      : states;

    res.status(200).json({
      success: true,
      data: filteredStates,
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//  Get cities for a state
export const getCitiesByState = async (req, res) => {
  try {
    let { state } = req.params;
    const { search } = req.query; // For filtering cities by name

    // Normalize to lowercase for matching
    state = state.toLowerCase();

    // Convert keys to lowercase for case-insensitive search
    const normalizedStates = Object.keys(pincodesData).reduce((acc, key) => {
      acc[key.toLowerCase()] = pincodesData[key];
      return acc;
    }, {});

    if (!normalizedStates[state]) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    let cities = Object.keys(normalizedStates[state]);

    // If search query is provided, filter cities
    if (search) {
      const searchLower = search.toLowerCase();
      cities = cities.filter((city) =>
        city.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      success: true,
      data: cities,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getPincodesByCity = (req, res) => {
  try {
    const stateName = req.params.state.trim().toLowerCase();
    const cityName = req.params.city.trim().toLowerCase();
    const search = (req.query.search || "").trim(); // optional pincode/area search

    // Find state (case-insensitive)
    const state = Object.keys(pincodesData).find(
      (s) => s.trim().toLowerCase() === stateName
    );

    if (!state) {
      return res
        .status(404)
        .json({ success: false, message: "State not found" });
    }

    // Find city (case-insensitive)
    const city = Object.keys(pincodesData[state]).find(
      (c) => c.trim().toLowerCase() === cityName
    );

    if (!city) {
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    }

    let pinCodes = pincodesData[state][city]; // { AreaName: "Pincode" }

    // If user gave a search query, filter results
    if (search) {
      pinCodes = Object.fromEntries(
        Object.entries(pinCodes).filter(([area, pincode]) => {
          return (
            area.toLowerCase().includes(search.toLowerCase()) || // match by area name
            pincode.toString().includes(search) // match by pincode number
          );
        })
      );
    }

    res.status(200).json({ success: true, data: pinCodes });
  } catch (error) {
    console.error("Error fetching pincodes:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
