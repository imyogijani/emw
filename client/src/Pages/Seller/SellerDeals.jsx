import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaPercentage,
  FaTag,
  FaSpinner,
} from "react-icons/fa";
import axios from "../../utils/axios";
import "./SellerDeals.css";
import "./SellerDealsForm.css";

const SellerDeals = () => {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    productId: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchDeals();
    fetchProducts();
  }, []);

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/deals/seller", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setDeals(response.data.deals);
      }
    } catch (error) {
      toast.error("Error fetching deals");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/products/seller-products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setProducts(response.data.products);
        console.log("Seller page to product get --00", response.data.products);
      }
    } catch (error) {
      toast.error("Error fetching products");
      console.log(error);
    }
  };

  const handleCreateDeal = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/deals/create", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Deal created successfully and sent for admin approval");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        productId: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
      });
      fetchDeals();
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error creating deal"); // fallback
      }
      console.log(error);
    }
  };

  const handleEndDeal = async (dealId) => {
    if (window.confirm("Are you sure you want to end this deal?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `/api/deals/${dealId}/end`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Deal ended successfully");
        fetchDeals();
      } catch (error) {
        toast.error("Error ending deal");
        console.log(error);
      }
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (window.confirm("Are you sure you want to delete this deal?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/deals/${dealId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Deal deleted successfully");
        fetchDeals();
      } catch (error) {
        toast.error("Error deleting deal");
        console.log(error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ffa500";
      case "approved":
        return "#28a745";
      case "rejected":
        return "#dc3545";
      case "active":
        return "#007bff";
      case "expired":
        return "#6c757d";
      case "ended":
        return "#6c757d";
      default:
        return "#6c757d";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading deals...</p>
      </div>
    );
  }

  return (
    <div className="seller-deals">
      <div className="admin-header">
        <div>
          <h1>My Deals</h1>
          <p className="admin-subtitle">
            Create and manage your special offers
          </p>
        </div>
        <button className="add-deal-btn" onClick={() => setShowForm(true)}>
          <FaPlus style={{ marginRight: "0.5rem" }} />
          Create New Deal
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Deal</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form
                className="seller-deal-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateDeal();
                }}
              >
                <div className="seller-deal-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    className="seller-deal-form-control"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="seller-deal-form-group">
                  <label>Description</label>
                  <textarea
                    className="seller-deal-form-control"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  ></textarea>
                </div>
                <div className="seller-deal-form-group">
                  <label>Product</label>
                  <select
                    className="seller-deal-form-control"
                    value={formData.productId}
                    onChange={(e) =>
                      setFormData({ ...formData, productId: e.target.value })
                    }
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="seller-deal-form-group">
                  <label>Discount (%)</label>
                  <input
                    type="number"
                    className="seller-deal-form-control"
                    value={formData.discountPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPercentage: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="seller-deal-form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="seller-deal-form-control"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="seller-deal-form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    className="seller-deal-form-control"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" type="submit">
                    Create
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deals.length === 0 ? (
        <div className="no-deals">
          <p>No deals found. Create your first deal to get started!</p>
        </div>
      ) : (
        <div className="deals-grid">
          {deals.map((deal) => (
            <div
              key={deal._id}
              className="deal-card"
              style={{ maxHeight: "500vh", height: "auto" }}
            >
              <div className="deal-header">
                <h3 className="deal-title">{deal.title}</h3>
                <span
                  className="deal-status"
                  style={{ backgroundColor: getStatusColor(deal.status) }}
                >
                  {deal.status}
                </span>
              </div>

              <div className="deal-content">
                <p className="deal-description">{deal.description}</p>

                <div className="deal-details">
                  <div className="detail-item">
                    <FaTag className="detail-icon" />
                    <span>Product: {deal.product?.name}</span>
                  </div>

                  <div className="detail-item">
                    <FaPercentage className="detail-icon" />
                    <span>Discount: {deal.discountPercentage}%</span>
                  </div>

                  <div className="detail-item">
                    <FaCalendarAlt className="detail-icon" />
                    <span>
                      {formatDate(deal.startDate)} - {formatDate(deal.endDate)}
                    </span>
                  </div>

                  <div className="price-info">
                    <span className="original-price">
                      ₹{deal.originalPrice}
                    </span>
                    <span className="deal-price">₹{deal.dealPrice}</span>
                  </div>
                </div>
              </div>

              <div className="deal-actions">
                {deal.status === "pending" && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteDeal(deal._id)}
                  >
                    <FaTrash /> Delete
                  </button>
                )}
                {(deal.status === "approved" || deal.status === "active") && (
                  <button
                    className="btn btn-warning"
                    onClick={() => handleEndDeal(deal._id)}
                  >
                    End Deal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerDeals;
