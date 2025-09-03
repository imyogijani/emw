import React, { useEffect, useState } from 'react';
import axios from '../../utils/axios';
import './SellerDetailsModal.css';

const SellerDetailsModal = ({ sellerId, onClose }) => {
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sellerId) {
      setSellerDetails(null);
      setLoading(false);
      return;
    }

    const fetchSellerDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/admin/sellers/${sellerId}`);
        setSellerDetails(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching seller details');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerDetails();
  }, [sellerId]);

  if (!sellerId) return null;

  if (loading) return <div className="modal-overlay"><div className="modal-content">Loading...</div></div>;
  if (error) return <div className="modal-overlay"><div className="modal-content">Error: {error}</div></div>;
  if (!sellerDetails) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Seller Details: {sellerDetails.shopName || sellerDetails.names}</h2>
        <div className="details-section">
          <p><strong>Email:</strong> {sellerDetails.email}</p>
          <p><strong>Last Login:</strong> {new Date(sellerDetails.lastLogin).toLocaleString()}</p>
          <p><strong>Status:</strong> {sellerDetails.status}</p>
          <p><strong>Member Since:</strong> {new Date(sellerDetails.createdAt).toLocaleDateString()}</p>

          <h3>Subscription Details</h3>
          {sellerDetails.subscription ? (
            <>
              <p><strong>Plan Name:</strong> {sellerDetails.subscription.planName}</p>
              <p><strong>Price:</strong> ₹{sellerDetails.subscription.price}</p>
              <p><strong>Duration:</strong> {sellerDetails.subscription.duration}</p>
              <p><strong>Features:</strong> {sellerDetails.subscription.features.join(', ')}</p>
              <p><strong>Subscription Start Date:</strong> {new Date(sellerDetails.subscriptionStartDate).toLocaleDateString()}</p>
            </>
          ) : (
            <p>No active subscription</p>
          )}

          <h3>Additional Information (Coming Soon)</h3>
          <ul>
            <li>Total Products: (Will be fetched separately)</li>
            <li>Deals: N/A</li>
            <li>Features Used: {sellerDetails.subscriptionFeatures.join(', ') || 'None'}</li>
            <li>Basic Analytics (Selling, Profits): N/A</li>
            <li>Top-Selling Items: N/A</li>
            <li>Monthly Charts (Orders, Sales, Reviews): N/A</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SellerDetailsModal;