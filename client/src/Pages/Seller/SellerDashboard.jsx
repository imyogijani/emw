/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./SellerDashboard.css";
import { requestPushPermission } from "../../utils/pushNotification";
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
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import SellerNotification from "../../Components/SellerNotification";
import { 
  getSystemSettings, 
  isOnboardingEnabled, 
  getRequiredOnboardingSteps,
  STEP_MAPPING 
} from "../../utils/systemSettings";
import { showInfoToast } from "../../utils/errorHandler";

import axios from "../../utils/axios";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboardingAlert, setShowOnboardingAlert] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const [skippedSteps, setSkippedSteps] = useState([]);
  const [showSkippedStepsReminder, setShowSkippedStepsReminder] = useState(false);

  // Check onboarding status and system settings on component mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;

        const user = JSON.parse(userStr);
        
        // Fetch system settings
        const settings = await getSystemSettings();
        setSystemSettings(settings);

        // Check if onboarding is enabled globally
        if (!isOnboardingEnabled(settings)) {
          // Onboarding is disabled, allow full access
          setShowOnboardingAlert(false);
          setIsReadOnly(false);
          return;
        }

        // If user doesn't have demo access and onboarding is not complete
        if (!user.demoAccess && !user.isOnboardingComplete) {
          setShowOnboardingAlert(true);
          setIsReadOnly(true);
          return;
        }

        // Check for skipped steps if onboarding is complete
        if (user.isOnboardingComplete) {
          const skippedStepsData = localStorage.getItem('skippedOnboardingSteps');
          if (skippedStepsData) {
            const skipped = JSON.parse(skippedStepsData);
            const requiredSteps = getRequiredOnboardingSteps(settings);
            
            // Filter skipped steps to only show required ones
            const skippedRequiredSteps = skipped.filter(stepKey => 
              requiredSteps.includes(stepKey)
            );
            
            if (skippedRequiredSteps.length > 0) {
              setSkippedSteps(skippedRequiredSteps);
              setShowSkippedStepsReminder(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, []);

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
  const handleCompleteOnboarding = () => {
    navigate("/seller/onboarding");
  };

  const handleCompleteSkippedSteps = () => {
    navigate("/seller/onboarding");
  };

  const handleDismissSkippedStepsReminder = () => {
    setShowSkippedStepsReminder(false);
    showInfoToast("Reminder dismissed. You can complete these steps anytime from Settings.");
  };

  const getStepDisplayName = (stepKey) => {
    const stepNames = {
      'basicDetails': 'Basic Details',
      'shopTiming': 'Shop Timing',
      'legalDocuments': 'Legal Documents',
      'subscription': 'Subscription Plan'
    };
    return stepNames[stepKey] || stepKey;
  };

  return (
    <div className="seller-dashboard">
      <SellerNotification />
      
      {/* Onboarding Alert */}
      {showOnboardingAlert && (
        <div className="onboarding-alert">
          <div className="alert-content">
            <FaExclamationTriangle className="alert-icon" />
            <div className="alert-text">
              <h3>Complete Your Onboarding</h3>
              <p>Please complete your seller onboarding process to access all dashboard features.</p>
            </div>
            <button 
              className="btn btn-medium btn-primary complete-onboarding-btn"
              onClick={handleCompleteOnboarding}
            >
              <span className="text">Complete Onboarding</span>
            </button>
          </div>
        </div>
      )}

      {/* Skipped Steps Reminder */}
      {showSkippedStepsReminder && (
        <div className="onboarding-alert skipped-steps-alert">
          <div className="alert-content">
            <FaInfoCircle className="alert-icon info-icon" />
            <div className="alert-text">
              <h3>Complete Skipped Steps</h3>
              <p>
                You skipped some important onboarding steps: {' '}
                <strong>{skippedSteps.map(getStepDisplayName).join(', ')}</strong>.
                Complete them to unlock full functionality.
              </p>
            </div>
            <div className="alert-actions">
              <button 
                className="btn btn-medium btn-primary complete-onboarding-btn"
                onClick={handleCompleteSkippedSteps}
              >
                <span className="text">Complete Steps</span>
              </button>
              <button 
                className="btn btn-medium btn-outline dismiss-btn"
                onClick={handleDismissSkippedStepsReminder}
              >
                <span className="text">Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="admin-header">
        <h1>Seller Dashboard</h1>
        <p className="admin-subtitle">
          Monitor your store's performance and orders
          {isReadOnly && <span className="read-only-badge"> (Read-Only Mode)</span>}
        </p>
      </div>

      <div className="cards-grid cards-grid-medium">
        <div className="card-base card-medium seller-card">
          <div className="card-content">
            <div className="card-icon">
              <FaDollarSign size={24} />
            </div>
            <div className="card-info">
              <h3 className="card-title">Today's Sales</h3>
              <p className="card-value">
                ₹{dashboardStats.todaySales}
              </p>
              <p className="card-description">
                <FaArrowUp /> <span className="card-badge success">+{dashboardStats.salesGrowth}%</span> from yesterday
              </p>
            </div>
          </div>
        </div>

        <div className="card-base card-medium seller-card">
          <div className="card-content">
            <div className="card-icon">
              <FaShoppingBag size={24} />
            </div>
            <div className="card-info">
              <h3 className="card-title">Total Products</h3>
              <p className="card-value">
                {dashboardStats.totalProducts}
              </p>
              <p className="card-description">
                <FaArrowUp /> <span className="card-badge success">+{dashboardStats.newProductsThisWeek}</span> new this week
              </p>
            </div>
          </div>
        </div>

        <div className="card-base card-medium seller-card">
          <div className="card-content">
            <div className="card-icon">
              <FaChartLine size={24} />
            </div>
            <div className="card-info">
              <h3 className="card-title">Pending Orders</h3>
              <p className="card-value">
                {dashboardStats.totalPendingOrders}
              </p>
              <p className="card-description">
                <FaArrowUp /> <span className="card-badge success">+{dashboardStats.pendingOrdersDiffYesterday}</span> from yesterday
              </p>
            </div>
          </div>
        </div>

        <div className="card-base card-medium seller-card">
          <div className="card-content">
            <div className="card-icon">
              ⭐
            </div>
            <div className="card-info">
              <h3 className="card-title">Customer Rating</h3>
              <p className="card-value">
                {dashboardStats.averageRating}
              </p>
              <p className="card-description">
                <FaArrowUp /> <span className="card-badge success">+{dashboardStats.reviewsThisMonth}</span> this month
              </p>
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
