/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./SellerDashboard.css";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FaArrowUp,
  FaChartLine,
  FaShoppingBag,
  FaDollarSign,
} from "react-icons/fa";
import axios from "../../utils/axios";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Example: Fetch dashboard stats and sales data here
        // const statsRes = await axios.get("/api/seller/dashboard-stats");
        // setDashboardStats(statsRes.data);
        // const salesRes = await axios.get("/api/seller/sales-data");
        // setSalesData(salesRes.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Loading state
  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // Error state
  if (error) {
    return (
      <div className="error">Error loading dashboard: {error.message}</div>
    );
  }

  return (
    <div className="seller-dashboard">
      <div className="admin-header">
        <h1>Seller Dashboard</h1>
        <p className="admin-subtitle">
          Monitor your store's performance and orders
        </p>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <p className="stat-value">${dashboardStats.totalRevenue || 0}</p>
            <span className="stat-change">
              <FaArrowUp /> {dashboardStats.revenueChange || 0}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaShoppingBag />
          </div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p className="stat-value">{dashboardStats.totalOrders || 0}</p>
            <span className="stat-change">
              <FaArrowUp /> {dashboardStats.ordersChange || 0}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>Conversion Rate</h3>
            <p className="stat-value">{dashboardStats.conversionRate || 0}%</p>
            <span className="stat-change">
              <FaArrowUp /> {dashboardStats.conversionChange || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="chart-container">
        <h2>Sales Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#8884d8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <h2>Recent Orders</h2>
        <div className="orders-table">
          {recentOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>${order.amount}</td>
                    <td>{order.status}</td>
                    <td>{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No recent orders found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
