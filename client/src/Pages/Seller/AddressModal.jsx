// src/components/Modal/AddressModal.jsx
import React, { useEffect, useState } from "react";
import "./AddressModal.css";
import axios from "../../utils/axios"; // Adjust the import path as necessary
import { toast } from "react-toastify";
import { Button, Input } from "../../Components/Reusable";

const AddressModal = ({
  isOpen,
  onClose,
  onSave,
  addressForm,
  setAddressForm,
  isEditing,
}) => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load states on open
  useEffect(() => {
    if (!isOpen) return; // only fetch when modal is open

    const fetchStates = async () => {
      try {
        const res = await axios.get("/api/location/states");
        setStates(res.data.data || []);
      } catch (err) {
        console.error("Error fetching states:", err);
        // optional: show error toast to user
        toast.error("Failed to load states");
        setStates([]);
      }
    };

    fetchStates();
  }, [isOpen]);

  // Load cities when state changes
  useEffect(() => {
    if (!addressForm.state) return;

    const fetchCities = async () => {
      try {
        setCities([]); // reset cities before loading
        if (!isEditing) {
          //  Only reset when adding a new address
          setAddressForm((prev) => ({ ...prev, city: "", pincode: "" }));
        }
        setPincodes([]); // reset pincode

        const res = await axios.get(
          `/api/location/cities/${addressForm.state}`
        );
        setCities(res.data.data || []);
      } catch (err) {
        console.error("Error fetching cities:", err);
        toast.error("Failed to load cities");
        setCities([]);
      }
    };

    fetchCities();
  }, [addressForm.state]);

  // Load pincodes when city changes
  useEffect(() => {
    if (!addressForm.state || !addressForm.city) return;

    const fetchPincodes = async () => {
      try {
        if (!isEditing) {
          //  Keep existing pincode in edit mode
          setAddressForm((prev) => ({ ...prev, pincode: "" }));
        }

        const res = await axios.get(
          `/api/location/pincodes/${addressForm.state}/${addressForm.city}`
        );
        setPincodes(Object.values(res.data.data) || []);
      } catch (err) {
        console.error("Error fetching pincodes:", err);
        toast.error("Failed to load pincodes");
        setPincodes([]);
      }
    };

    fetchPincodes();
  }, [addressForm.city]);

  const handleSave = () => {
    let errors = {};

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user.email === "demo@seller.com") {
      toast.info("This is a demo account. You cannot add products.");
      return; //  stop here
    }

    if (!addressForm.addressLine1?.trim()) {
      errors.addressLine1 = "Address Line 1 is required";
    }
    if (!addressForm.state) {
      errors.state = "State is required";
    }
    if (!addressForm.city) {
      errors.city = "City is required";
    }
    if (!addressForm.pincode) {
      errors.pincode = "Pincode is required";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fill all required fields before saving");
      return;
    }

    // No validation for addressLine2 — it's optional
    onSave();
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{isEditing ? "Edit Address" : "Add Address"}</h3>

        {/* Address Line 1 */}
        <Input
          name="addressLine1"
          placeholder="Address Line 1"
          value={addressForm.addressLine1}
          onChange={(e) =>
            setAddressForm({ ...addressForm, addressLine1: e.target.value })
          }
        />
        {fieldErrors.addressLine1 && (
          <span style={{ color: "red", fontSize: "14px" }}>
            {fieldErrors.addressLine1}
          </span>
        )}

        {/* Address Line 2 - Optional */}
        <Input
          name="addressLine2"
          placeholder="Address Line 2 (optional)"
          value={addressForm.addressLine2}
          onChange={(e) =>
            setAddressForm({ ...addressForm, addressLine2: e.target.value })
          }
        />

        {/* State Dropdown */}
        <select
          name="state"
          value={addressForm.state}
          onChange={(e) =>
            setAddressForm({ ...addressForm, state: e.target.value })
          }
        >
          <option value="">Select State</option>
          {states.map((state, idx) => (
            <option key={idx} value={state}>
              {state}
            </option>
          ))}
        </select>
        {fieldErrors.state && (
          <span style={{ color: "red", fontSize: "14px" }}>
            {fieldErrors.state}
          </span>
        )}

        {/* City Dropdown */}
        <select
          name="city"
          value={addressForm.city}
          onChange={(e) =>
            setAddressForm({ ...addressForm, city: e.target.value })
          }
          disabled={!addressForm.state}
        >
          <option value="">Select City</option>
          {cities.map((city, idx) => (
            <option key={idx} value={city}>
              {city}
            </option>
          ))}
        </select>
        {fieldErrors.city && (
          <span style={{ color: "red", fontSize: "14px" }}>
            {fieldErrors.city}
          </span>
        )}

        {/* Pincode Dropdown */}
        <select
          name="pincode"
          value={addressForm.pincode}
          onChange={(e) =>
            setAddressForm({ ...addressForm, pincode: e.target.value })
          }
          disabled={!addressForm.city}
        >
          <option value="">Select Pincode</option>
          {pincodes.map((pin, idx) => (
            <option key={idx} value={pin}>
              {pin}
            </option>
          ))}
        </select>
        {fieldErrors.pincode && (
          <span style={{ color: "red", fontSize: "14px" }}>
            {fieldErrors.pincode}
          </span>
        )}

        {/* Country */}
        <Input
          name="country"
          placeholder="Country"
          value={addressForm.country}
          onChange={(e) =>
            setAddressForm({ ...addressForm, country: e.target.value })
          }
        />

        <div className="modal-actions">
          <Button className="btn-primary" onClick={handleSave}>
            Save
          </Button>
          <Button className="btn-danger" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
