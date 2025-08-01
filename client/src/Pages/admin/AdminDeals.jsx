import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaStop } from "react-icons/fa";
import { AiOutlineStop } from "react-icons/ai";
import axios from "../../utils/axios";

const statusOptions = ["pending", "approved", "rejected"];

function AdminDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [dealToReject, setDealToReject] = useState(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/deals/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setDeals(response.data.deals);
        console.log("deal admin", response.data.deals); 
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter((d) =>
    filter === "all" ? true : d.status === filter
  );

  const handleApprove = async (id) => {
    if (window.confirm("Approve this deal?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `/api/deals/admin/${id}/approve`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchDeals();
      } catch (error) {
        // Optionally show error
      }
    }
  };

  const handleReject = (deal) => {
    setDealToReject(deal);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (dealToReject) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `/api/deals/admin/${dealToReject._id}/reject`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setShowRejectModal(false);
        setDealToReject(null);
        fetchDeals();
      } catch (error) {
        // Optionally show error
      }
    }
  };

  const cancelReject = () => {
    setShowRejectModal(false);
    setDealToReject(null);
  };

  const handleEndDeal = async (id) => {
    if (window.confirm("End this deal immediately?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `/api/deals/${id}/end`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchDeals();
      } catch (error) {
        // Optionally show error
      }
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <h2 style={{ marginBottom: 24, color: "#222", fontWeight: 700 }}>
        Admin Deal Management
      </h2>
      <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              background: filter === status ? "#fc8a06" : "#eee",
              color: filter === status ? "#fff" : "#333",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setFilter("all")}
          style={{
            background: filter === "all" ? "#fc8a06" : "#eee",
            color: filter === "all" ? "#fff" : "#333",
            border: "none",
            borderRadius: 8,
            padding: "8px 20px",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          All
        </button>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredDeals.length === 0 && <li>No deals found.</li>}
        {filteredDeals.map((deal) => (
          <li
            key={deal._id}
            style={{
              border: "1px solid #fc8a06",
              borderRadius: 12,
              padding: 18,
              marginBottom: 18,
              background: "#fff9ed",
              boxShadow: "0 2px 8px rgba(252,138,6,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <strong style={{ fontSize: 18, color: "#222" }}>
                {deal.title}
              </strong>
              <span
                style={{
                  background:
                    deal.status === "approved"
                      ? "#28a745"
                      : deal.status === "pending"
                      ? "#ffa500"
                      : "#dc3545",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "2px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {deal.status}
              </span>
            </div>
            <div style={{ color: "#444", marginBottom: 8 }}>
              {deal.description}
            </div>
            <div
              style={{ color: "#e57a00", fontWeight: 600, marginBottom: 10 }}
            >
              Discount: {deal.discountPercentage}%
            </div>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 10 }}>
              Shop Name: {deal.seller?.shopName || deal.seller?.names || "N/A"}
            </div>
            {deal.status === "pending" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleApprove(deal._id)}
                  style={{
                    background: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 18px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FaCheck style={{ marginRight: 6 }} /> Approve
                </button>
                <button
                  onClick={() => handleReject(deal)}
                  style={{
                    background: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 18px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FaTimes style={{ marginRight: 6 }} /> Reject
                </button>
              </div>
            )}
            {deal.status === "approved" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleEndDeal(deal._id)}
                  style={{
                    background: "#ffc107",
                    color: "#212529",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 18px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <AiOutlineStop style={{ marginRight: 6 }} /> End Deal
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 28,
              borderRadius: 12,
              minWidth: 320,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ marginBottom: 18, color: "#dc3545", fontWeight: 700 }}>
              Reject Deal
            </h3>
            <p>
              Are you sure you want to reject the deal{" "}
              <b>{dealToReject?.title}</b>?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 18,
              }}
            >
              <button
                onClick={confirmReject}
                style={{
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 22px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Reject
              </button>
              <button
                onClick={cancelReject}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 22px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDeals;
