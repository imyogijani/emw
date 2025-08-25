import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaMapMarkerAlt,
  FaCity,
  FaGlobe,
} from "react-icons/fa";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import JumpingLoader from "../../Components/JumpingLoader";
import "./ManageLocations.css";

const ManageLocations = () => {
  const [locations, setLocations] = useState({});
  const [stats, setStats] = useState({
    totalStates: 0,
    totalCities: 0,
    totalPincodes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddStateModal, setShowAddStateModal] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [newStateName, setNewStateName] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [expandedStates, setExpandedStates] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/locations");
      if (response.data.success) {
        setLocations(response.data.data);
        setStats(response.data.stats);
      }
      console.log("Fetched locations:", response.data.data);
      console.log("Fetched locations:", response.data.stats);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  const handleAddState = async (e) => {
    e.preventDefault();
    if (!newStateName.trim()) {
      toast.error("State name is required");
      return;
    }

    try {
      const response = await axios.post("/api/admin/locations/state", {
        stateName: newStateName.trim(),
      });

      if (response.data.success) {
        toast.success("State added successfully");
        setNewStateName("");
        setShowAddStateModal(false);
        fetchLocations();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add state");
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!selectedState || !newCityName.trim()) {
      toast.error("State and city name are required");
      return;
    }

    try {
      const response = await axios.post("/api/admin/locations/city", {
        stateName: selectedState,
        cityName: newCityName.trim(),
      });

      if (response.data.success) {
        toast.success("City added successfully");
        setNewCityName("");
        setSelectedState("");
        setShowAddCityModal(false);
        fetchLocations();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add city");
    }
  };

  const handleDeleteState = async (stateName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the state "${stateName}" and all its cities?`
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/admin/locations/state/${encodeURIComponent(stateName)}`
      );

      if (response.data.success) {
        toast.success("State deleted successfully");
        fetchLocations();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete state");
    }
  };

  const handleDeleteCity = async (stateName, cityName) => {
    if (
      !window.confirm(`Are you sure you want to delete the city "${cityName}"?`)
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/admin/locations/city/${encodeURIComponent(
          stateName
        )}/${encodeURIComponent(cityName)}`
      );

      if (response.data.success) {
        toast.success("City deleted successfully");
        fetchLocations();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete city");
    }
  };

  const toggleStateExpansion = (stateName) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(stateName)) {
      newExpanded.delete(stateName);
    } else {
      newExpanded.add(stateName);
    }
    setExpandedStates(newExpanded);
  };

  const filteredStates = Object.keys(locations).filter((state) =>
    state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="manage-locations loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <JumpingLoader size="medium" />
        <p>Loading locations...</p>
      </div>
    );
  }

  return (
    <div className="manage-locations">
      <div className="admin-header">
        <div>
          <h1>Manage Locations</h1>
          <p className="admin-subtitle">
            Manage states and cities for Indian addresses
          </p>
        </div>
        <div className="header-actions">
          <button
            className="add-btn add-state-btn"
            onClick={() => setShowAddStateModal(true)}
          >
            <FaPlus /> Add State
          </button>
          <button
            className="add-btn add-city-btn"
            onClick={() => setShowAddCityModal(true)}
          >
            <FaPlus /> Add City
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon state-icon">
            <FaGlobe />
          </div>
          <div className="stat-details">
            <p>{stats.totalStates}</p>
            <h3>Total States</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon city-icon">
            <FaCity />
          </div>
          <div className="stat-details">
            <p>{stats.totalCities}</p>
            <h3>Total Cities</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pincode-icon">
            <FaMapMarkerAlt />
          </div>
          <div className="stat-details">
            <p>{stats.totalPincodes}</p>
            <h3>Total Pincodes</h3>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search states..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Locations List */}
      <div className="locations-container">
        <div className="locations-list">
          {filteredStates.map((stateName) => (
            <div key={stateName} className="state-item">
              <div className="state-header">
                <div
                  className="state-info"
                  onClick={() => toggleStateExpansion(stateName)}
                >
                  <FaGlobe className="state-icon-small" />
                  <span className="state-name">{stateName}</span>
                  <span className="city-count">
                    ({Object.keys(locations[stateName]).length} cities)
                  </span>
                </div>
                <div className="state-actions">
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteState(stateName)}
                    title="Delete State"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {expandedStates.has(stateName) && (
                <div className="cities-list">
                  {Object.keys(locations[stateName]).map((cityName) => (
                    <div key={cityName} className="city-item">
                      <div className="city-info">
                        <FaCity className="city-icon-small" />
                        <span className="city-name">{cityName}</span>
                        <span className="pincode-count">
                          ({locations[stateName][cityName].length} pincodes)
                        </span>
                      </div>
                      <div className="city-actions">
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteCity(stateName, cityName)}
                          title="Delete City"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add State Modal */}
      {showAddStateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New State</h3>
            <form onSubmit={handleAddState}>
              <div className="form-group">
                <label>State Name</label>
                <input
                  type="text"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="Enter state name"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Add State
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddStateModal(false);
                    setNewStateName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showAddCityModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New City</h3>
            <form onSubmit={handleAddCity}>
              <div className="form-group">
                <label>Select State</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  required
                >
                  <option value="">Choose a state</option>
                  {Object.keys(locations).map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>City Name</label>
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="Enter city name"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Add City
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddCityModal(false);
                    setNewCityName("");
                    setSelectedState("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLocations;
