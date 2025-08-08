/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./SellerDashboard.css";
import { requestPushPermission } from "../../utils/pushNotification";
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
import SellerNotification from "../../Components/SellerNotification";

import axios from "../../utils/axios";

const SellerDashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [salesRes, ordersRes] = await Promise.all([
          axios.get("/api/sellers/sale-data"),
          // axios.get("/api/sellers/dashboard-stats"),
          axios.get("/api/sellers/recent-orders"),
        ]);

        setSalesData(salesRes.data); // Set sales data
        // setDashboardStats(statsRes.data); // Set dashboard stats
        setRecentOrders(ordersRes.data.orders); // Orders is inside { orders: [...] }

        // console.log("Seller DashBoard page", statsRes.data);
        // console.log("Seller DashBoard page", JSON.stringify(salesRes.data));
        // console.log("Seller DashBoard page", ordersRes.data);

        console.log("All dashboard data loaded");
      } catch (error) {
        console.error(
          "Dashboard Load Error:",
          error?.response?.data || error.message
        );
      }
    };

    fetchAllData();
  }, []);
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get("/api/analytics/seller", {
          withCredentials: true, // only if using cookies/session
        });
        setDashboardStats(response.data);
        console.log("Dashboard Stats:", response.data);
      } catch (err) {
        console.error("Error fetching seller dashboard stats:", err);
        setError(err.message || "Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const userId = JSON.parse(localStorage.getItem("user"));
  // console.log("User Login after userId for requestPushPermission", userId?._id);

  useEffect(() => {
    if (userId?._id) {
      requestPushPermission(userId._id);
    }
  }, [userId]);
  return (
    <div className="seller-dashboard">
      <SellerNotification />
      <div className="seller-header">
        <h1>Seller Dashboard</h1>
        <p className="seller-subtitle">
          Monitor your store's performance and orders
        </p>
      </div>

      <div className="seller-grid">
        <div className="responsive-card seller-card">
          <div className="card-content">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  color: "#28a745",
                  marginRight: "12px",
                }}
              >
                <FaDollarSign />
              </div>
              <div>
                <h3 className="card-title">Today's Sales</h3>
                <p
                  className="card-subtitle"
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#232f3e",
                  }}
                >
                  ₹{dashboardStats.todaySales}
                </p>
                <p
                  className="card-description"
                  style={{
                    color: "#28a745",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FaArrowUp /> +{dashboardStats.salesGrowth}% from yesterday
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-card seller-card">
          <div className="card-content">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  color: "#28a745",
                  marginRight: "12px",
                }}
              >
                <FaShoppingBag />
              </div>
              <div>
                <h3 className="card-title">Total Products</h3>
                <p
                  className="card-subtitle"
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#232f3e",
                  }}
                >
                  {dashboardStats.totalProducts}
                </p>
                <p
                  className="card-description"
                  style={{
                    color: "#28a745",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FaArrowUp /> +{dashboardStats.newProductsThisWeek} new this
                  week
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-card seller-card">
          <div className="card-content">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  color: "#28a745",
                  marginRight: "12px",
                }}
              >
                <FaChartLine />
              </div>
              <div>
                <h3 className="card-title">Pending Orders</h3>
                <p
                  className="card-subtitle"
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#232f3e",
                  }}
                >
                  {dashboardStats.totalPendingOrders}
                </p>
                <p
                  className="card-description"
                  style={{
                    color: "#28a745",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FaArrowUp /> +{dashboardStats.pendingOrdersDiffYesterday}{" "}
                  from yesterday
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-card seller-card">
          <div className="card-content">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  color: "#28a745",
                  marginRight: "12px",
                }}
              >
                ⭐
              </div>
              <div>
                <h3 className="card-title">Customer Rating</h3>
                <p
                  className="card-subtitle"
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#232f3e",
                  }}
                >
                  {dashboardStats.averageRating}
                </p>
                <p
                  className="card-description"
                  style={{
                    color: "#28a745",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FaArrowUp /> +{dashboardStats.reviewsThisMonth} this month
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h2 className="sales-overview-title">Sales & Orders Overview</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={salesData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" stroke="var(--text-color-dark)" />
            <YAxis stroke="var(--text-color-dark)" />
            <Tooltip
              contentStyle={{
                background: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#82ca9d"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="recent-orders">
        <h2>Recent Orders</h2>
        <div className="orders-table">
          {/* You can add a table or list of recent orders here */}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
