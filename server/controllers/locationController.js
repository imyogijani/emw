import { State, City } from '../models/locationModel.js';

// Get all states
export const getStates = async (req, res) => {
  try {
    const searchQuery = (req.query.search || "").trim().toLowerCase();
    
    let query = { active: true };
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: 'i' };
    }
    
    const states = await State.find(query).select('name').sort({ name: 1 });
    const stateNames = states.map(state => state.name);

    res.status(200).json({
      success: true,
      data: stateNames,
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get cities for a state
export const getCitiesByState = async (req, res) => {
  try {
    let { state } = req.params;
    const { search } = req.query;

    // Find the state first
    const stateDoc = await State.findOne({ 
      name: { $regex: `^${state}$`, $options: 'i' },
      active: true 
    });

    if (!stateDoc) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // Build query for cities
    let query = { state: stateDoc._id, active: true };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const cities = await City.find(query).select('name').sort({ name: 1 });
    const cityNames = cities.map(city => city.name);

    res.status(200).json({
      success: true,
      data: cityNames,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getPincodesByCity = async (req, res) => {
  try {
    const stateName = req.params.state.trim();
    const cityName = req.params.city.trim();
    const search = (req.query.search || "").trim();

    // Find state
    const stateDoc = await State.findOne({
      name: { $regex: `^${stateName}$`, $options: 'i' },
      active: true
    });

    if (!stateDoc) {
      return res.status(404).json({ 
        success: false, 
        message: "State not found" 
      });
    }

    // Find city
    const cityDoc = await City.findOne({
      name: { $regex: `^${cityName}$`, $options: 'i' },
      state: stateDoc._id,
      active: true
    });

    if (!cityDoc) {
      return res.status(404).json({ 
        success: false, 
        message: "City not found" 
      });
    }

    let areas = cityDoc.areas;

    // Filter areas if search query provided
    if (search) {
      areas = areas.filter(area => {
        return (
          area.name.toLowerCase().includes(search.toLowerCase()) ||
          area.pincode.toString().includes(search)
        );
      });
    }

    // Convert to the expected format { AreaName: "Pincode" }
    const pinCodes = {};
    areas.forEach(area => {
      pinCodes[area.name] = area.pincode;
    });

    res.status(200).json({ 
      success: true, 
      data: pinCodes 
    });
  } catch (error) {
    console.error("Error fetching pincodes:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};
