import React, { useState } from 'react';
import './TrackOrder.css';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail } from 'lucide-react';

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock tracking data for demonstration
  const mockTrackingData = {
    orderNumber: 'EMW123456789',
    status: 'In Transit',
    estimatedDelivery: '2024-01-25',
    currentLocation: 'Distribution Center - Chicago, IL',
    trackingSteps: [
      {
        status: 'Order Placed',
        date: '2024-01-20',
        time: '10:30 AM',
        location: 'Online',
        completed: true,
        description: 'Your order has been successfully placed and confirmed.'
      },
      {
        status: 'Order Processed',
        date: '2024-01-21',
        time: '2:15 PM',
        location: 'Fulfillment Center - New York',
        completed: true,
        description: 'Your order has been processed and prepared for shipment.'
      },
      {
        status: 'Shipped',
        date: '2024-01-22',
        time: '9:45 AM',
        location: 'Fulfillment Center - New York',
        completed: true,
        description: 'Your package has been shipped and is on its way.'
      },
      {
        status: 'In Transit',
        date: '2024-01-23',
        time: '6:20 PM',
        location: 'Distribution Center - Chicago, IL',
        completed: true,
        description: 'Your package is currently in transit to the destination.'
      },
      {
        status: 'Out for Delivery',
        date: '2024-01-25',
        time: 'Pending',
        location: 'Local Delivery Hub',
        completed: false,
        description: 'Your package will be out for delivery soon.'
      },
      {
        status: 'Delivered',
        date: '2024-01-25',
        time: 'Pending',
        location: 'Your Address',
        completed: false,
        description: 'Your package will be delivered to your address.'
      }
    ],
    packageDetails: {
      weight: '2.5 lbs',
      dimensions: '12" x 8" x 4"',
      carrier: 'FedEx',
      trackingNumber: 'FX123456789012'
    },
    deliveryAddress: {
      name: 'John Doe',
      address: '123 Main Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please enter a valid order number');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      if (orderNumber.toLowerCase().includes('emw') || orderNumber === '123456789') {
        setTrackingData(mockTrackingData);
      } else {
        setError('Order not found. Please check your order number and try again.');
        setTrackingData(null);
      }
      setLoading(false);
    }, 1500);
  };

  const getStatusIcon = (status, completed) => {
    if (completed) {
      return <CheckCircle className="status-icon completed" />;
    }
    
    switch (status) {
      case 'Order Placed':
        return <Package className="status-icon" />;
      case 'Shipped':
      case 'In Transit':
        return <Truck className="status-icon" />;
      case 'Out for Delivery':
        return <Truck className="status-icon" />;
      case 'Delivered':
        return <CheckCircle className="status-icon" />;
      default:
        return <Clock className="status-icon" />;
    }
  };

  return (
    <div className="track-order-container">
      {/* Hero Section */}
      <section className="track-hero">
        <div className="hero-content">
          <h1>Track Your Order</h1>
          <p>Enter your order number to get real-time updates on your package</p>
        </div>
      </section>

      <div className="container">
        {/* Search Form */}
        <section className="search-section">
          <form onSubmit={handleTrackOrder} className="search-form">
            <div className="search-input-group">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Enter your order number (e.g., EMW123456789)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Tracking...' : 'Track Order'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
        </section>

        {/* Tracking Results */}
        {trackingData && (
          <section className="tracking-results">
            {/* Order Summary */}
            <div className="order-summary">
              <div className="summary-header">
                <h2>Order #{trackingData.orderNumber}</h2>
                <div className="status-badge">
                  <span className={`status ${trackingData.status.toLowerCase().replace(' ', '-')}`}>
                    {trackingData.status}
                  </span>
                </div>
              </div>
              <div className="summary-details">
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>Current Location: {trackingData.currentLocation}</span>
                </div>
                <div className="detail-item">
                  <Clock size={16} />
                  <span>Estimated Delivery: {trackingData.estimatedDelivery}</span>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="tracking-timeline">
              <h3>Tracking History</h3>
              <div className="timeline">
                {trackingData.trackingSteps.map((step, index) => (
                  <div key={index} className={`timeline-item ${step.completed ? 'completed' : 'pending'}`}>
                    <div className="timeline-marker">
                      {getStatusIcon(step.status, step.completed)}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h4>{step.status}</h4>
                        <div className="timeline-time">
                          <span className="date">{step.date}</span>
                          {step.time !== 'Pending' && <span className="time">{step.time}</span>}
                        </div>
                      </div>
                      <p className="timeline-location">{step.location}</p>
                      <p className="timeline-description">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Package & Delivery Details */}
            <div className="details-grid">
              <div className="details-card">
                <h3>Package Details</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="label">Weight:</span>
                    <span className="value">{trackingData.packageDetails.weight}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Dimensions:</span>
                    <span className="value">{trackingData.packageDetails.dimensions}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Carrier:</span>
                    <span className="value">{trackingData.packageDetails.carrier}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tracking #:</span>
                    <span className="value">{trackingData.packageDetails.trackingNumber}</span>
                  </div>
                </div>
              </div>

              <div className="details-card">
                <h3>Delivery Address</h3>
                <div className="address-info">
                  <p className="recipient-name">{trackingData.deliveryAddress.name}</p>
                  <p>{trackingData.deliveryAddress.address}</p>
                  <p>{trackingData.deliveryAddress.city}, {trackingData.deliveryAddress.state} {trackingData.deliveryAddress.zipCode}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Help Section */}
        <section className="help-section">
          <h2>Need Help?</h2>
          <div className="help-grid">
            <div className="help-card">
              <Phone className="help-icon" />
              <h3>Call Us</h3>
              <p>1-800-EMALL-WORLD</p>
              <p>Mon-Fri: 8AM-8PM EST</p>
            </div>
            <div className="help-card">
              <Mail className="help-icon" />
              <h3>Email Support</h3>
              <p>support@emallworld.com</p>
              <p>We'll respond within 24 hours</p>
            </div>
            <div className="help-card">
              <Package className="help-icon" />
              <h3>Order Issues</h3>
              <p>Report damaged or missing items</p>
              <p>We're here to help resolve any issues</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrackOrder;