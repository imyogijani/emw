import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  CheckCircle,
  Download,
  Home,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Package,
  Truck,
  Receipt,
  Star,
  Share2,
  Copy,
} from "lucide-react";
import "./Invoice.css";

export default function Invoice() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get completed order data from session storage
    const completedOrder = sessionStorage.getItem("completedOrder");
    if (!completedOrder) {
      toast.error("Order not found!");
      navigate("/");
      return;
    }

    const order = JSON.parse(completedOrder);
    if (order.orderId !== orderId) {
      toast.error("Invalid order ID!");
      navigate("/");
      return;
    }

    setOrderData(order);
    setLoading(false);

    // Clear checkout data as it's no longer needed
    sessionStorage.removeItem("checkoutData");
  }, [orderId, navigate]);

  const handleDownloadInvoice = () => {
    // Create a printable version
    window.print();
  };

  const handleContinueShopping = () => {
    // Clear completed order data and go to home
    sessionStorage.removeItem("completedOrder");
    navigate("/");
  };

  const handleTrackOrder = () => {
    // In a real app, this would navigate to order tracking page
    toast.info("Order tracking feature coming soon!");
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied to clipboard!");
  };

  const shareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: "Order Confirmation",
        text: `My order #${orderId} has been confirmed!`,
        url: window.location.href,
      });
    } else {
      copyOrderId();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodDisplay = (method) => {
    switch (method) {
      case "card":
        return "Credit/Debit Card";
      case "upi":
        return "UPI";
      case "netbanking":
        return "Net Banking";
      case "cod":
        return "Cash on Delivery";
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="invoice-loading">
        <div className="loading-spinner"></div>
        <p>Loading your invoice...</p>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="invoice-error">
        <h2>Order not found</h2>
        <button onClick={handleContinueShopping}>Go to Home</button>
      </div>
    );
  }

  return (
    <div className="invoice-container">
      {/* Success Header */}
      <div className="success-header">
        <div className="success-icon">
          <CheckCircle size={64} color="#28a745" />
        </div>
        <h1>Order Confirmed!</h1>
        <p>
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>
        <div className="order-id-display">
          <span className="order-id-label">Order ID:</span>
          <span className="order-id">{orderId}</span>
          <button
            className="copy-btn"
            onClick={copyOrderId}
            title="Copy Order ID"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="invoice-action-btn"
          onClick={handleDownloadInvoice}
        >
          <Download size={18} />
          Download Invoice
        </button>
        <button className="invoice-action-btn" onClick={shareOrder}>
          <Share2 size={18} />
          Share
        </button>
      </div>

      {/* Invoice Content */}
      <div className="invoice-content">
        <div className="invoice-main">
          {/* Company Header */}
          <div className="invoice-header">
            <div className="company-info">
              <div className="company-logo" style={{ marginBottom: 12 }}>
                {/* Replace with your logo image if available */}
                <img src="/logo192.png" alt="FooEcom Logo" style={{ height: 48, marginBottom: 8 }} />
              </div>
              <h2>FooEcom</h2>
              <p>Premium Food Delivery Service</p>
              <div className="company-address">
                <p>123 Business Street, Tech City, State 123456</p>
                <p>Email: support@fooecom.com | Phone: +91 9876543210</p>
                <p>GSTIN: 27ABCDE1234F2Z5</p>
              </div>
            </div>
            <div className="invoice-meta">
              <h3>INVOICE</h3>
              <p>
                <strong>Invoice No:</strong> INV-{orderId}
              </p>
              <p>
                <strong>Order Date:</strong> {formatDate(orderData.orderDate)}
              </p>
              <p>
                <strong>Payment Method:</strong>{" "}
                {getPaymentMethodDisplay(orderData.paymentMethod)}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="customer-section" style={{ border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 24, background: '#fcfcfc' }}>
            <div className="billing-address">
              <h3>
                <MapPin size={18} />
                Billing Address
              </h3>
              <div className="address-details">
                <p>
                  <strong>
                    {orderData.billingDetails.firstName} {orderData.billingDetails.lastName}
                  </strong>
                </p>
                <p>{orderData.billingDetails.address}</p>
                <p>
                  {orderData.billingDetails.city}, {orderData.billingDetails.state} {orderData.billingDetails.pincode}
                </p>
                <p>{orderData.billingDetails.country}</p>
                <div className="contact-info">
                  <p>
                    <Phone size={14} /> {orderData.billingDetails.phone}
                  </p>
                  <p>
                    <Mail size={14} /> {orderData.billingDetails.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="delivery-info">
              <h3>
                <Truck size={18} />
                Delivery Information
              </h3>
              <div className="delivery-details">
                <p>
                  <strong>Estimated Delivery:</strong>
                </p>
                <p className="delivery-date">{formatDate(orderData.estimatedDelivery)}</p>
                <p>
                  <strong>Delivery Address:</strong>
                </p>
                <p>Same as billing address</p>
                <div className="delivery-status">
                  <span className="status-badge confirmed">Order Confirmed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="order-items-section" style={{ border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 24, background: '#fff' }}>
            <h3>
              <Receipt size={18} />
              Order Items
            </h3>
            <div className="items-table">
              <div className="table-header">
                <div className="item-col">Item</div>
                <div className="price-col">Price</div>
                <div className="qty-col">Qty</div>
                <div className="total-col">Total</div>
              </div>
              {orderData.items.map((item) => {
                const itemId = item.id || item._id;
                const itemPrice = parseFloat(item.price?.toString().replace(/[^0-9.]/g, "") || 0);
                const itemTotal = itemPrice * (item.quantity || 1);
                return (
                  <div key={itemId} className="table-row">
                    <div className="item-col">
                      <div className="item-info">
                        <img src={item.image || "/placeholder-image.jpg"} alt={item.title || item.name} />
                        <div className="item-details">
                          <h4>{item.title || item.name}</h4>
                          {(item.desc || item.description) && (
                            <p className="item-desc">{item.desc || item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="price-col">₹{itemPrice.toFixed(2)}</div>
                    <div className="qty-col">{item.quantity || 1}</div>
                    <div className="total-col">₹{itemTotal.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="price-breakdown-section" style={{ border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 24, background: '#fcfcfc' }}>
            <h3>Price Breakdown</h3>
            <div className="breakdown-table">
              <div className="breakdown-row">
                <span>Subtotal ({orderData.items.length} items)</span>
                <span>₹{orderData.pricing.subtotal.toFixed(2)}</span>
              </div>
              {orderData.pricing.couponDiscount > 0 && (
                <div className="breakdown-row discount">
                  <span>Coupon Discount ({orderData.pricing.couponCode})</span>
                  <span>-₹{orderData.pricing.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="breakdown-row">
                <span>GST (18%)</span>
                <span>₹{orderData.pricing.gstAmount.toFixed(2)}</span>
              </div>
              <div className="breakdown-row">
                <span>Packaging Charges</span>
                <span>₹{orderData.pricing.packagingCharge.toFixed(2)}</span>
              </div>
              <div className="breakdown-row">
                <span>Delivery Charges</span>
                <span className={orderData.pricing.deliveryCharge === 0 ? "free" : ""}>
                  {orderData.pricing.deliveryCharge === 0 ? "FREE" : `₹${orderData.pricing.deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              <div className="breakdown-row total">
                <span>Grand Total</span>
                <span>₹{orderData.pricing.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="additional-info" style={{ border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 24, background: '#fff' }}>
            <div className="terms-section">
              <h4>Terms & Conditions</h4>
              <ul>
                <li>All orders are subject to availability and acceptance.</li>
                <li>Delivery charges may vary based on location and order value.</li>
                <li>Please check items upon delivery and report any issues immediately.</li>
                <li>Refunds and cancellations are subject to our return policy.</li>
                <li>For any queries, contact our customer support.</li>
              </ul>
            </div>
            <div className="support-section">
              <h4>Need Help?</h4>
              <div className="support-contacts">
                <p><strong>Customer Support:</strong> +91 9876543210</p>
                <p><strong>Email:</strong> support@fooecom.com</p>
                <p><strong>Help Center:</strong> www.fooecom.com/help</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-footer" style={{ borderTop: '1.5px solid #eee', marginTop: 32, paddingTop: 24 }}>
            <div className="thank-you">
              <h3>Thank you for choosing FooEcom!</h3>
              <p>We hope you enjoy your order. Please consider leaving a review after your delivery.</p>
            </div>
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Authorized Signature</div>
                <div style={{ borderBottom: '1.5px solid #bbb', width: 180, height: 32 }}></div>
              </div>
            </div>
            <div className="company-footer">
              <p>© 2024 FooEcom. All rights reserved.</p>
              <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions (Sticky) */}
      <div className="bottom-actions">
        <button className="bottom-action-btn" onClick={handleTrackOrder}>
          <Package size={20} />
          Track Order
        </button>
        <button className="bottom-action-btn" onClick={handleContinueShopping}>
          <Home size={20} />
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
