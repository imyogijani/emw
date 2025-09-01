import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./seller-shipments.css";

const SellerShipments = ({ sellerId }) => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [fetchKey, setFetchKey] = useState(0);
  const api = axios.create();

  const fetchShipments = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/api/shipments/seller/${sellerId}`, {
        params: { page, limit },
      });
      const data = resp.data;
      setShipments(data.shipments || []);
      setTotal(data.total || (data.shipments || []).length);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load shipments"
      );
    } finally {
      setLoading(false);
    }
  }, [sellerId, page, limit, fetchKey]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleDownloadLabel = async (waybill) => {
    try {
      const resp = await api.get(`/api/shipments/label/${waybill}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${waybill}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Label download failed.");
    }
  };

  const handleOpenTracking = (trackingUrl) => {
    if (!trackingUrl) return alert("Tracking URL not available.");
    window.open(trackingUrl, "_blank", "noopener,noreferrer");
  };

  const handleRequestPickup = async () => {
    if (!confirm("Create pickup request for ready parcels?")) return;
    try {
      setLoading(true);
      const resp = await api.post(`/api/shipments/request-pickup`, {
        sellerId,
      });
      alert(resp.data.message || "Pickup requested");
      setFetchKey((k) => k + 1);
    } catch (err) {
      alert(err.response?.data?.message || "Pickup request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shipments-container">
      <div className="shipments-header">
        <h2>Shipments</h2>
        <div className="shipments-actions">
          <button
            className="btn-primary"
            onClick={() => setFetchKey((k) => k + 1)}
          >
            Refresh
          </button>
          <button className="btn-secondary" onClick={handleRequestPickup}>
            Request Pickup
          </button>
        </div>
      </div>

      {loading && <div className="shipments-loading">Loading...</div>}
      {error && <div className="shipments-error">Error: {error}</div>}
      {!loading && shipments.length === 0 && (
        <div className="shipments-empty">No shipments found.</div>
      )}

      <div className="shipments-list">
        {shipments.map((s) => (
          <div key={s.waybill || Math.random()} className="shipment-card">
            <div className="shipment-left">
              <div className="shipment-row">
                <strong>Order:</strong> {s.orderId}
              </div>
              <div className="shipment-row">
                <strong>Waybill:</strong> {s.waybill || "N/A"}
              </div>
              <div className="shipment-row">
                <strong>Status:</strong>{" "}
                <span
                  className={`status-badge ${s.status?.toLowerCase() || ""}`}
                >
                  {s.status || "N/A"}
                </span>
              </div>
              <div className="shipment-row">
                <strong>Shipped At:</strong>{" "}
                {s.shippedAt ? new Date(s.shippedAt).toLocaleString() : "-"}
              </div>
              <div className="shipment-row small">
                <strong>Created:</strong>{" "}
                {s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}
              </div>
            </div>

            <div className="shipment-right">
              <button
                className="btn-outline"
                onClick={() => handleOpenTracking(s.trackingUrl)}
                disabled={!s.trackingUrl}
              >
                Track
              </button>
              <button
                className="btn-outline"
                onClick={() => handleDownloadLabel(s.waybill)}
                disabled={!s.waybill}
              >
                Download Label
              </button>
              {s.labelUrl && (
                <a
                  className="btn-link"
                  href={s.labelUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Label
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="shipments-footer">
        <div>
          Showing {shipments.length} of {total} shipments
        </div>
        <div className="pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn"
          >
            Prev
          </button>
          <span className="page-indicator">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} className="btn">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerShipments;
