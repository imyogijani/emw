import express from 'express';
import {
  // State operations
  getAllStates,
  getStateById,
  createState,
  updateState,
  deleteState,
  
  // City operations
  getCitiesByState,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  
  // Area operations
  getAreasByCity,
  addAreaToCity,
  updateArea,
  deleteArea,
  
  // Search & utility operations
  searchByPincode,
  getLocationStats,
  bulkImportLocations,
  exportAllLocations
} from '../controllers/newLocationController.js';
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get all states (public for dropdowns)
router.get('/states', getAllStates);

// Get state by ID or name (public)
router.get('/states/:id', getStateById);

// Get cities by state (public for dropdowns)
router.get('/states/:stateId/cities', getCitiesByState);

// Get city by ID (public)
router.get('/cities/:id', getCityById);

// Get areas by city (public for dropdowns)
router.get('/cities/:cityId/areas', getAreasByCity);

// Search by pincode (public)
router.get('/search/pincode/:pincode', searchByPincode);

// Get location statistics (public)
router.get('/stats', getLocationStats);

// Export all locations (public for backup)
router.get('/export', exportAllLocations);

// ==================== ADMIN PROTECTED ROUTES ====================

// State management (Admin only)
router.post('/states', authenticateToken, authorizeAdmin, createState);
router.put('/states/:id', authenticateToken, authorizeAdmin, updateState);
router.delete('/states/:id', authenticateToken, authorizeAdmin, deleteState);

// City management (Admin only)
router.post('/cities', authenticateToken, authorizeAdmin, createCity);
router.put('/cities/:id', authenticateToken, authorizeAdmin, updateCity);
router.delete('/cities/:id', authenticateToken, authorizeAdmin, deleteCity);

// Area management (Admin only)
router.post('/cities/:cityId/areas', authenticateToken, authorizeAdmin, addAreaToCity);
router.put('/cities/:cityId/areas/:areaId', authenticateToken, authorizeAdmin, updateArea);
router.delete('/cities/:cityId/areas/:areaId', authenticateToken, authorizeAdmin, deleteArea);

// Bulk operations (Admin only)
router.post('/bulk-import', authenticateToken, authorizeAdmin, bulkImportLocations);

// ==================== LEGACY COMPATIBILITY ROUTES ====================
// These routes maintain compatibility with existing frontend code

// Legacy route: /api/location/states -> /api/locations/states
router.get('/legacy/states', getAllStates);

// Legacy route: /api/location/cities/:state -> /api/locations/states/:stateId/cities
router.get('/legacy/cities/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const { search } = req.query;
    
    // Find state by name (case-insensitive)
    const { State } = await import('../models/locationModel.js');
    const stateDoc = await State.findOne({ 
      name: { $regex: new RegExp(`^${state}$`, 'i') },
      isActive: true 
    });
    
    if (!stateDoc) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    // Forward to the new controller
    req.params.stateId = stateDoc._id;
    const { getCitiesByState } = await import('../controllers/newLocationController.js');
    return getCitiesByState(req, res);
  } catch (error) {
    console.error('Error in legacy cities route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

// Legacy route: /api/location/pincodes/:state/:city -> /api/locations/cities/:cityId/areas
router.get('/legacy/pincodes/:state/:city', async (req, res) => {
  try {
    const { state, city } = req.params;
    const { search } = req.query;
    
    // Find state and city
    const { State, City } = await import('../models/locationModel.js');
    
    const stateDoc = await State.findOne({ 
      name: { $regex: new RegExp(`^${state}$`, 'i') },
      isActive: true 
    });
    
    if (!stateDoc) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    const cityDoc = await City.findOne({
      name: { $regex: new RegExp(`^${city}$`, 'i') },
      state: stateDoc._id,
      isActive: true
    });
    
    if (!cityDoc) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    // Filter areas based on search
    let areas = cityDoc.areas;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      areas = areas.filter(area => 
        searchRegex.test(area.name) || area.pincode.includes(search)
      );
    }
    
    // Convert to legacy format: { AreaName: "Pincode" }
    const legacyFormat = {};
    areas.forEach(area => {
      legacyFormat[area.name] = area.pincode;
    });
    
    res.json({
      success: true,
      data: legacyFormat
    });
  } catch (error) {
    console.error('Error in legacy pincodes route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

// ==================== ADMIN LEGACY ROUTES ====================
// For backward compatibility with admin panel

// Legacy admin route: GET /api/admin/locations -> /api/locations/export
router.get('/admin/legacy/locations', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { exportAllLocations, getLocationStats } = await import('../controllers/newLocationController.js');
    
    // Get export data
    const exportReq = { ...req };
    const exportRes = {
      json: (data) => {
        if (!data.success) {
          return res.status(500).json(data);
        }
        
        // Get stats
        const statsReq = { ...req };
        const statsRes = {
          json: (statsData) => {
            if (!statsData.success) {
              return res.status(500).json(statsData);
            }
            
            // Combine export data with stats in legacy format
            res.json({
              success: true,
              data: data.data,
              stats: {
                totalStates: statsData.data.totalStates,
                totalCities: statsData.data.totalCities,
                totalPincodes: statsData.data.totalAreas
              }
            });
          }
        };
        
        getLocationStats(statsReq, statsRes);
      }
    };
    
    exportAllLocations(exportReq, exportRes);
  } catch (error) {
    console.error('Error in legacy admin locations route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations'
    });
  }
});

// Legacy admin route: POST /api/admin/locations/state -> /api/locations/states
router.post('/admin/legacy/state', authenticateToken, authorizeAdmin, createState);

// Legacy admin route: POST /api/admin/locations/city -> /api/locations/cities
router.post('/admin/legacy/city', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { stateName, cityName } = req.body;
    
    if (!stateName || !cityName) {
      return res.status(400).json({
        success: false,
        message: 'State name and city name are required'
      });
    }
    
    // Find state by name
    const { State } = await import('../models/locationModel.js');
    const state = await State.findOne({ 
      name: { $regex: new RegExp(`^${stateName}$`, 'i') },
      isActive: true 
    });
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    // Create city with state ID
    req.body = {
      name: cityName,
      stateId: state._id
    };
    
    const { createCity } = await import('../controllers/newLocationController.js');
    return createCity(req, res);
  } catch (error) {
    console.error('Error in legacy create city route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create city'
    });
  }
});

// Legacy admin route: DELETE /api/admin/locations/state/:stateName -> /api/locations/states/:id
router.delete('/admin/legacy/state/:stateName', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { stateName } = req.params;
    
    // Find state by name
    const { State } = await import('../models/locationModel.js');
    const state = await State.findOne({ 
      name: { $regex: new RegExp(`^${stateName}$`, 'i') },
      isActive: true 
    });
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    req.params.id = state._id;
    const { deleteState } = await import('../controllers/newLocationController.js');
    return deleteState(req, res);
  } catch (error) {
    console.error('Error in legacy delete state route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete state'
    });
  }
});

// Legacy admin route: DELETE /api/admin/locations/city/:stateName/:cityName -> /api/locations/cities/:id
router.delete('/admin/legacy/city/:stateName/:cityName', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { stateName, cityName } = req.params;
    
    // Find state and city
    const { State, City } = await import('../models/locationModel.js');
    
    const state = await State.findOne({ 
      name: { $regex: new RegExp(`^${stateName}$`, 'i') },
      isActive: true 
    });
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    
    const city = await City.findOne({
      name: { $regex: new RegExp(`^${cityName}$`, 'i') },
      state: state._id,
      isActive: true
    });
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    req.params.id = city._id;
    const { deleteCity } = await import('../controllers/newLocationController.js');
    return deleteCity(req, res);
  } catch (error) {
    console.error('Error in legacy delete city route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete city'
    });
  }
});

export default router;