import React, { useState } from "react";
import { FaEye, FaListAlt } from "react-icons/fa";
import "../../App.css";
import "./SellerCustomers.css";

const SellerCustomers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Controlled filter states
  const [searchText, setSearchText] = useState("");
  const [citySearch, setCitySearch] = useState("");
  // Applied filter states
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [appliedCitySearch, setAppliedCitySearch] = useState("");

  const handleApplyFilters = () => {
    setAppliedSearchText(searchText);
    setAppliedCitySearch(citySearch);
  };

  const handleResetFilters = () => {
    setSearchText("");
    setCitySearch("");
    setAppliedSearchText("");
    setAppliedCitySearch("");
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleViewOrders = (customer) => {
    setSelectedCustomer(customer);
    setShowOrdersModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedCustomer(null);
  };

  const closeOrdersModal = () => {
    setShowOrdersModal(false);
    setSelectedCustomer(null);
  };

  // Filter customers by id or name and city
  const filteredCustomers = [].filter((customer) => {
    const matchesText =
      customer.id.toLowerCase().includes(appliedSearchText.toLowerCase()) ||
      customer.name.toLowerCase().includes(appliedSearchText.toLowerCase());
    const matchesCity = customer.city
      .toLowerCase()
      .includes(appliedCitySearch.toLowerCase());
    return matchesText && matchesCity;
  });

  return (
    <div className="admin-users">
      <div className="admin-header">
        <div>
          <h1>Customers</h1>
          <p className="admin-subtitle">View and manage your customers</p>
        </div>
      </div>
      <div className="customers-container">
        {/* Search Bars with Apply/Reset */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Customer ID or Name</label>
            <input
              type="text"
              placeholder="Search by Customer ID or Name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>City</label>
            <input
              type="text"
              placeholder="Search by City"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
          </div>
          <div className="filter-actions">
            <button className="apply-btn" onClick={handleApplyFilters}>
              Apply
            </button>
            <button className="reset-btn" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </div>
        <div className="customers-grid">
          {filteredCustomers.length === 0 ? (
            <p className="no-customers-found">No customers found.</p>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="customer-card">
                <div className="customer-card-header">
                  <h3>{customer.name}</h3>
                  <span className="customer-id">ID: {customer.id}</span>
                </div>
                <div className="customer-card-body">
                  <p><strong>Email:</strong> {customer.email}</p>
                  <p><strong>Phone:</strong> {customer.phone}</p>
                  <p><strong>City:</strong> {customer.city}</p>
                  <p><strong>Total Orders:</strong> {customer.orders.length}</p>
                  <p><strong>Total Spent:</strong> ₹{customer.totalSpent.toFixed(2)}</p>
                  <p><strong>Last Order:</strong> {customer.lastOrder}</p>
                </div>
                <div className="customer-card-actions">
                  <button
                    className="action-btn view"
                    onClick={() => handleViewCustomer(customer)}
                    title="View Customer Details"
                  >
                    <FaEye /> View Details
                  </button>
                  <button
                    className="action-btn orders"
                    onClick={() => handleViewOrders(customer)}
                    title="View Order History"
                  >
                    <FaListAlt /> View Orders
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showViewModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Customer Details - {selectedCustomer.name}</h2>
              <button className="close-btn" onClick={closeViewModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="customer-info">
                <p>
                  <strong>Customer ID:</strong> {selectedCustomer.id}
                </p>
                <p>
                  <strong>Name:</strong> {selectedCustomer.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedCustomer.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedCustomer.phone}
                </p>
                <p>
                  <strong>City:</strong> {selectedCustomer.city}
                </p>
                <p>
                  <strong>Total Orders:</strong>{" "}
                  {selectedCustomer.orders.length}
                </p>
                <p>
                  <strong>Total Spent:</strong> ₹
                  {selectedCustomer.totalSpent.toFixed(2)}
                </p>
                <p>
                  <strong>Last Order:</strong> {selectedCustomer.lastOrder}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrdersModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order History - {selectedCustomer.name}</h2>
              <button className="close-btn" onClick={closeOrdersModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="customer-info">
                <p>
                  <strong>Customer ID:</strong> {selectedCustomer.id}
                </p>
                <p>
                  <strong>Email:</strong> {selectedCustomer.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedCustomer.phone}
                </p>
                <p>
                  <strong>Total Orders:</strong>{" "}
                  {selectedCustomer.orders.length}
                </p>
                <p>
                  <strong>Total Spent:</strong> ₹
                  {selectedCustomer.totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="order-history">
                <h3>Order History</h3>
                {selectedCustomer.orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <h4>Order #{order.id}</h4>
                      <span
                        className={`status-badge ${order.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="order-details">
                      <p>
                        <strong>Date:</strong> {order.date}
                      </p>
                      <p>
                        <strong>Items:</strong> {order.items}
                      </p>
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Rate</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.orderDetails.map((item, index) => (
                            <tr key={index}>
                              <td>{item.name}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.rate.toFixed(2)}</td>
                              <td>₹{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="total-label">
                              Order Total:
                            </td>
                            <td className="total-amount">
                              ₹{order.total.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCustomers;
