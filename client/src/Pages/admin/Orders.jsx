/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, filterStatus]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchTerm || undefined, // search by name/email/phone/orderId/_id
          orderStatus: filterStatus !== "all" ? filterStatus : undefined, //  filter by status
        },
      });
      setOrders(response.data.orders);
      setStats(response.data.stats);
      console.log("Fetched Orders:", response.data.orders);
    } catch (error) {
      toast.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/admin/orders/${orderId}/status`,
        { orderStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order status updated successfully");
      fetchOrders();
    } catch (error) {
      toast.error("Error updating order status");
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Use orderId if present, else fallback to ORD + last 6 of _id
    const orderId =
      order.customeOrderId ||
      (order._id ? `ORD${order._id.toString().slice(-6).toUpperCase()}` : "");
    // For customer name, prefer user.name, then user.names, then user.email (but not just email alone)
    let customerName =
      order.customer?.name || order.user?.name || order.user?.names || "";
    if (!customerName && order.user && order.user.email) {
      // Only use email if no name fields exist, and mask it for privacy
      const email = order.user.email;
      customerName = email.replace(/(.{2}).+(@.+)/, "$1***$2");
    }
    if (!customerName) customerName = "Unknown";
    const matchesSearch =
      orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (order.status &&
        order.status.toLowerCase() === filterStatus.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    };
  };

  // const stats = getOrderStats();

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="admin-header">
        <h1>Orders Management</h1>
        <p className="admin-subtitle">Manage and track all orders</p>
      </div>

      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-details">
            <h3>Total Orders</h3>
            <p>{stats?.totalOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaTruck />
          </div>
          <div className="stat-details">
            <h3>Pending Orders</h3>
            <p>{stats?.pending}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-details">
            <h3>Processing</h3>
            <p>{stats?.processing}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-details">
            <h3>Delivered</h3>
            <p>{stats?.delivered}</p>
          </div>
        </div>
      </div>

      <div className="orders-controls">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
          style={{ width: "8vw", height: "7vh", marginTop: "10px" }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-orders">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const orderId =
                  order?.customeOrderId ||
                  (order._id
                    ? `ORD${order._id.toString().slice(-6).toUpperCase()}`
                    : "");
                let customerName = order.customer?.name || "Guest";
                if (!customerName && order.user && order.user.email) {
                  const email = order.user.email;
                  customerName = email.replace(/(.{2}).+(@.+)/, "$1***$2");
                }
                if (!customerName) customerName = "Unknown";
                return (
                  <tr key={order._id}>
                    <td>#{orderId}</td>
                    <td>{customerName}</td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>₹{order.totalAmount || order.total}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          order.orderStatus
                            ? order.orderStatus.toLowerCase()
                            : ""
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view"
                          onClick={() =>
                            handleStatusUpdate(order.orderId, "processing")
                          }
                          title="Process Order"
                        >
                          <FaTruck />
                        </button>
                        <button
                          className="action-btn complete"
                          onClick={() =>
                            handleStatusUpdate(order.orderId, "delivered")
                          }
                          title="Mark as Delivered"
                        >
                          <FaCheckCircle />
                        </button>
                        <button
                          className="action-btn cancel"
                          onClick={() =>
                            handleStatusUpdate(order.orderId, "cancelled")
                          }
                          title="Cancel Order"
                        >
                          <FaTimesCircle />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
