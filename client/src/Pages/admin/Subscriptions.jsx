import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./Subscriptions.css";

const ALL_FEATURES = [
  { key: "analytics", label: "Analytics" },
  { key: "prioritySupport", label: "Priority Support" },
  { key: "featuredListing", label: "Featured Listing" },
  { key: "customBranding", label: "Custom Branding" },
];

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [formData, setFormData] = useState({
    planName: "",
    monthlyPrice: "",
    yearlyPrice: "",
    includedFeatures: "",
  });
  const [featureState, setFeatureState] = useState({
    analytics: false,
    prioritySupport: false,
    featuredListing: false,
    customBranding: false,
    productLimit: "",
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get("/api/subscriptions");
      setSubscriptions(response.data.subscriptions);
      console.log("Fetched subscriptions:", response.data.subscriptions);
      setLoading(false);
    } catch (error) {
      toast.error("Error fetching subscriptions.");
      console.log(error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFeatureChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFeatureState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // Build includedFeatures array
    const features = [];
    if (featureState.productLimit)
      features.push(`productLimit:${featureState.productLimit}`);
    ALL_FEATURES.forEach((f) => {
      if (featureState[f.key]) features.push(f.key);
    });
    const submitData = {
      planName: formData.planName,
      pricing: {
        monthly: formData.monthlyPrice,
        yearly: formData.yearlyPrice, // <-- add this in the form state
      },
      includedFeatures: features,
    };
    try {
      if (currentSubscription) {
        await axios.put(
          `/api/subscriptions/${currentSubscription._id}`,
          submitData
        );
        toast.success("Subscription updated successfully!");
      } else {
        await axios.post("/api/subscriptions", submitData);
        toast.success("Subscription created successfully!");
      }
      fetchSubscriptions();
      setShowModal(false);
      setCurrentSubscription(null);
      setFormData({
        planName: "",
        monthlyPrice: "",
        yearlyPrice: "",
        includedFeatures: "",
      });
      setFeatureState({
        analytics: false,
        prioritySupport: false,
        featuredListing: false,
        customBranding: false,
        productLimit: "",
      });
    } catch (error) {
      toast.error("Error saving subscription.");
      console.log(error);
    }
  };

  const handleEdit = (subscription) => {
    setCurrentSubscription(subscription);
    // Parse features
    const features = Array.isArray(subscription.includedFeatures)
      ? subscription.includedFeatures
      : [];
    const productLimit = features.find((f) => f.startsWith("productLimit:"));
    setFeatureState({
      analytics: features.includes("analytics"),
      prioritySupport: features.includes("prioritySupport"),
      featuredListing: features.includes("featuredListing"),
      customBranding: features.includes("customBranding"),
      productLimit: productLimit ? productLimit.split(":")[1] : "",
    });
    setFormData({
      planName: subscription.planName,
      monthlyPrice: subscription.pricing?.monthly || "",
      yearlyPrice: subscription.pricing?.yearly || "",
      includedFeatures: features.join(", "),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      try {
        await axios.delete(`/api/subscriptions/${id}`);
        toast.success("Subscription deleted successfully!");
        fetchSubscriptions();
      } catch (error) {
        toast.error("Error deleting subscription.");
        console.log(error);
      }
    }
  };

  const handleAddClick = () => {
    setCurrentSubscription(null);
    setFormData({
      planName: "",
      monthlyPrice: "",
      yearlyPrice: "",
      includedFeatures: "",
    });
    setFeatureState({
      analytics: false,
      prioritySupport: false,
      featuredListing: false,
      customBranding: false,
      productLimit: "",
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading subscriptions...</div>;
  }

  return (
    <div className="subscriptions-container">
      <div className="admin-header">
        <h1>Subscription Plans</h1>
        <p className="admin-subtitle">
          Manage your subscription plans and pricing
        </p>
      </div>

      <div className="subscriptions-table-container">
        <div className="table-header">
          <h2>Subscription Plans</h2>
          <button className="add-new-btn" onClick={handleAddClick}>
            <FaPlus /> Add New Plan
          </button>
        </div>

        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Monthly Price</th>
              <th>Included Features</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription._id}>
                <td>
                  <div className="user-info">
                    <i className="fas fa-crown"></i>
                    {subscription.planName}
                  </div>
                </td>
                <td>₹{subscription.pricing?.monthly || 'N/A'}</td>
                <td>{Array.isArray(subscription.includedFeatures) ? subscription.includedFeatures.join(", ") : 'N/A'}</td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(subscription)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(subscription._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="subscription-modal-overlay">
          <div className="subscription-modal-card">
            <h3 className="subscription-modal-title">
              {currentSubscription
                ? "Edit Subscription"
                : "Add New Subscription"}
            </h3>
            <div className="subscription-modal-card-content">
              <form className="subscription-form" onSubmit={handleFormSubmit}>
                <div className="subscription-form-group">
                  <label className="subscription-label">Plan Name:</label>
                  <input
                    type="text"
                    name="planName"
                    className="subscription-input"
                    value={formData.planName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="subscription-form-group">
                  <label className="subscription-label">Monthly Price:</label>
                  <input
                    type="number"
                    name="monthlyPrice"
                    className="subscription-input"
                    value={formData.monthlyPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="subscription-form-group">
                  <label className="subscription-label">Yearly Price:</label>
                  <input
                    type="number"
                    name="yearlyPrice"
                    className="subscription-input"
                    value={formData.yearlyPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="subscription-feature-group">
                  <div className="subscription-product-limit-row">
                    <label
                      htmlFor="productLimit"
                      className="subscription-label"
                    >
                      Product Limit:
                    </label>
                    <input
                      type="number"
                      name="productLimit"
                      id="productLimit"
                      className="subscription-input"
                      value={featureState.productLimit}
                      onChange={handleFeatureChange}
                      min="1"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <label
                    className="subscription-label"
                    style={{ marginBottom: 0 }}
                  >
                    Features:
                  </label>
                  {ALL_FEATURES.map((f) => (
                    <div
                      key={f.key}
                      className="subscription-feature-checkbox-row"
                    >
                      <input
                        type="checkbox"
                        name={f.key}
                        id={f.key}
                        className="subscription-feature-checkbox"
                        checked={featureState[f.key]}
                        onChange={handleFeatureChange}
                      />
                      <label
                        htmlFor={f.key}
                        className="subscription-feature-label"
                      >
                        {f.label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="subscription-form-actions">
                  <button type="submit" className="subscription-save-btn">
                    Save
                  </button>
                  <button
                    type="button"
                    className="subscription-cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
