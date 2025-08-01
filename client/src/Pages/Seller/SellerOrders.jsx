import React, { useState, useEffect, useRef } from "react";
import { FaEye, FaEdit, FaChevronDown } from "react-icons/fa";
import "../../App.css";
import "./SellerOrders.css";

const SellerOrders = () => {
  const [filters, setFilters] = useState({
    date: "",
    city: "",
    status: "",
  });

  const [activeOrders, setActiveOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const orderStatuses = ["Preparing", "Out for Delivery", "Delivered"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    let filtered = [...activeOrders, ...deliveredOrders];

    if (filters.date) {
      filtered = filtered.filter((order) => order.date === filters.date);
    }
    if (filters.city) {
      filtered = filtered.filter((order) =>
        order.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    if (filters.status) {
      filtered = filtered.filter(
        (order) => order.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Separate filtered orders based on status
    const active = filtered.filter((order) => order.status !== "Delivered");
    const delivered = filtered.filter((order) => order.status === "Delivered");

    setActiveOrders(active);
    setDeliveredOrders(delivered);
  };

  const resetFilters = () => {
    setFilters({
      date: "",
      city: "",
      status: "",
    });
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const toggleDropdown = (orderId, event) => {
    if (dropdownOpen === orderId) {
      setDropdownOpen(null);
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const dropdownTop = rect.bottom + 5;
      const dropdownLeft = rect.right - 150;

      setDropdownPosition({ top: dropdownTop, left: dropdownLeft });
      setDropdownOpen(orderId);
    }
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    const orderToUpdate = activeOrders.find((order) => order.id === orderId);

    if (orderToUpdate) {
      const updatedOrder = { ...orderToUpdate, status: newStatus };

      if (newStatus === "Delivered") {
        // Remove from active orders and add to delivered orders
        setActiveOrders((prev) => prev.filter((order) => order.id !== orderId));
        setDeliveredOrders((prev) => [...prev, updatedOrder]);
      } else {
        // Update status in active orders
        setActiveOrders((prev) =>
          prev.map((order) => (order.id === orderId ? updatedOrder : order))
        );
      }
    }

    setDropdownOpen(null);
  };

  const renderOrdersTable = (orders, tableTitle) => (
    <div className="orders-table-container">
      <h2>{tableTitle}</h2>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>City</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.city}</td>
              <td>{order.date}</td>
              <td>{order.items}</td>
              <td>₹{order.total.toFixed(2)}</td>
              <td>
                <span
                  className={`status-badge ${order.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {order.status}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="action-btn view"
                    onClick={() => handleViewOrder(order)}
                    title="View Order Details"
                  >
                    <FaEye />
                  </button>
                  {order.status !== "Delivered" && (
                    <div className="dropdown-container" ref={dropdownRef}>
                      <button
                        className="action-btn update"
                        onClick={(event) => toggleDropdown(order.id, event)}
                        title="Update Order Status"
                      >
                        <FaEdit />
                        <FaChevronDown className="dropdown-arrow" />
                      </button>
                      {dropdownOpen === order.id && (
                        <div
                          className="status-dropdown"
                          style={dropdownPosition}
                        >
                          {orderStatuses.map((status) => (
                            <button
                              key={status}
                              className={`dropdown-item ${
                                order.status === status ? "active" : ""
                              }`}
                              onClick={() =>
                                handleStatusUpdate(order.id, status)
                              }
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="admin-orders">
      <div className="admin-header">
        <div>
          <h1>Orders</h1>
          <p className="admin-subtitle">Manage your food orders</p>
        </div>
      </div>
      <div className="orders-container">
        <div className="filters-section">
          <div className="filter-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              placeholder="Select date"
            />
          </div>

          <div className="filter-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Filter by city"
            />
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="Preparing">Preparing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="apply-btn" onClick={applyFilters}>
              Apply Filters
            </button>
            <button className="reset-btn" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>

        {renderOrdersTable(activeOrders, "Active Orders")}
        {renderOrdersTable(deliveredOrders, "Delivered Orders")}
      </div>

      {showModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.id}</h2>
              <button className="close-btn" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="order-info">
                <p>
                  <strong>Customer:</strong> {selectedOrder.customer}
                </p>
                <p>
                  <strong>Date:</strong> {selectedOrder.date}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>
              </div>
              <div className="order-items">
                <h3>Ordered Items</h3>
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
                    {selectedOrder.orderDetails.map((item, index) => (
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
                        Total Amount:
                      </td>
                      <td className="total-amount">
                        ₹{selectedOrder.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
