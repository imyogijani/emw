import mongoose from "mongoose";

// Area Schema - for storing pincode areas
const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be 6 digits']
  }
}, { _id: true });

// City Schema
const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
  },
  areas: [areaSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// State Schema
const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
stateSchema.index({ name: 1 });
stateSchema.index({ isActive: 1 });

citySchema.index({ name: 1, state: 1 });
citySchema.index({ state: 1 });
citySchema.index({ isActive: 1 });
citySchema.index({ 'areas.pincode': 1 });
citySchema.index({ 'areas.name': 1 });

// Virtual for city count in state
stateSchema.virtual('cityCount', {
  ref: 'City',
  localField: '_id',
  foreignField: 'state',
  count: true,
  match: { isActive: true }
});

// Virtual for total areas count in city
citySchema.virtual('areaCount').get(function() {
  return this.areas ? this.areas.length : 0;
});

// Pre-save middleware to ensure unique state names (case-insensitive)
stateSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingState = await this.constructor.findOne({
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id }
    });
    
    if (existingState) {
      const error = new Error('State name already exists');
      error.code = 'DUPLICATE_STATE';
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to ensure unique city names within a state (case-insensitive)
citySchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isModified('state')) {
    const existingCity = await this.constructor.findOne({
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      state: this.state,
      _id: { $ne: this._id }
    });
    
    if (existingCity) {
      const error = new Error('City name already exists in this state');
      error.code = 'DUPLICATE_CITY';
      return next(error);
    }
  }
  next();
});

// Static methods for State
stateSchema.statics.findByName = function(name) {
  return this.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    isActive: true 
  });
};

stateSchema.statics.searchStates = function(searchTerm = '', limit = 50) {
  const query = { isActive: true };
  if (searchTerm) {
    query.name = { $regex: new RegExp(searchTerm, 'i') };
  }
  return this.find(query)
    .sort({ name: 1 })
    .limit(limit)
    .populate('cityCount');
};

// Static methods for City
citySchema.statics.findByStateAndName = function(stateId, cityName) {
  return this.findOne({
    state: stateId,
    name: { $regex: new RegExp(`^${cityName}$`, 'i') },
    isActive: true
  }).populate('state');
};

citySchema.statics.searchCities = function(stateId, searchTerm = '', limit = 50) {
  const query = { state: stateId, isActive: true };
  if (searchTerm) {
    query.name = { $regex: new RegExp(searchTerm, 'i') };
  }
  return this.find(query)
    .sort({ name: 1 })
    .limit(limit)
    .populate('state', 'name');
};

citySchema.statics.searchByPincode = function(pincode) {
  return this.find({
    'areas.pincode': pincode,
    isActive: true
  }).populate('state', 'name');
};

// Instance methods
citySchema.methods.addArea = function(areaName, pincode) {
  // Check if area with same name or pincode already exists
  const existingArea = this.areas.find(area => 
    area.name.toLowerCase() === areaName.toLowerCase() || 
    area.pincode === pincode
  );
  
  if (existingArea) {
    throw new Error('Area name or pincode already exists in this city');
  }
  
  this.areas.push({ name: areaName, pincode });
  return this.save();
};

citySchema.methods.removeArea = function(areaId) {
  this.areas.id(areaId).remove();
  return this.save();
};

citySchema.methods.updateArea = function(areaId, updates) {
  const area = this.areas.id(areaId);
  if (!area) {
    throw new Error('Area not found');
  }
  
  // Check for duplicates if updating name or pincode
  if (updates.name || updates.pincode) {
    const duplicate = this.areas.find(a => 
      a._id.toString() !== areaId.toString() && (
        (updates.name && a.name.toLowerCase() === updates.name.toLowerCase()) ||
        (updates.pincode && a.pincode === updates.pincode)
      )
    );
    
    if (duplicate) {
      throw new Error('Area name or pincode already exists in this city');
    }
  }
  
  Object.assign(area, updates);
  return this.save();
};

// Create models
const State = mongoose.model('State', stateSchema);
const City = mongoose.model('City', citySchema);

export { State, City };
export default { State, City };