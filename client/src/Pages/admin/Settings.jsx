import React, { useState, useEffect } from "react";
import { FaCog, FaEnvelope, FaToggleOn, FaToggleOff, FaSave } from "react-icons/fa";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./Settings.css";

const Settings = () => {
  const [settings, setSettings] = useState({
    emailVerificationEnabled: true,
    customerEmailVerification: true,
    sellerEmailVerification: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Use default settings if API fails
      toast.info("Using default settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (settingKey) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await axios.post("/api/admin/settings", settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        toast.success("Settings saved successfully!");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
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

  return (
    <div className="admin-settings">
      <div className="admin-header">
        <h1>Admin Settings</h1>
        <p className="admin-subtitle">Configure system-wide settings</p>
      </div>

      <div className="settings-container">
        <div className="settings-card">
          <div className="settings-card-header">
            <FaEnvelope className="settings-icon" />
            <h3>Email Verification Settings</h3>
          </div>
          
          <div className="settings-card-body">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Master Email Verification</h4>
                <p>Enable or disable email verification system-wide</p>
              </div>
              <div className="setting-control">
                <button
                  className={`toggle-btn ${settings.emailVerificationEnabled ? 'active' : ''}`}
                  onClick={() => handleToggle('emailVerificationEnabled')}
                >
                  {settings.emailVerificationEnabled ? (
                    <FaToggleOn className="toggle-icon active" />
                  ) : (
                    <FaToggleOff className="toggle-icon" />
                  )}
                  <span>{settings.emailVerificationEnabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Customer Email Verification</h4>
                <p>Require email verification for customer accounts</p>
              </div>
              <div className="setting-control">
                <button
                  className={`toggle-btn ${settings.customerEmailVerification ? 'active' : ''}`}
                  onClick={() => handleToggle('customerEmailVerification')}
                  disabled={!settings.emailVerificationEnabled}
                >
                  {settings.customerEmailVerification ? (
                    <FaToggleOn className="toggle-icon active" />
                  ) : (
                    <FaToggleOff className="toggle-icon" />
                  )}
                  <span>{settings.customerEmailVerification ? 'Required' : 'Optional'}</span>
                </button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Seller Email Verification</h4>
                <p>Require email verification for seller accounts</p>
              </div>
              <div className="setting-control">
                <button
                  className={`toggle-btn ${settings.sellerEmailVerification ? 'active' : ''}`}
                  onClick={() => handleToggle('sellerEmailVerification')}
                  disabled={!settings.emailVerificationEnabled}
                >
                  {settings.sellerEmailVerification ? (
                    <FaToggleOn className="toggle-icon active" />
                  ) : (
                    <FaToggleOff className="toggle-icon" />
                  )}
                  <span>{settings.sellerEmailVerification ? 'Required' : 'Optional'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button 
            className="save-btn"
            onClick={saveSettings}
            disabled={saving}
          >
            <FaSave />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;