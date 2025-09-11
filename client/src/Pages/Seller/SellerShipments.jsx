// import React, { useEffect, useState, useCallback } from "react";
// import axios from "axios";
// import "./seller-shipments.css";

// const SellerShipments = ({ sellerId }) => {
//   const [shipments, setShipments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [fetchKey, setFetchKey] = useState(0);
//   const api = axios.create();

//   const fetchShipments = useCallback(async () => {
//     if (!sellerId) return;
//     setLoading(true);
//     setError(null);
//     try {
//       const resp = await api.get(`/api/shipments/seller/${sellerId}`, {
//         params: { page, limit },
//       });
//       const data = resp.data;
//       setShipments(data.shipments || []);
//       setTotal(data.total || (data.shipments || []).length);
//     } catch (err) {
//       setError(
//         err.response?.data?.message || err.message || "Failed to load shipments"
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [sellerId, page, limit, fetchKey]);

//   useEffect(() => {
//     fetchShipments();
//   }, [fetchShipments]);

//   const handleDownloadLabel = async (waybill) => {
//     try {
//       const resp = await api.get(`/api/shipments/label/${waybill}`, {
//         responseType: "blob",
//       });
//       const url = window.URL.createObjectURL(new Blob([resp.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", `${waybill}.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch {
//       alert("Label download failed.");
//     }
//   };

//   const handleOpenTracking = (trackingUrl) => {
//     if (!trackingUrl) return alert("Tracking URL not available.");
//     window.open(trackingUrl, "_blank", "noopener,noreferrer");
//   };

//   const handleRequestPickup = async () => {
//     if (!confirm("Create pickup request for ready parcels?")) return;
//     try {
//       setLoading(true);
//       const resp = await api.post(`/api/shipments/request-pickup`, {
//         sellerId,
//       });
//       alert(resp.data.message || "Pickup requested");
//       setFetchKey((k) => k + 1);
//     } catch (err) {
//       alert(err.response?.data?.message || "Pickup request failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="shipments-container">
//       <div className="shipments-header">
//         <h2>Shipments</h2>
//         <div className="shipments-actions">
//           <button
//             className="btn-primary"
//             onClick={() => setFetchKey((k) => k + 1)}
//           >
//             Refresh
//           </button>
//           <button className="btn-secondary" onClick={handleRequestPickup}>
//             Request Pickup
//           </button>
//         </div>
//       </div>

//       {loading && <div className="shipments-loading">Loading...</div>}
//       {error && <div className="shipments-error">Error: {error}</div>}
//       {!loading && shipments.length === 0 && (
//         <div className="shipments-empty">No shipments found.</div>
//       )}

//       <div className="shipments-list">
//         {shipments.map((s) => (
//           <div key={s.waybill || Math.random()} className="shipment-card">
//             <div className="shipment-left">
//               <div className="shipment-row">
//                 <strong>Order:</strong> {s.orderId}
//               </div>
//               <div className="shipment-row">
//                 <strong>Waybill:</strong> {s.waybill || "N/A"}
//               </div>
//               <div className="shipment-row">
//                 <strong>Status:</strong>{" "}
//                 <span
//                   className={`status-badge ${s.status?.toLowerCase() || ""}`}
//                 >
//                   {s.status || "N/A"}
//                 </span>
//               </div>
//               <div className="shipment-row">
//                 <strong>Shipped At:</strong>{" "}
//                 {s.shippedAt ? new Date(s.shippedAt).toLocaleString() : "-"}
//               </div>
//               <div className="shipment-row small">
//                 <strong>Created:</strong>{" "}
//                 {s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}
//               </div>
//             </div>

//             <div className="shipment-right">
//               <button
//                 className="btn-outline"
//                 onClick={() => handleOpenTracking(s.trackingUrl)}
//                 disabled={!s.trackingUrl}
//               >
//                 Track
//               </button>
//               <button
//                 className="btn-outline"
//                 onClick={() => handleDownloadLabel(s.waybill)}
//                 disabled={!s.waybill}
//               >
//                 Download Label
//               </button>
//               {s.labelUrl && (
//                 <a
//                   className="btn-link"
//                   href={s.labelUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                 >
//                   View Label
//                 </a>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="shipments-footer">
//         <div>
//           Showing {shipments.length} of {total} shipments
//         </div>
//         <div className="pagination">
//           <button
//             disabled={page <= 1}
//             onClick={() => setPage((p) => p - 1)}
//             className="btn"
//           >
//             Prev
//           </button>
//           <span className="page-indicator">Page {page}</span>
//           <button onClick={() => setPage((p) => p + 1)} className="btn">
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SellerShipments;

import React, { useEffect, useState } from "react";
import axios from "../../utils/axios";

const SellerShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sellerInfo, setSellerInfo] = useState(null);

  //  1. Fetch seller info first
  const fetchSellerInfo = async () => {
    try {
      const res = await axios.get("/api/sellers/me");
      console.log("🟢 Seller Info Response:", res.data);

      if (res.data.success) {
        setSellerInfo(res.data.seller);
      } else {
        console.error("❌ Failed to fetch seller info");
      }
    } catch (err) {
      console.error("❌ Seller Info API Error:", err);
    }
  };

  useEffect(() => {
    fetchSellerInfo();
  }, []);

  const sellerId = sellerInfo?._id;

  //  2. Load shipments only when sellerId exists
  const fetchShipments = async () => {
    if (!sellerId) return; // wait until sellerId available
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/shipments/seller/${sellerId}/shipments-list?page=${page}&limit=${limit}`
      );
      console.log("📦 Fetch Shipments Response:", res.data);

      if (res.data.success) {
        setShipments(res.data.shipments);
        setTotal(res.data.total);

        console.log(
          "📦 Shipments Data:",
          res.data.shipments[0].pickupRequested
        );
      } else {
        console.error("❌ Failed to fetch shipments");
      }
    } catch (err) {
      console.error("❌ Shipments API Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (sellerId) {
      fetchShipments();
    }
  }, [page, sellerId]);

  //  Download Label
  const downloadLabel = async (waybill) => {
    try {
      const res = await axios.get(`/api/shipments/label/${waybill}`, {
        responseType: "blob",
      });
      console.log("🖨 Label Download Response:", res);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${waybill}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("❌ Failed to download label:", err);
      alert("Failed to download label");
    }
  };

  //  Track Shipment
  const trackShipment = async (waybill) => {
    try {
      const res = await axios.get(`/api/shipments/track/${waybill}`);
      console.log("🚚 Track Shipment Response:", res.data);

      if (res.data.success) {
        setTrackingData(res.data.data);
        // console.log("📦 Tracking Data:", res.data.data);
        setModalOpen(true);
      } else {
        alert("Failed to track shipment");
      }
    } catch (err) {
      console.error("❌ Track API Error:", err);
      alert("Failed to track shipment");
    }
  };

  //  Request Pickup (per order)
  const requestPickup = async (orderId) => {
    try {
      const res = await axios.post(`/api/shipments/request-pickup`, {
        orderId,
        sellerId,
      });
      console.log("📤 Request Pickup Response:", res.data);

      if (res.data.success) {
        alert(`Pickup requested for Order ${orderId}`);
        fetchShipments(); // refresh list
      } else {
        alert("Pickup request failed");
      }
    } catch (err) {
      console.error("❌ Pickup API error:", err);
      alert("Pickup API error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/*  Big Page Heading */}
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        📦 Shipments Page
      </h1>

      {/*  Show seller info */}
      {/* {sellerInfo && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "6px",
          }}
        >
          <p>
            <strong>Seller Name:</strong> {sellerInfo.name}
          </p>
          <p>
            <strong>Seller ID:</strong> {sellerInfo._id}
          </p>
        </div>
      )} */}

      {loading ? (
        <p>Loading shipments...</p>
      ) : (
        <div>
          {shipments.map((s) => (
            <div
              key={s?.waybill || s?.orderId}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "10px",
              }}
            >
              <p>
                <strong>Order:</strong> {s.customeOrderId || s.orderId}
              </p>
              <p>
                <strong>Waybill:</strong> {s.waybill || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {s.deliveryStatus}
              </p>
              <p style={{ fontSize: "12px", color: "#555" }}>
                Shipped:{" "}
                {s.shippedAt
                  ? new Date(s.shippedAt).toLocaleString()
                  : "Not yet shipped"}
              </p>

              <div style={{ marginTop: "10px" }}>
                {s.waybill && (
                  <>
                    <button
                      style={{ marginRight: "8px" }}
                      onClick={() => downloadLabel(s.waybill)}
                    >
                      🖨 Label
                    </button>
                    <button
                      style={{ marginRight: "8px" }}
                      onClick={() => trackShipment(s.waybill)}
                    >
                      🚚 Track
                    </button>
                  </>
                )}

                {s.pickupRequested === false ? (
                  <button onClick={() => requestPickup(s.orderId)}>
                    📤 Pickup
                  </button>
                ) : (
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    ✅ Pickup already requested
                    {s.pickupRequest?.pickupDate
                      ? ` for ${new Date(
                          s.pickupRequest.pickupDate
                        ).toLocaleDateString()}`
                      : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/*  Pagination */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            style={{
              marginRight: "5px",
              padding: "5px 10px",
              background: page === i + 1 ? "#007bff" : "#f0f0f0",
              color: page === i + 1 ? "#fff" : "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/*  Tracking Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "400px",
              maxHeight: "80%",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>Shipment Tracking</h2>
            {/*  Tracking Modal */}
            {modalOpen &&
              trackingData &&
              (() => {
                const shipment = trackingData?.ShipmentData?.[0]?.Shipment;

                return (
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 999,
                    }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        padding: "20px",
                        borderRadius: "8px",
                        width: "500px",
                        maxHeight: "80%",
                        overflowY: "auto",
                      }}
                    >
                      <h2 style={{ marginBottom: "10px" }}>
                        🚚 Shipment Tracking
                      </h2>

                      {shipment ? (
                        <>
                          <div
                            style={{
                              background: "#f9f9f9",
                              padding: "10px",
                              borderRadius: "6px",
                              marginBottom: "15px",
                            }}
                          >
                            <p>
                              <strong>Waybill:</strong> {shipment.AWB}
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              {shipment.Status?.Status || "Not Available"}
                            </p>
                            <p>
                              <strong>Origin:</strong> {shipment.Origin}
                            </p>
                            <p>
                              <strong>Destination:</strong>{" "}
                              {shipment.Destination}
                            </p>
                            <p>
                              <strong>Order Ref:</strong> {shipment.ReferenceNo}
                            </p>
                            <p>
                              <strong>Consignee:</strong>{" "}
                              {shipment.Consignee?.Name},{" "}
                              {shipment.Consignee?.City}
                            </p>
                            <p>
                              <strong>COD Amount:</strong> ₹{shipment.CODAmount}
                            </p>
                          </div>

                          <h3 style={{ marginBottom: "10px" }}>
                            📍 Tracking History
                          </h3>
                          <ul style={{ listStyle: "none", padding: 0 }}>
                            {shipment.Scans?.map((scan, idx) => (
                              <li
                                key={idx}
                                style={{
                                  marginBottom: "15px",
                                  borderLeft: "3px solid #007bff",
                                  paddingLeft: "10px",
                                }}
                              >
                                <p style={{ margin: 0, fontWeight: "bold" }}>
                                  {scan.ScanDetail.Scan}
                                  <span
                                    style={{ fontSize: "12px", color: "#666" }}
                                  >
                                    {" "}
                                    ({scan.ScanDetail.ScanType})
                                  </span>
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    color: "#555",
                                  }}
                                >
                                  {new Date(
                                    scan.ScanDetail.ScanDateTime
                                  ).toLocaleString()}
                                </p>
                                <p style={{ margin: 0 }}>
                                  {scan.ScanDetail.ScannedLocation}
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    color: "#007bff",
                                  }}
                                >
                                  {scan.ScanDetail.Instructions}
                                </p>
                              </li>
                            ))}
                          </ul>
                          <p>
                            <strong>Now:</strong>{" "}
                            {shipment.Scans?.length
                              ? `${
                                  shipment.Scans[shipment.Scans.length - 1]
                                    .ScanDetail.Scan
                                } at ${
                                  shipment.Scans[shipment.Scans.length - 1]
                                    .ScanDetail.ScannedLocation
                                }`
                              : "No updates yet"}
                          </p>
                        </>
                      ) : (
                        <p>No shipment data available.</p>
                      )}

                      <button
                        style={{
                          marginTop: "10px",
                          width: "100%",
                          padding: "8px",
                          background: "#007bff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => setModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerShipments;
