import React, { useEffect, useState } from "react";
import axios from "../../utils/axios";

function DealsList() {
  const [approvedDeals, setApprovedDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApprovedDeals() {
      setLoading(true);
      try {
        const response = await axios.get(
          "/api/deals/admin/all?status=approved"
        );
        console.log("Deals-- ", response);
        if (response.data.success) {
          setApprovedDeals(response.data.deals);
        } else {
          setApprovedDeals([]);
        }
      } catch (error) {
        setApprovedDeals([]);
        console.log(error);
      }
      setLoading(false);
    }
    fetchApprovedDeals();
  }, []);

  return (
    <>
      <h2
        style={{
          fontWeight: "bold",
          borderBottom: "2px solid #232f3e",
          paddingBottom: "10px",
          display: "block",
          width: "fit-content",
          textAlign: "center",
          margin: "0 auto 30px",
        }}
      >
        Available Deals
      </h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {loading && <li>Loading...</li>}
        {!loading && approvedDeals.length === 0 && <li>No deals available.</li>}
        {approvedDeals.map((deal) => (
          <li
            key={deal._id}
            style={{
              border: "1px solid #fc8a06",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              background: "#fff9ed",
            }}
          >
            <strong>{deal.title}</strong>{" "}
            <span style={{ color: "#e57a00" }}>
              ({deal.discountPercentage}% off)
            </span>
            <div>{deal.description}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              Shop: {deal.seller?.shopName || deal.seller?.names || "N/A"}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default DealsList;
