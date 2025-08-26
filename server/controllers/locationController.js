// import { State, City } from "../models/locationModel.js";
import { Country, State, City, Pincode } from "../models/locationModel.js";

// Get all states
// export const getStates = async (req, res) => {
//   try {
//     const searchQuery = (req.query.search || "").trim().toLowerCase();

//     let query = { active: true };
//     if (searchQuery) {
//       query.name = { $regex: searchQuery, $options: "i" };
//     }

//     const states = await State.find(query).select("name").sort({ name: 1 });
//     const stateNames = states.map((state) => state.name);

//     res.status(200).json({
//       success: true,
//       data: stateNames,
//     });
//   } catch (error) {
//     console.error("Error fetching states:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// // Get cities for a state
// export const getCitiesByState = async (req, res) => {
//   try {
//     let { state } = req.params;
//     const { search } = req.query;

//     // Find the state first
//     const stateDoc = await State.findOne({
//       name: { $regex: `^${state}$`, $options: "i" },
//       active: true,
//     });

//     if (!stateDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "State not found",
//       });
//     }

//     // Build query for cities
//     let query = { state: stateDoc._id, active: true };
//     if (search) {
//       query.name = { $regex: search, $options: "i" };
//     }

//     const cities = await City.find(query).select("name").sort({ name: 1 });
//     const cityNames = cities.map((city) => city.name);

//     res.status(200).json({
//       success: true,
//       data: cityNames,
//     });
//   } catch (error) {
//     console.error("Error fetching cities:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// export const getPincodesByCity = async (req, res) => {
//   try {
//     const stateName = req.params.state.trim();
//     const cityName = req.params.city.trim();
//     const search = (req.query.search || "").trim();

//     // Find state
//     const stateDoc = await State.findOne({
//       name: { $regex: `^${stateName}$`, $options: "i" },
//       active: true,
//     });

//     if (!stateDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "State not found",
//       });
//     }

//     // Find city
//     const cityDoc = await City.findOne({
//       name: { $regex: `^${cityName}$`, $options: "i" },
//       state: stateDoc._id,
//       active: true,
//     });

//     if (!cityDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "City not found",
//       });
//     }

//     let areas = cityDoc.areas;

//     // Filter areas if search query provided
//     if (search) {
//       areas = areas.filter((area) => {
//         return (
//           area.name.toLowerCase().includes(search.toLowerCase()) ||
//           area.pincode.toString().includes(search)
//         );
//       });
//     }

//     // Convert to the expected format { AreaName: "Pincode" }
//     const pinCodes = {};
//     areas.forEach((area) => {
//       pinCodes[area.name] = area.pincode;
//     });

//     res.status(200).json({
//       success: true,
//       data: pinCodes,
//     });
//   } catch (error) {
//     console.error("Error fetching pincodes:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// ================== Get All Locations ==================
export const getLocations = async (req, res) => {
  try {
    // Fetch pincodes with population (join city → state → country)
    const locations = await Pincode.find({ isActive: true })
      .populate({
        path: "city",
        select: "name state",
        populate: {
          path: "state",
          select: "name country",
          populate: {
            path: "country",
            select: "name",
          },
        },
      })
      .select("pincode areaName city");

    // Format data for frontend
    const formatted = locations.map((loc) => ({
      _id: loc._id,
      country: loc.city.state.country.name,
      state: loc.city.state.name,
      city: loc.city.name,
      areaName: loc.areaName,
      pincode: loc.pincode,
    }));

    // Stats calculation
    const totalCountries = await Country.countDocuments({ isActive: true });
    const totalStates = await State.countDocuments({ isActive: true });
    const totalCities = await City.countDocuments({ isActive: true });
    const totalPincodes = await Pincode.countDocuments({ isActive: true });

    const stats = {
      countries: totalCountries,
      states: totalStates,
      cities: totalCities,
      pincodes: totalPincodes,
    };

    res.status(200).json({
      success: true,
      data: formatted,
      stats,
    });
  } catch (err) {
    console.error("❌ Error fetching locations:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================== Get all States ==================
export const getStatesDropDown = async (req, res) => {
  try {
    const searchQuery = (req.query.search || "").trim().toLowerCase();

    let query = { isActive: true };
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: "i" };
    }

    const states = await State.find(query).select("name").sort({ name: 1 });
    const stateNames = states.map((s) => s.name);

    res.status(200).json({
      success: true,
      data: stateNames,
    });
  } catch (err) {
    console.error("❌ Error fetching states:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================== Get Cities by State ==================
export const getCitiesByStateDropDown = async (req, res) => {
  try {
    const { state } = req.params;
    const searchQuery = (req.query.search || "").trim();

    // 1. Find the state
    const stateDoc = await State.findOne({
      name: { $regex: `^${state}$`, $options: "i" },
      isActive: true,
    });

    if (!stateDoc) {
      return res
        .status(404)
        .json({ success: false, message: "State not found" });
    }

    // 2. Find cities of this state
    let query = { state: stateDoc._id, isActive: true };
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: "i" };
    }

    const cities = await City.find(query).select("name").sort({ name: 1 });
    const cityNames = cities.map((c) => c.name);

    res.status(200).json({ success: true, data: cityNames });
  } catch (err) {
    console.error("❌ Error fetching cities:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================== Get Pincodes by City ==================
export const getPincodesByCityDropDown = async (req, res) => {
  try {
    const stateName = req.params.state.trim();
    const cityName = req.params.city.trim();
    const searchQuery = (req.query.search || "").trim();

    // 1. Find State
    const stateDoc = await State.findOne({
      name: { $regex: `^${stateName}$`, $options: "i" },
      isActive: true,
    });
    if (!stateDoc) {
      return res
        .status(404)
        .json({ success: false, message: "State not found" });
    }

    // 2. Find City
    const cityDoc = await City.findOne({
      name: { $regex: `^${cityName}$`, $options: "i" },
      state: stateDoc._id,
      isActive: true,
    });
    if (!cityDoc) {
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    }

    // 3. Find Pincodes of this city
    let query = { city: cityDoc._id, isActive: true };
    if (searchQuery) {
      query.$or = [
        { areaName: { $regex: searchQuery, $options: "i" } },
        { pincode: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const pincodes = await Pincode.find(query)
      .select("areaName pincode")
      .sort({ areaName: 1 });

    // Convert to { "AreaName": "Pincode" }
    const result = {};
    pincodes.forEach((p) => {
      result[p.areaName] = p.pincode;
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("❌ Error fetching pincodes:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getStates = async (req, res) => {
  try {
    const searchQuery = (req.query.search || "").trim().toLowerCase();

    let query = { isActive: true };
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: "i" };
    }

    // Select both _id and name
    const states = await State.find(query).select("_id name").sort({ name: 1 });

    // Map to custom response format
    const stateData = states.map((s) => ({
      _id: s._id,
      stateName: s.name,
    }));

    res.status(200).json({
      success: true,
      data: stateData,
    });
  } catch (err) {
    console.error("❌ Error fetching states:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getCitiesByState = async (req, res) => {
  try {
    const { stateId } = req.params;
    const searchQuery = (req.query.search || "").trim();

    // 1. Validate stateId
    const stateDoc = await State.findOne({ _id: stateId, isActive: true });
    if (!stateDoc) {
      return res
        .status(404)
        .json({ success: false, message: "State not found" });
    }

    // 2. Find cities of this state
    let query = { state: stateId, isActive: true };
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: "i" };
    }

    const cities = await City.find(query).select("_id name").sort({ name: 1 });

    // 3. Format response (only cityId & cityName)
    const cityList = cities.map((c) => ({
      _id: c._id,
      cityName: c.name,
    }));

    res.status(200).json({ success: true, data: cityList });
  } catch (err) {
    console.error("❌ Error fetching cities:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//  Get pincodes by stateId + cityId with optional search
export const getPincodesByCity = async (req, res) => {
  try {
    const { stateId, cityId } = req.params;
    const searchQuery = (req.query.search || "").trim();

    // 1. Validate State
    const stateDoc = await State.findOne({ _id: stateId, isActive: true });
    if (!stateDoc) {
      return res
        .status(404)
        .json({ success: false, message: "State not found" });
    }

    // 2. Validate City
    const cityDoc = await City.findOne({
      _id: cityId,
      state: stateId,
      isActive: true,
    });
    if (!cityDoc) {
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    }

    // 3. Find pincodes of this city
    let query = { city: cityId, isActive: true };

    if (searchQuery) {
      query.$or = [
        { areaName: { $regex: searchQuery, $options: "i" } },
        { pincode: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const pincodes = await Pincode.find(query)
      .select("areaName pincode") // select only required fields
      .sort({ areaName: 1 });

    // 4. Format response → array of objects
    const result = pincodes.map((p) => ({
      _id: p._id,
      areaName: p.areaName,
      pincode: p.pincode,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("❌ Error fetching pincodes:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==================== Get All Countries ====================
export const getAllCountries = async (req, res) => {
  try {
    const searchQuery = (req.query.search || "").trim();

    let query = { isActive: true };
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: "i" };
    }

    const countries = await Country.find(query)
      .select("_id name")
      .sort({ name: 1 });

    const countryList = countries.map((c) => ({
      _id: c._id,
      countryName: c.name,
    }));

    res.status(200).json({ success: true, data: countryList });
  } catch (err) {
    console.error("❌ Error fetching countries:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===================== Country =====================
export const createCountry = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Country name required" });

    const country = new Country({
      name,
      createdBy: req.userId,
      updatedBy: req.userId,
    });

    await country.save();
    res.status(201).json({ success: true, data: country });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const country = await Country.findById(id);
    if (!country)
      return res
        .status(404)
        .json({ success: false, message: "Country not found" });

    if (name) country.name = name;
    if (isActive !== undefined) country.isActive = isActive;
    country.updatedBy = req.userId;

    await country.save();
    res.status(200).json({ success: true, data: country });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ===================== State =====================
export const createState = async (req, res) => {
  try {
    const { name, country } = req.body;
    if (!name || !country)
      return res
        .status(400)
        .json({ success: false, message: "Name and Country required" });

    const state = new State({
      name,
      country,
      createdBy: req.userId,
      updatedBy: req.userId,
    });

    await state.save();
    res.status(201).json({ success: true, data: state });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, country } = req.body;

    const state = await State.findById(id);
    if (!state)
      return res
        .status(404)
        .json({ success: false, message: "State not found" });

    if (name) state.name = name;
    if (isActive !== undefined) state.isActive = isActive;
    if (country) state.country = country;
    state.updatedBy = req.userId;

    await state.save();
    res.status(200).json({ success: true, data: state });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ===================== City =====================
export const createCity = async (req, res) => {
  try {
    const { name, state } = req.body;
    if (!name || !state)
      return res
        .status(400)
        .json({ success: false, message: "Name and State required" });

    const city = new City({
      name,
      state,
      createdBy: req.userId,
      updatedBy: req.userId,
    });

    await city.save();
    res.status(201).json({ success: true, data: city });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, state } = req.body;

    const city = await City.findById(id);
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });

    if (name) city.name = name;
    if (isActive !== undefined) city.isActive = isActive;
    if (state) city.state = state;
    city.updatedBy = req.userId;

    await city.save();
    res.status(200).json({ success: true, data: city });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ===================== Pincode / Area =====================
export const createPincode = async (req, res) => {
  try {
    const { pincode, areaName, city } = req.body;
    if (!pincode || !areaName || !city)
      return res
        .status(400)
        .json({ success: false, message: "Pincode, Area Name, City required" });

    const pin = new Pincode({
      pincode,
      areaName,
      city,
      createdBy: req.userId,
      updatedBy: req.userId,
    });

    await pin.save();
    res.status(201).json({ success: true, data: pin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updatePincode = async (req, res) => {
  try {
    const { id } = req.params;
    const { pincode, areaName, isActive, city } = req.body;

    const pin = await Pincode.findById(id);
    if (!pin)
      return res
        .status(404)
        .json({ success: false, message: "Pincode not found" });

    if (pincode) pin.pincode = pincode;
    if (areaName) pin.areaName = areaName;
    if (isActive !== undefined) pin.isActive = isActive;
    if (city) pin.city = city;
    pin.updatedBy = req.userId;

    await pin.save();
    res.status(200).json({ success: true, data: pin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete :

// ===================== DELETE COUNTRY =====================
export const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const country = await Country.findById(id);
    if (!country)
      return res
        .status(404)
        .json({ success: false, message: "Country not found" });

    // Find states in this country
    const states = await State.find({ country: id });

    for (let state of states) {
      const cities = await City.find({ state: state._id });
      for (let city of cities) {
        await Pincode.deleteMany({ city: city._id }); // delete all pincodes of city
      }
      await City.deleteMany({ state: state._id }); // delete all cities
    }

    await State.deleteMany({ country: id }); // delete states
    await Country.findByIdAndDelete(id); // delete country

    res.status(200).json({
      success: true,
      message: "Country and all related states, cities, pincodes deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== DELETE STATE =====================
export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    const state = await State.findById(id);
    if (!state)
      return res
        .status(404)
        .json({ success: false, message: "State not found" });

    const cities = await City.find({ state: id });
    for (let city of cities) {
      await Pincode.deleteMany({ city: city._id }); // delete pincodes
    }

    await City.deleteMany({ state: id }); // delete cities
    await State.findByIdAndDelete(id); // delete state

    res.status(200).json({
      success: true,
      message: "State and related cities & pincodes deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== DELETE CITY =====================
export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findById(id);
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });

    await Pincode.deleteMany({ city: id }); // delete pincodes
    await City.findByIdAndDelete(id); // delete city

    res
      .status(200)
      .json({ success: true, message: "City and related pincodes deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== DELETE PINCODE =====================
export const deletePincode = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Pincode params id :", id);

    const pin = await Pincode.findById(id);
    if (!pin)
      return res
        .status(404)
        .json({ success: false, message: "Pincode not found" });

    await Pincode.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Pincode deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getLocationStats = async (req, res) => {
  try {
    // Use Promise.all for parallel execution (faster)
    const [totalCountries, totalStates, totalCities, totalPincodes] =
      await Promise.all([
        Country.countDocuments({ isActive: true }),
        State.countDocuments({ isActive: true }),
        City.countDocuments({ isActive: true }),
        Pincode.countDocuments({ isActive: true }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalCountries,
        totalStates,
        totalCities,
        totalPincodes,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching location stats:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
