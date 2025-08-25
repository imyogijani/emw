import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import { showErrorToast } from "../utils/errorHandler";

const SellerNotification = () => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/current-user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // If notification is a string, do not show. If it's an object (new notification system), show.
        if (response.data.user && typeof response.data.user.notification === 'object' && response.data.user.notification !== null) {
          setNotification(response.data.user.notification);
        } else {
          setNotification(null);
        }
      } catch (error) {
        // Optionally handle error
      }
    };
    fetchNotification();
  }, []);

  const handleDismiss = async () => {
    try {
      const token = localStorage.getItem("token");
      // Use the notification DELETE endpoint instead of the old PATCH endpoint
      await axios.delete(`/api/notifications/${notification._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification(null);
    } catch (error) {
      showErrorToast(error, "Failed to dismiss notification", {
        operation: "dismissNotification",
        notificationId: notification._id
      });
    }
  };

  if (!notification) return null;

  return (
    <div style={{ background: '#fff3cd', color: '#856404', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba', position: 'relative' }}>
      <span>{notification.message || notification.title || 'Notification'}</span>
      <button onClick={handleDismiss} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#856404' }}>&times;</button>
    </div>
  );
};

export default SellerNotification;
