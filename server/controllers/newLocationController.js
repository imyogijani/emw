import { State, City } from '../models/locationModel.js';
import mongoose from 'mongoose';

// ==================== STATE OPERATIONS ====================

// Get all states with optional search
export const getAllStates = async (req, res) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { isActive: true };
    if (search) {
      query.name = { $regex: new RegExp(search, 'i') };
    }
    
    const states = await State.find(query)
      .populate('cityCount')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await State.countDocuments(query);
    
    res.json({
      success: true,
      data: states,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: states.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
};

// Get single state by ID or name
export const getStateById = async (req, res) => {
  try {
    const { id } = req.params;
    let state;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      state = await State.findById(id).populate('cityCount');
    } else {
      state = await State.findByName(id);
    }
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    res.json({
      success: true,
      data: state
    });
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch state',
      error: error.message
    });
  }
};

// Create new state
export const createState = async (req, res) => {
  try {
    const { name, country = 'India' } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'State name is required'
      });
    }
    
    const state = new State({
      name: name.trim(),
      country: country.trim(),
      createdBy: req.user?.id
    });
    
    await state.save();
    
    res.status(201).json({
      success: true,
      message: 'State created successfully',
      data: state
    });
  } catch (error) {
    console.error('Error creating state:', error);
    
    if (error.code === 'DUPLICATE_STATE') {
      return res.status(409).json({
        success: false,
        message: 'State name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create state',
      error: error.message
    });
  }
};

// Update state
export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, isActive } = req.body;
    
    const state = await State.findById(id);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    if (name) state.name = name.trim();
    if (country) state.country = country.trim();
    if (typeof isActive === 'boolean') state.isActive = isActive;
    state.updatedBy = req.user?.id;
    
    await state.save();
    
    res.json({
      success: true,
      message: 'State updated successfully',
      data: state
    });
  } catch (error) {
    console.error('Error updating state:', error);
    
    if (error.code === 'DUPLICATE_STATE') {
      return res.status(409).json({
        success: false,
        message: 'State name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update state',
      error: error.message
    });
  }
};

// Delete state (soft delete)
export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    const state = await State.findById(id);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    // Check if state has active cities
    const activeCities = await City.countDocuments({ state: id, isActive: true });
    if (activeCities > 0 && !permanent) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete state. It has ${activeCities} active cities. Use permanent=true to force delete.`
      });
    }
    
    if (permanent === 'true') {
      // Permanently delete state and all its cities
      await City.deleteMany({ state: id });
      await State.findByIdAndDelete(id);
    } else {
      // Soft delete
      state.isActive = false;
      state.updatedBy = req.user?.id;
      await state.save();
      
      // Also soft delete all cities in this state
      await City.updateMany(
        { state: id },
        { isActive: false, updatedBy: req.user?.id }
      );
    }
    
    res.json({
      success: true,
      message: `State ${permanent === 'true' ? 'permanently deleted' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error deleting state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete state',
      error: error.message
    });
  }
};

// ==================== CITY OPERATIONS ====================

// Get cities by state
export const getCitiesByState = async (req, res) => {
  try {
    const { stateId } = req.params;
    const { search, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Validate state exists
    const state = await State.findById(stateId);
    if (!state || !state.isActive) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    const query = { state: stateId, isActive: true };
    if (search) {
      query.name = { $regex: new RegExp(search, 'i') };
    }
    
    const cities = await City.find(query)
      .populate('state', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await City.countDocuments(query);
    
    res.json({
      success: true,
      data: cities,
      state: { id: state._id, name: state.name },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: cities.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
};

// Get single city by ID
export const getCityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const city = await City.findById(id)
      .populate('state', 'name country');
    
    if (!city || !city.isActive) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    res.json({
      success: true,
      data: city
    });
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city',
      error: error.message
    });
  }
};

// Create new city
export const createCity = async (req, res) => {
  try {
    const { name, stateId, areas = [] } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }
    
    if (!stateId) {
      return res.status(400).json({
        success: false,
        message: 'State ID is required'
      });
    }
    
    // Validate state exists
    const state = await State.findById(stateId);
    if (!state || !state.isActive) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    // Validate areas if provided
    const validatedAreas = [];
    for (const area of areas) {
      if (!area.name || !area.pincode) {
        return res.status(400).json({
          success: false,
          message: 'Area name and pincode are required'
        });
      }
      
      if (!/^\d{6}$/.test(area.pincode)) {
        return res.status(400).json({
          success: false,
          message: `Invalid pincode: ${area.pincode}. Must be 6 digits.`
        });
      }
      
      validatedAreas.push({
        name: area.name.trim(),
        pincode: area.pincode.trim()
      });
    }
    
    const city = new City({
      name: name.trim(),
      state: stateId,
      areas: validatedAreas,
      createdBy: req.user?.id
    });
    
    await city.save();
    await city.populate('state', 'name country');
    
    res.status(201).json({
      success: true,
      message: 'City created successfully',
      data: city
    });
  } catch (error) {
    console.error('Error creating city:', error);
    
    if (error.code === 'DUPLICATE_CITY') {
      return res.status(409).json({
        success: false,
        message: 'City name already exists in this state'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message
    });
  }
};

// Update city
export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    
    const city = await City.findById(id);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    if (name) city.name = name.trim();
    if (typeof isActive === 'boolean') city.isActive = isActive;
    city.updatedBy = req.user?.id;
    
    await city.save();
    await city.populate('state', 'name country');
    
    res.json({
      success: true,
      message: 'City updated successfully',
      data: city
    });
  } catch (error) {
    console.error('Error updating city:', error);
    
    if (error.code === 'DUPLICATE_CITY') {
      return res.status(409).json({
        success: false,
        message: 'City name already exists in this state'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: error.message
    });
  }
};

// Delete city (soft delete)
export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    const city = await City.findById(id);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    if (permanent === 'true') {
      await City.findByIdAndDelete(id);
    } else {
      city.isActive = false;
      city.updatedBy = req.user?.id;
      await city.save();
    }
    
    res.json({
      success: true,
      message: `City ${permanent === 'true' ? 'permanently deleted' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: error.message
    });
  }
};

// ==================== AREA OPERATIONS ====================

// Get areas by city
export const getAreasByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { search, pincode } = req.query;
    
    const city = await City.findById(cityId)
      .populate('state', 'name');
    
    if (!city || !city.isActive) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    let areas = city.areas;
    
    // Filter by search term or pincode
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      areas = areas.filter(area => 
        searchRegex.test(area.name) || area.pincode.includes(search)
      );
    }
    
    if (pincode) {
      areas = areas.filter(area => area.pincode === pincode);
    }
    
    res.json({
      success: true,
      data: areas,
      city: { id: city._id, name: city.name, state: city.state }
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch areas',
      error: error.message
    });
  }
};

// Add area to city
export const addAreaToCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { name, pincode } = req.body;
    
    if (!name || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Area name and pincode are required'
      });
    }
    
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must be 6 digits'
      });
    }
    
    const city = await City.findById(cityId);
    if (!city || !city.isActive) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    await city.addArea(name.trim(), pincode.trim());
    await city.populate('state', 'name');
    
    res.status(201).json({
      success: true,
      message: 'Area added successfully',
      data: city
    });
  } catch (error) {
    console.error('Error adding area:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add area'
    });
  }
};

// Update area
export const updateArea = async (req, res) => {
  try {
    const { cityId, areaId } = req.params;
    const { name, pincode } = req.body;
    
    const city = await City.findById(cityId);
    if (!city || !city.isActive) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    const updates = {};
    if (name) updates.name = name.trim();
    if (pincode) {
      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Pincode must be 6 digits'
        });
      }
      updates.pincode = pincode.trim();
    }
    
    await city.updateArea(areaId, updates);
    await city.populate('state', 'name');
    
    res.json({
      success: true,
      message: 'Area updated successfully',
      data: city
    });
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update area'
    });
  }
};

// Delete area
export const deleteArea = async (req, res) => {
  try {
    const { cityId, areaId } = req.params;
    
    const city = await City.findById(cityId);
    if (!city || !city.isActive) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    await city.removeArea(areaId);
    await city.populate('state', 'name');
    
    res.json({
      success: true,
      message: 'Area deleted successfully',
      data: city
    });
  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete area'
    });
  }
};

// ==================== SEARCH & UTILITY OPERATIONS ====================

// Search locations by pincode
export const searchByPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Must be 6 digits.'
      });
    }
    
    const cities = await City.searchByPincode(pincode);
    
    const results = cities.map(city => {
      const matchingAreas = city.areas.filter(area => area.pincode === pincode);
      return {
        city: {
          id: city._id,
          name: city.name,
          state: city.state
        },
        areas: matchingAreas
      };
    });
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching by pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search by pincode',
      error: error.message
    });
  }
};

// Get location statistics
export const getLocationStats = async (req, res) => {
  try {
    const totalStates = await State.countDocuments({ isActive: true });
    const totalCities = await City.countDocuments({ isActive: true });
    
    // Get total areas count
    const citiesWithAreas = await City.aggregate([
      { $match: { isActive: true } },
      { $project: { areaCount: { $size: '$areas' } } },
      { $group: { _id: null, totalAreas: { $sum: '$areaCount' } } }
    ]);
    
    const totalAreas = citiesWithAreas.length > 0 ? citiesWithAreas[0].totalAreas : 0;
    
    res.json({
      success: true,
      data: {
        totalStates,
        totalCities,
        totalAreas,
        totalPincodes: totalAreas // Since each area has one pincode
      }
    });
  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location statistics',
      error: error.message
    });
  }
};

// Bulk import locations (for migration)
export const bulkImportLocations = async (req, res) => {
  try {
    const { locations } = req.body;
    
    if (!locations || typeof locations !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid locations data format'
      });
    }
    
    const results = {
      states: { created: 0, skipped: 0 },
      cities: { created: 0, skipped: 0 },
      areas: { created: 0, skipped: 0 },
      errors: []
    };
    
    for (const [stateName, stateData] of Object.entries(locations)) {
      try {
        // Create or find state
        let state = await State.findByName(stateName);
        if (!state) {
          state = new State({ 
            name: stateName.trim(), 
            createdBy: req.user?.id 
          });
          await state.save();
          results.states.created++;
        } else {
          results.states.skipped++;
        }
        
        // Process cities
        for (const [cityName, cityAreas] of Object.entries(stateData)) {
          try {
            let city = await City.findByStateAndName(state._id, cityName);
            
            if (!city) {
              city = new City({
                name: cityName.trim(),
                state: state._id,
                areas: [],
                createdBy: req.user?.id
              });
              results.cities.created++;
            } else {
              results.cities.skipped++;
            }
            
            // Process areas
            for (const [areaName, pincode] of Object.entries(cityAreas)) {
              const cleanPincode = pincode.toString().trim();
              
              if (!/^\d{6}$/.test(cleanPincode)) {
                results.errors.push(`Invalid pincode ${cleanPincode} for ${areaName}, ${cityName}, ${stateName}`);
                continue;
              }
              
              const existingArea = city.areas.find(area => 
                area.name.toLowerCase() === areaName.toLowerCase() || 
                area.pincode === cleanPincode
              );
              
              if (!existingArea) {
                city.areas.push({
                  name: areaName.trim(),
                  pincode: cleanPincode
                });
                results.areas.created++;
              } else {
                results.areas.skipped++;
              }
            }
            
            await city.save();
          } catch (cityError) {
            results.errors.push(`Error processing city ${cityName}: ${cityError.message}`);
          }
        }
      } catch (stateError) {
        results.errors.push(`Error processing state ${stateName}: ${stateError.message}`);
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk import completed',
      data: results
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import locations',
      error: error.message
    });
  }
};

// Export all locations (for backup)
export const exportAllLocations = async (req, res) => {
  try {
    const states = await State.find({ isActive: true }).sort({ name: 1 });
    const exportData = {};
    
    for (const state of states) {
      const cities = await City.find({ state: state._id, isActive: true }).sort({ name: 1 });
      exportData[state.name] = {};
      
      for (const city of cities) {
        exportData[state.name][city.name] = {};
        
        for (const area of city.areas) {
          exportData[state.name][city.name][area.name] = area.pincode;
        }
      }
    }
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export locations',
      error: error.message
    });
  }
};