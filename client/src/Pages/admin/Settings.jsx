import React, { useState, useEffect } from "react";
import {
  FaCog,
  FaEnvelope,
  FaToggleOn,
  FaToggleOff,
  FaSave,
} from "react-icons/fa";
import axios from "../../utils/axios";
import { showErrorToast, showSuccessToast, showInfoToast } from "../../utils/errorHandler";
import { Table, Switch } from "antd";
import "./Settings.css";

const Settings = () => {
  const [settings, setSettings] = useState({
    emailVerificationEnabled: true,
    customerEmailVerification: true,
    sellerEmailVerification: true,
  });
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchSettings();
    fetchSellers();
  }, []);

  const fetchSellers = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/sellers-demo-status?page=${page}&limit=${limit}`
      );
      if (response.data.success) {
        setSellers(response.data.users);
        setPagination({
          current: response.data.page,
          pageSize: response.data.limit,
          total: response.data.totalUsers,
        });
      }
    } catch (error) {
      showErrorToast(error, "Failed to fetch sellers", { operation: "fetchSellers" });
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchSellers(newPagination.current, newPagination.pageSize);
  };
  const handleToggleDemoAccess = async (userId, currentStatus) => {
    try {
      const response = await axios.patch(
        `api/admin/toggle-demo-access/${userId}`
      );
      if (response.data.success) {
        showSuccessToast(response.data.message, "Demo Access Update");
        setSellers((prevSellers) =>
          prevSellers.map((seller) =>
            seller.id === userId
              ? { ...seller, demoAccess: !currentStatus }
              : seller
          )
        );
      }
    } catch (error) {
      showErrorToast(error, "Failed to update demo access", { operation: "toggleDemoAccess", userId });
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Settings response:", response.data);

      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      showErrorToast(error, "Failed to load settings", { operation: "fetchSettings" });
      // Use default settings if API fails
      showInfoToast("Using default settings", "Settings Load");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (settingKey) => {
    setSettings((prev) => {
      // Agar master toggle toggle ho raha hai
      if (settingKey === "emailVerificationEnabled") {
        if (!prev.emailVerificationEnabled) {
          // Turning ON master → dono child true & disabled
          return {
            ...prev,
            emailVerificationEnabled: true,
            customerEmailVerification: true,
            sellerEmailVerification: true,
          };
        } else {
          // Turning OFF master → dono child optional
          return {
            ...prev,
            emailVerificationEnabled: false,
            customerEmailVerification: false,
            sellerEmailVerification: false,
          };
        }
      }

      // Agar role-based toggle ho aur master ON hai → ignore
      if (prev.emailVerificationEnabled) {
        showInfoToast("Master toggle ON → role-based settings locked", "Settings Lock");
        return prev;
      }

      // Agar master OFF hai → allow role toggle
      return {
        ...prev,
        [settingKey]: !prev[settingKey],
      };
    });
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await axios.put("/api/admin/settings", settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        showSuccessToast("Settings saved successfully!", "Settings Update");
        setSettings(response.data.settings); // refresh after save
      }
    } catch (error) {
      showErrorToast(error, "Failed to save settings", { 
        operation: "saveSettings",
        settings: settings,
        timestamp: new Date().toISOString()
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaCog className="spinner" />
        <p>Loading settings...</p>
      </div>
    );
  }

  const columns = [
    {
      title: "Seller Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Shop Name",
      dataIndex: "shopName",
      key: "shopName",
    },
    {
      title: "Demo Access",
      dataIndex: "demoAccess",
      key: "demoAccess",
      align: "center",
      render: (demoAccess, record) => (
        <button
          className={`toggle-btn ${demoAccess ? "active" : ""}`}
          onClick={() => handleToggleDemoAccess(record.id, demoAccess)}
        >
          {demoAccess ? (
            <FaToggleOn className="toggle-icon active" />
          ) : (
            <FaToggleOff className="toggle-icon" />
          )}
          <span>{demoAccess ? "Enabled" : "Disabled"}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="admin-settings">
      <div className="admin-header">
        <h1>Admin Settings</h1>
        <p className="admin-subtitle">Configure system-wide settings</p>
      </div>

      <div className="settings-container">
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Demo Seller Access</h3>
          </div>
          <div className="settings-card-body">
            <Table
              columns={columns}
              dataSource={sellers}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} sellers`,
              }}
              onChange={handleTableChange} // 🔥 key: handle server-side pagination
            />
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-header">
            <FaEnvelope className="settings-icon" />
            <h3>Email Verification Settings</h3>
          </div>

          <div className="settings-card-body">
            {/* Master toggle */}
            <div className="setting-item">
              <div className="setting-info">
                <h4>Master Email Verification</h4>
                <p>Enable or disable email verification system-wide</p>
              </div>
              <div className="setting-control">
                <button
                  className={`toggle-btn ${
                    settings.emailVerificationEnabled ? "active" : ""
                  }`}
                  onClick={() => handleToggle("emailVerificationEnabled")}
                >
                  {settings.emailVerificationEnabled ? (
                    <FaToggleOn className="toggle-icon active" />
                  ) : (
                    <FaToggleOff className="toggle-icon" />
                  )}
                  <span>
                    {settings.emailVerificationEnabled ? "Enabled" : "Disabled"}
                  </span>
                </button>
              </div>
            </div>

            {/* Customer toggle */}
            <div className="setting-item">
              <div className="setting-info">
                <h4>Customer Email Verification</h4>
                <p>Require email verification for customer accounts</p>
              </div>
              <div className="setting-control">
                <button
                  className={`toggle-btn ${
                    settings.customerEmailVerification ? "active" : ""
                  }`}
                  onClick={() => handleToggle("customerEmailVerification")}
                  disabled={settings.emailVerificationEnabled} // 🔥 disable if master ON
                >
                  {settings.customerEmailVerification ? (
                    <FaToggleOn className="toggle-icon active" />
                  ) : (
                    <FaToggleOff className="toggle-icon" />
                  )}
                  <span>
                    {settings.customerEmailVerification
                      ? "Required"
                      : "Optional"}
                  </span>
                </button>
              </div>
            </div>

            {/* Seller toggle */}
            <div className="setting-item">
              <div className="setting-info">
                <h4>Seller Email Verification</h4>
                <p>Require email verification for seller accounts</p>
              </div>
              <div className="setting-control">
                <button
                  className={`toggle-btn ${
                    settings.sellerEmailVerification ? "active" : ""
                  }`}
                  onClick={() => handleToggle("sellerEmailVerification")}
                  disabled={settings.emailVerificationEnabled} // 🔥 disable if master ON
                >
                  {settings.sellerEmailVerification ? (
                    <FaToggleOn className="toggle-icon active" />
                  ) : (
                    <FaToggleOff className="toggle-icon" />
                  )}
                  <span>
                    {settings.sellerEmailVerification ? "Required" : "Optional"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="save-btn" onClick={saveSettings} disabled={saving}>
            <FaSave />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
