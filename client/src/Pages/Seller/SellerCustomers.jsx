import React, { useState, useEffect } from "react";
import { FaEye, FaListAlt } from "react-icons/fa";
import "../../App.css";
import "./SellerCustomers.css";
import axios from "../../utils/axios";

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
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const seller = JSON.parse(localStorage.getItem("user"));

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

  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);

    try {
      const response = await axios.get(
        `/api/users/customer/${customer.customerId}`
      );

      if (response.data.success) {
        const userData = response.data.customer;

        setSelectedCustomer({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          totalOrders: userData.totalOrders,
          totalSpent: userData.totalSpent,
          lastOrder: userData.lastOrder,
          city: customer.city, // Optional: from list
          orders: [], // placeholder if needed
        });

        setShowViewModal(true);
      } else {
        alert("Customer not found.");
      }
    } catch (error) {
      console.error("Failed to fetch customer details", error);
      alert("Something went wrong while fetching customer data.");
    }
  };

  // const handleViewOrders = (customer) => {
  //   setSelectedCustomer(customer);
  //   setShowOrdersModal(true);
  // };

  // console.log("sellerId", seller.sellerId._id);

  const handleViewOrders = async (customer) => {
    setSelectedCustomer(customer); // for modal header or name etc.
    setShowOrdersModal(true); // to show modal

    try {
      const response = await axios.get("/api/sellers/customer-orders", {
        params: {
          customerId: customer.customerId,
          sellerId: seller.sellerId._id,
        },
      });

      const { data, overallTotalAmount, total } = response.data;

      setSelectedCustomer((prevCustomer) => ({
        ...prevCustomer,
        orders: data,
        totalSpent: overallTotalAmount,
        totalOrders: total,
      }));
    } catch (err) {
      console.error("Failed to fetch order history", err);
    }
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
  // const filteredCustomers = [].filter((customer) => {
  //   const matchesText =
  //     customer.id.toLowerCase().includes(appliedSearchText.toLowerCase()) ||
  //     customer.name.toLowerCase().includes(appliedSearchText.toLowerCase());
  //   const matchesCity = customer.city
  //     .toLowerCase()
  //     .includes(appliedCitySearch.toLowerCase());
  //   return matchesText && matchesCity;
  // });

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 10,
        };

        if (appliedSearchText) params.search = appliedSearchText;
        if (appliedCitySearch) params.city = appliedCitySearch;

        const response = await axios.get("/api/sellers/seller-customer", {
          params,
        });

        setCustomers(response.data.data);
        setTotalPages(Math.ceil(response.data.total / 10)); // If backend gives total
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [page, appliedSearchText, appliedCitySearch]);

  // console.log("selectedCustomer data:", selectedCustomer);
  const filteredCustomers = customers;

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
              <div key={customer.customerId} className="customer-card">
                <div className="customer-card-header">
                  <h3>{customer.customerName}</h3>
                  <span className="customer-id">ID: {customer.customerId}</span>
                </div>
                <div className="customer-card-body">
                  <p>
                    <strong>Email:</strong> {customer.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {customer.phone}
                  </p>
                  <p>
                    <strong>City:</strong> {customer.city}
                  </p>
                  <p>
                    <strong>Total Orders:</strong> {customer.orderCount}
                  </p>
                  <p>
                    <strong>Total Spent:</strong> ₹
                    {customer.totalSpent.toFixed(2)}
                  </p>
                  <p>
                    <strong>Last Order:</strong> {customer.latestOrderDate}
                  </p>
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
                  <strong>Address:</strong> {selectedCustomer.address}
                </p>
                <p>
                  <strong>Total Orders:</strong> {selectedCustomer.totalOrders}
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
                  <strong>Customer ID:</strong> {selectedCustomer.customerId}
                </p>
                <p>
                  <strong>Email:</strong> {selectedCustomer.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedCustomer.phone}
                </p>
                <p>
                  <strong>Total Orders:</strong> {selectedCustomer.totalOrders}
                </p>
                <p>
                  <strong>Total Spent:</strong> ₹
                  {selectedCustomer.totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="order-history">
                <h3>Order History</h3>
                {Array.isArray(selectedCustomer.orders) &&
                selectedCustomer.orders.length > 0 ? (
                  selectedCustomer.orders.map((order) => (
                    <div key={order.orderId} className="order-card">
                      <div className="order-header">
                        <h4>Order #{order.orderId}</h4>
                      </div>
                      <div className="order-details">
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>Product ID</th>
                              <th>Quantity</th>
                              <th>Rate</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.products.map((product, index) => (
                              <tr key={index}>
                                <td>{product.productId}</td>
                                <td>{product.quantity}</td>
                                <td>₹{product.finalPrice.toFixed(2)}</td>
                                <td>₹{product.totalPrice.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" className="total-label">
                                Order Total:
                              </td>
                              <td className="total-amount">
                                ₹{order.totalAmount.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No orders found for this customer.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCustomers;
