import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FaUsers,
  FaStore,
  FaShoppingBag,
  FaMoneyBillWave,
} from "react-icons/fa";
import axios from "../../utils/axios";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    recentOrders: [],
    userStats: [],
    shopStats: [],
  });

  const [trends, setTrends] = useState({
    success: false,
    period: "daily",
    lastDays: 7,
    usersTrend: [],
    sellersTrend: [],
    revenueTrend: [],
  });
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("2025-08-01");
  const [endDate, setEndDate] = useState("2025-08-20");
  const [status, setStatus] = useState(""); // optional filter

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/analytics/admin", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("dashboard‑stats →", response.data);
        setStats(response.data.stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);
  // useEffect(() => {
  //   const fetchAdminAnalytics = async () => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       const response = await axios.get("/api/analytics/admin", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       // setUserStats(response.data);
  //       console.log("User Stats →", response.data.stats);
  //     } catch (error) {
  //       console.error("Error fetching user stats:", error);
  //     }
  //   };

  //   fetchAdminAnalytics();
  // }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/analytics/admin/trends", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrends(response.data);
        console.log("Trends →", response.data); //  add this
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchTrends();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await axios.get("/api/admin/recent-orders", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate,
            endDate,
            status,
            page,
            limit,
          },
        });

        console.log("recent-orders →", response.data);

        setOrders(response.data.orders || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, limit, startDate, endDate, status]);

  const pieData = [
    { name: "Active Users", value: stats.totalUsers },
    { name: "Active Sellers", value: stats.totalSellers },
    { name: "Products", value: stats.totalProducts },
    { name: "Orders", value: stats.totalOrders },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">Overall System Statistics</p>
      </div>

      <div className="admin-grid">
        <div className="responsive-card admin-card">
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
                  color: "#ff9900",
                  marginRight: "12px",
                }}
              >
                <FaUsers />
              </div>
              <div>
                <h3 className="card-title">Total Users</h3>
                <p
                  className="card-subtitle"
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#232f3e",
                  }}
                >
                  {stats.users?.total || 0}
                </p>
                <p
                  className="card-description"
                  style={{ color: "#28a745", fontSize: "11px" }}
                >
                  +{stats.users?.growthPercent || 0}% this week
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-card admin-card">
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
                  color: "#ff9900",
                  marginRight: "12px",
                }}
              >
                <FaStore />
              </div>
              <div>
                <h3 className="card-title">Active Sellers</h3>
                <p
                  className="card-subtitle"
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#232f3e",
                  }}
                >
                  {stats.sellers?.total || 0}
                </p>
                <p
                  className="card-description"
                  style={{ color: "#28a745", fontSize: "11px" }}
                >
                  +{stats.sellers?.growthPercent || 0}% this week
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-card admin-card">
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
                  color: "#ff9900",
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
                  {stats?.products || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-card admin-card">
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
                  color: "#ff9900",
                  marginRight: "12px",
                }}
              >
                <FaMoneyBillWave />
              </div>
              <div>
                <h3 className="card-title">Total Revenue</h3>
                <p
                  className="card-subtitle"
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#232f3e",
                  }}
                >
                  ₹{stats?.revenue.fromOrders || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="responsive-card admin-card">
          <div className="card-content">
            <h3 className="card-title">Revenue Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="responsive-card admin-card">
          <div className="card-content">
            <h3 className="card-title">User Registration Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.userStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#82ca9d" />
                <Bar dataKey="sellers" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="responsive-card admin-card">
          <div className="card-content">
            <h3 className="card-title">System Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Orders</h3>
        <div className="activity-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Shop</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order) => (
                <tr key={order.orderId}>
                  <td>#{order.orderId}</td>
                  <td>{order.customer}</td>
                  <td>{order.shops.map((name) => name).join(", ")}</td>
                  <td>₹{order.amount}</td>
                  <td>
                    <span className={`status ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
