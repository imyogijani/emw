import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaCity,
  FaMapMarkerAlt,
  FaGlobe,
} from "react-icons/fa";
import axios from "../../utils/axios";
import { showErrorToast, showSuccessToast } from "../../utils/muiAlertHandler.jsx";
import JumpingLoader from "../../Components/JumpingLoader";
import "./ManageLocations.css";

const ManageLocations = () => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState({});
  const [pincodes, setPincodes] = useState({});

  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalCountries: 0,
    totalStates: 0,
    totalCities: 0,
    totalPincodes: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showAddStateModal, setShowAddStateModal] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [showAddPincodeModal, setShowAddPincodeModal] = useState(false);

  // Inputs
  const [newStateName, setNewStateName] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newPincode, setNewPincode] = useState("");

  // Selections
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");

  // Expand UI
  const [expandedStates, setExpandedStates] = useState(new Set());
  const [expandedCities, setExpandedCities] = useState(new Set());

  useEffect(() => {
    fetchStates();
    fetchStats();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/location/states");
      if (res.data.success) setStates(res.data.data);
      console.log(res.data.data);
    } catch (err) {
      showErrorToast("Failed to fetch states", "Locations - Fetch States", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (stateId) => {
    if (cities[stateId]) return; // already loaded
    try {
      const res = await axios.get(`/api/location/cities/${stateId}`);
      if (res.data.success) {
        setCities((prev) => ({ ...prev, [stateId]: res.data.data }));
      }
    } catch {
      showErrorToast("Failed to fetch cities", "Locations - Fetch Cities");
    }
  };

  const fetchPincodes = async (stateId, cityId) => {
    const key = `${stateId}-${cityId}`;
    if (pincodes[key]) return;
    try {
      const res = await axios.get(`/api/location/pincode/${stateId}/${cityId}`);
      if (res.data.success) {
        setPincodes((prev) => ({ ...prev, [key]: res.data.data }));
      }
    } catch {
      showErrorToast("Failed to fetch pincodes", "Locations - Fetch Pincodes");
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/location/stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch {
      showErrorToast("Failed to fetch stats", "Locations - Fetch Stats");
    }
  };

  // ========= CRUD =========
  const handleAddState = async (e) => {
    e.preventDefault();
    if (!newStateName.trim()) return showErrorToast("State name required", "Locations - Add State");
    try {
      const res = await axios.post("/api/location/state", {
        name: newStateName.trim(),
        country: "68ad34991048ec5580634565", // India
      });
      if (res.data.success) {
        showSuccessToast("State added", "Locations - Add State");
        setNewStateName("");
        setShowAddStateModal(false);
        fetchStates();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to add state", "Locations - Add State");
    }
  };

  const handleDeleteState = async (id) => {
    if (!window.confirm("Delete state and all its cities?")) return;
    try {
      await axios.delete(`/api/location/state/${id}`);
      showSuccessToast("State deleted", "Locations - Delete State");
      fetchStates();
    } catch {
      showErrorToast("Failed to delete state", "Locations - Delete State");
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!selectedStateId || !newCityName.trim())
      return showErrorToast("Select state & enter city", "Locations - Add City");
    try {
      const res = await axios.post("/api/location/city", {
        state: selectedStateId,
        name: newCityName.trim(),
      });
      if (res.data.success) {
        showSuccessToast("City added", "Locations - Add City");
        setNewCityName("");
        setShowAddCityModal(false);
        setCities({});
        fetchCities(selectedStateId);
      }
    } catch {
      showErrorToast("Failed to add city", "Locations - Add City");
    }
  };

  const handleDeleteCity = async (id, stateId) => {
    if (!window.confirm("Delete city?")) return;
    try {
      await axios.delete(`/api/location/city/${id}`);
      showSuccessToast("City deleted", "Locations - Delete City");
      setCities((prev) => {
        const updated = { ...prev };
        delete updated[stateId];
        return updated;
      });
      fetchCities(stateId);
    } catch {
      showErrorToast("Failed to delete city", "Locations - Delete City");
    }
  };

  const handleAddPincode = async (e) => {
    e.preventDefault();
    if (!selectedStateId || !selectedCityId || !newAreaName || !newPincode)
      return showErrorToast("All fields required", "Locations - Add Pincode");

    try {
      const res = await axios.post("/api/location/pincode", {
        // stateId: selectedStateId,
        city: selectedCityId,
        areaName: newAreaName.trim(),
        pincode: newPincode.trim(),
      });
      if (res.data.success) {
        showSuccessToast("Pincode added", "Locations - Add Pincode");
        setNewAreaName("");
        setNewPincode("");
        setShowAddPincodeModal(false);
        setPincodes({});
        fetchPincodes(selectedStateId, selectedCityId);
      }
    } catch {
      showErrorToast("Failed to add pincode", "Locations - Add Pincode");
    }
  };

  const handleDeletePincode = async (id, stateId, cityId) => {
    if (!window.confirm("Delete pincode?")) return;
    console.log(
      `Deleting pincode ${id} for state ${stateId} and city ${cityId}`
    );
    try {
      await axios.delete(`/api/location/pincode/${id}`);
      showSuccessToast("Pincode deleted", "Locations - Delete Pincode");
      setPincodes((prev) => {
        const key = `${stateId}-${cityId}`;
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      fetchPincodes(stateId, cityId);
    } catch {
      showErrorToast("Failed to delete pincode", "Locations - Delete Pincode");
    }
  };

  // Expand toggle
  const toggleStateExpansion = (stateId) => {
    const newSet = new Set(expandedStates);
    newSet.has(stateId) ? newSet.delete(stateId) : newSet.add(stateId);
    setExpandedStates(newSet);
    if (!cities[stateId]) fetchCities(stateId);
  };

  const toggleCityExpansion = (stateId, cityId) => {
    const key = `${stateId}-${cityId}`;
    const newSet = new Set(expandedCities);
    newSet.has(key) ? newSet.delete(key) : newSet.add(key);
    setExpandedCities(newSet);
    if (!pincodes[key]) fetchPincodes(stateId, cityId);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="manage-locations">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Manage Locations</h1>
          <p className="admin-subtitle">
            Manage states, cities & pincodes dynamically
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowAddStateModal(true)}>
            <FaPlus /> Add State
          </button>
          <button onClick={() => setShowAddCityModal(true)}>
            <FaPlus /> Add City
          </button>
          <button onClick={() => setShowAddPincodeModal(true)}>
            <FaPlus /> Add Pincode
          </button>
        </div>
      </div>

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

      {/* States List */}
      <div className="locations-list">
        {states.map((state) => (
          <div key={state._id} className="state-item">
            <div
              className="state-header"
              onClick={() => toggleStateExpansion(state._id)}
            >
              <FaGlobe /> <span>{state.stateName}</span>
            </div>
            <button
              className="delete-btn"
              onClick={() => handleDeleteState(state._id)}
            >
              <FaTrash />
            </button>

            {expandedStates.has(state._id) &&
              (cities[state._id] || []).map((city) => {
                const cityKey = `${state._id}-${city._id}`;
                return (
                  <div key={city._id} className="city-item">
                    <div
                      className="city-header"
                      onClick={() => toggleCityExpansion(state._id, city._id)}
                    >
                      <FaCity /> <span>{city.cityName}</span>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteCity(city._id, state._id)}
                    >
                      <FaTrash />
                    </button>

                    {expandedCities.has(cityKey) && (
                      <div className="pincode-list">
                        {(pincodes[cityKey] || []).map((p) => (
                          <div key={p._id} className="pincode-item">
                            <FaMapMarkerAlt />
                            <span>
                              {p.areaName} - {p.pincode}
                            </span>
                            <button
                              className="delete-btn"
                              onClick={() =>
                                handleDeletePincode(p._id, state._id, city._id)
                              }
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {/* Add State Modal */}
      {showAddStateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add State</h3>
            <form onSubmit={handleAddState}>
              <input
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="State name"
                required
              />
              <div className="modal-actions">
                <button type="submit">Add</button>
                <button
                  type="button"
                  onClick={() => setShowAddStateModal(false)}
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
            <h3>Add City</h3>
            <form onSubmit={handleAddCity}>
              <select
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                required
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.stateName}
                  </option>
                ))}
              </select>
              <input
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="City name"
                required
              />
              <div className="modal-actions">
                <button type="submit">Add</button>
                <button
                  type="button"
                  onClick={() => setShowAddCityModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pincode Modal */}
      {showAddPincodeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Pincode</h3>
            <form onSubmit={handleAddPincode}>
              <select
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                required
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.stateName}
                  </option>
                ))}
              </select>

              {selectedStateId && (
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  required
                >
                  <option value="">Select city</option>
                  {(cities[selectedStateId] || []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.cityName}
                    </option>
                  ))}
                </select>
              )}

              <input
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Area name"
                required
              />
              <input
                value={newPincode}
                onChange={(e) => setNewPincode(e.target.value)}
                placeholder="Pincode"
                required
              />
              <div className="modal-actions">
                <button type="submit">Add</button>
                <button
                  type="button"
                  onClick={() => setShowAddPincodeModal(false)}
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
