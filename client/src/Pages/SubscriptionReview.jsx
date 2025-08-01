import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const SubscriptionReview = () => {
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [oldPlan, setOldPlan] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notificationId, setNotificationId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const planName = searchParams.get("plan");
    const notifId = searchParams.get("notif");
    if (notifId) setNotificationId(notifId);
    if (!planName) {
      setError("No plan specified.");
      setLoading(false);
      return;
    }
    // Fetch plan details from backend
    axios
      .get(`/api/subscription/plan-by-name/${encodeURIComponent(planName)}`)
      .then((res) => {
        setPlan(res.data.plan);
        setFeatures(res.data.plan.includedFeatures || []);
        setOldPlan(res.data.oldPlan || null);
      })
      .catch(() => setError("Could not fetch plan details."))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const dismissNotification = async () => {
    if (!notificationId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.dispatchEvent(new Event("notification-updated")); // Notify NotificationBell
    } catch {}
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "/api/auth/accept-plan-update",
        { planName: plan.planName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await dismissNotification();
      alert("Plan updated successfully!");
      navigate("/seller/profile");
    } catch (err) {
      alert("Failed to update plan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    await dismissNotification();
    alert("Plan update cancelled. Your current plan remains active.");
    navigate("/seller/profile");
  };

  if (loading) return <div>Loading plan details...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!plan) return <div>No plan found.</div>;

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        padding: 24,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #eee",
      }}
    >
      <h2>Subscription Plan Review</h2>
      <div style={{ marginBottom: 16 }}>
        <b>New Plan:</b> {plan.planName}
      </div>
      {oldPlan && (
        <div style={{ marginBottom: 16 }}>
          <b>Previous Plan:</b> {oldPlan}
        </div>
      )}
      <div>
        <b>Features:</b>
        <ul>
          {features.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
        <button
          onClick={handleAccept}
          disabled={actionLoading}
          style={{
            padding: "10px 24px",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
          }}
        >
          {actionLoading ? "Updating..." : "Accept & Update Plan"}
        </button>
        <button
          onClick={handleCancel}
          disabled={actionLoading}
          style={{
            padding: "10px 24px",
            background: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default SubscriptionReview;
