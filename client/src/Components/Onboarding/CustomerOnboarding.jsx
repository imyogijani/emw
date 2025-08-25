import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast, validateForm } from "../../utils/errorHandler";
import "./CustomerOnboarding.css";

const CustomerOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    preferences: [],
    location: {
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  });

  const categoryOptions = [
    { id: "electronics", name: "Electronics", icon: "📱" },
    { id: "fashion", name: "Fashion & Clothing", icon: "👕" },
    { id: "home", name: "Home & Garden", icon: "🏠" },
    { id: "books", name: "Books & Media", icon: "📚" },
    { id: "sports", name: "Sports & Fitness", icon: "⚽" },
    { id: "beauty", name: "Beauty & Personal Care", icon: "💄" },
    { id: "food", name: "Food & Beverages", icon: "🍕" },
    { id: "automotive", name: "Automotive", icon: "🚗" },
  ];

  const handlePreferenceToggle = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(categoryId)
        ? prev.preferences.filter((id) => id !== categoryId)
        : [...prev.preferences, categoryId],
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const handleNotificationChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  const validateOnboardingForm = () => {
    const validationRules = {
      preferences: {
        required: true,
        requiredMessage: "Please select at least one preference",
        custom: (value) => value.length > 0 || "Please select at least one preference"
      },
      'location.city': {
        required: true,
        requiredMessage: "City is required"
      },
      'location.state': {
        required: true,
        requiredMessage: "State is required"
      }
    };

    const flatFormData = {
      preferences: formData.preferences,
      'location.city': formData.location.city,
      'location.state': formData.location.state
    };

    const { isValid } = validateForm(flatFormData, validationRules);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateOnboardingForm()) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      // Update user onboarding status
      const response = await fetch("/api/auth/complete-onboarding", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          onboardingData: formData,
          userType: "customer",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update user data in localStorage
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        userData.isOnboardingComplete = true;
        localStorage.setItem("user", JSON.stringify(userData));

        toast.success("Welcome! Your account is now set up.");
        navigate("/");
      } else {
        toast.error(data.message || "Failed to complete onboarding");
      }
    } catch (error) {
      console.error("Onboarding error:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Complete onboarding with minimal data
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <div className="customer-onboarding-container">
      <div className="customer-onboarding-card">
        <div className="onboarding-header">
          <h1>Welcome to Our Marketplace!</h1>
          <p>Let's personalize your shopping experience</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Shopping Preferences */}
          <div className="form-section">
            <h3>What are you interested in?</h3>
            <p className="section-description">
              Select categories you'd like to explore (optional)
            </p>
            <div className="preferences-grid">
              {categoryOptions.map((category) => (
                <div
                  key={category.id}
                  className={`preference-item ${
                    formData.preferences.includes(category.id) ? "selected" : ""
                  }`}
                  onClick={() => handlePreferenceToggle(category.id)}
                >
                  <span className="preference-icon">{category.icon}</span>
                  <span className="preference-name">{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location Information */}
          <div className="form-section">
            <h3>Delivery Location</h3>
            <p className="section-description">
              Help us show you nearby stores and accurate delivery times
            </p>
            <div className="location-grid">
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) =>
                    handleLocationChange("address", e.target.value)
                  }
                  placeholder="Enter your address"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.location.state}
                  onChange={(e) =>
                    handleLocationChange("state", e.target.value)
                  }
                  placeholder="State"
                />
              </div>
              <div className="form-group">
                <label>PIN Code</label>
                <input
                  type="text"
                  value={formData.location.pincode}
                  onChange={(e) =>
                    handleLocationChange("pincode", e.target.value)
                  }
                  placeholder="PIN Code"
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="form-section">
            <h3>Stay Updated</h3>
            <p className="section-description">
              Choose how you'd like to receive updates about orders and offers
            </p>
            <div className="notification-options">
              <label className="notification-item">
                <input
                  type="checkbox"
                  checked={formData.notifications.email}
                  onChange={() => handleNotificationChange("email")}
                />
                <span className="checkmark"></span>
                <div className="notification-info">
                  <strong>Email Notifications</strong>
                  <small>Order updates, offers, and newsletters</small>
                </div>
              </label>
              <label className="notification-item">
                <input
                  type="checkbox"
                  checked={formData.notifications.push}
                  onChange={() => handleNotificationChange("push")}
                />
                <span className="checkmark"></span>
                <div className="notification-info">
                  <strong>Push Notifications</strong>
                  <small>Real-time updates on your device</small>
                </div>
              </label>
              <label className="notification-item">
                <input
                  type="checkbox"
                  checked={formData.notifications.sms}
                  onChange={() => handleNotificationChange("sms")}
                />
                <span className="checkmark"></span>
                <div className="notification-info">
                  <strong>SMS Notifications</strong>
                  <small>Important order and delivery updates</small>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSkip}
              className="skip-button"
              disabled={loading}
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="complete-button"
              disabled={loading}
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </button>
          </div>
        </form>

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOnboarding;
