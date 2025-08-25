import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import {
  CreditCard,
  Smartphone,
  Building,
  Shield,
  Lock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Calendar,
  User,
  Hash,
} from "lucide-react";
import axios from "../../utils/axios";
import { getCurrentUser } from "../../utils/user";
import JumpingLoader from "../../Components/JumpingLoader";
import "./Payment.css";

export default function Payment() {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");

  // Card payment state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  // UPI payment state
  const [upiId, setUpiId] = useState("");

  // Net Banking state
  const [selectedBank, setSelectedBank] = useState("");

  // Available banks for net banking
  const banks = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "IDBI Bank",
    "Yes Bank",
  ];

  // Payment methods
  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <CreditCard size={24} />,
      description: "Visa, Mastercard, RuPay",
    },
    {
      id: "upi",
      name: "UPI",
      icon: <Smartphone size={24} />,
      description: "Google Pay, PhonePe, Paytm",
    },
    {
      id: "netbanking",
      name: "Net Banking",
      icon: <Building size={24} />,
      description: "All major banks",
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: <Hash size={24} />,
      description: "Pay when you receive",
    },
  ];

  useEffect(() => {
    // Get order data from session storage
    const checkoutData = sessionStorage.getItem("checkoutData");
    if (!checkoutData) {
      toast.error("No order data found!");
      navigate("/checkout");
      return;
    }
    setOrderData(JSON.parse(checkoutData));
  }, [navigate]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleCardDetailsChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
      if (formattedValue.replace(/\s/g, "").length > 16) return;
    } else if (name === "expiryDate") {
      formattedValue = formatExpiryDate(value);
      if (formattedValue.length > 5) return;
    } else if (name === "cvv") {
      formattedValue = value.replace(/[^0-9]/gi, "");
      if (formattedValue.length > 4) return;
    }

    setCardDetails((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const validateCardDetails = () => {
    const { cardNumber, expiryDate, cvv, cardholderName } = cardDetails;

    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
      toast.error("Please enter a valid card number");
      return false;
    }

    if (!expiryDate || expiryDate.length !== 5) {
      toast.error("Please enter a valid expiry date");
      return false;
    }

    const [month, year] = expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (parseInt(month) < 1 || parseInt(month) > 12) {
      toast.error("Please enter a valid month");
      return false;
    }

    if (
      parseInt(year) < currentYear ||
      (parseInt(year) === currentYear && parseInt(month) < currentMonth)
    ) {
      toast.error("Card has expired");
      return false;
    }

    if (!cvv || cvv.length < 3) {
      toast.error("Please enter a valid CVV");
      return false;
    }

    if (!cardholderName.trim()) {
      toast.error("Please enter cardholder name");
      return false;
    }

    return true;
  };

  const validateUpiId = () => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId)) {
      toast.error("Please enter a valid UPI ID");
      return false;
    }
    return true;
  };

  const validatePaymentMethod = () => {
    switch (selectedPaymentMethod) {
      case "card":
        return validateCardDetails();
      case "upi":
        return validateUpiId();
      case "netbanking":
        if (!selectedBank) {
          toast.error("Please select a bank");
          return false;
        }
        return true;
      case "cod":
        return true;
      default:
        return false;
    }
  };

  const generateOrderId = () => {
    return (
      "ORD" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
    );
  };

  const handlePayment = async () => {
    if (!validatePaymentMethod()) return;

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate order ID and create order data
      const orderId = generateOrderId();
      const completeOrderData = {
        ...orderData,
        orderId,
        paymentMethod: selectedPaymentMethod,
        paymentDetails: {
          card: cardDetails,
          upi: upiId,
          bank: selectedBank,
        },
        orderDate: new Date().toISOString(),
        status: "confirmed",
        estimatedDelivery: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 2 days from now
      };

      // Send order to backend
      const token = localStorage.getItem("token");
      const backendOrder = {
        items: orderData.items.map((item) => ({
          name: item.title || item.name,
          price: parseFloat(item.price),
          quantity: item.quantity || 1,
          image: item.image || "",
        })),
        total: orderData.pricing.grandTotal,
      };
      const response = await axios.post("/api/orders/create", backendOrder, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Order creation failed");
      }

      // Store order data for invoice
      sessionStorage.setItem(
        "completedOrder",
        JSON.stringify(completeOrderData),
      );

      // Clear cart
      clearCart();

      // Show success message
      toast.success("Payment successful! Order placed.");

      // Redirect to invoice page
      navigate(`/invoice/${orderId}`);
    } catch (error) {
      toast.error("Payment failed. Please try again.");
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/checkout");
  };

  if (!orderData) {
    return (
      <div className="payment-loading">
        <div>Loading payment details...</div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button className="back-btn" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          Back to Checkout
        </button>
        <h1>Payment</h1>
        <div className="payment-steps">
          <div className="step completed">
            <span className="step-number">✓</span>
            <span className="step-text">Details</span>
          </div>
          <div className="step active">
            <span className="step-number">2</span>
            <span className="step-text">Payment</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-text">Confirmation</span>
          </div>
        </div>
      </div>

      <div className="payment-content">
        <div className="payment-main">
          <div className="payment-methods-section">
            <h2 className="section-title">
              <CreditCard size={20} />
              Choose Payment Method
            </h2>

            <div className="payment-methods">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`payment-method ${selectedPaymentMethod === method.id ? "selected" : ""}`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className="payment-method-icon">{method.icon}</div>
                  <div className="payment-method-info">
                    <h3>{method.name}</h3>
                    <p>{method.description}</p>
                  </div>
                  <div className="payment-method-radio">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={() => setSelectedPaymentMethod(method.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="payment-details-section">
            <h2 className="section-title">
              <Lock size={20} />
              Payment Details
            </h2>

            {selectedPaymentMethod === "card" && (
              <div className="card-payment-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardDetailsChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleCardDetailsChange}
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleCardDetailsChange}
                      placeholder="123"
                      maxLength="4"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={cardDetails.cardholderName}
                    onChange={handleCardDetailsChange}
                    placeholder="Enter name as on card"
                  />
                </div>
              </div>
            )}

            {selectedPaymentMethod === "upi" && (
              <div className="upi-payment-form">
                <div className="form-group">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="example@upi"
                  />
                </div>
                <div className="upi-apps">
                  <p>Popular UPI Apps:</p>
                  <div className="upi-app-list">
                    <span className="upi-app">Google Pay</span>
                    <span className="upi-app">PhonePe</span>
                    <span className="upi-app">Paytm</span>
                    <span className="upi-app">BHIM</span>
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod === "netbanking" && (
              <div className="netbanking-payment-form">
                <div className="form-group">
                  <label>Select Your Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                  >
                    <option value="">Choose your bank</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedPaymentMethod === "cod" && (
              <div className="cod-payment-info">
                <div className="cod-note">
                  <CheckCircle size={48} color="#28a745" />
                  <h3>Cash on Delivery</h3>
                  <p>Pay when your order is delivered to your doorstep.</p>
                  <div className="cod-features">
                    <div className="cod-feature">
                      ✓ No advance payment required
                    </div>
                    <div className="cod-feature">✓ Inspect before payment</div>
                    <div className="cod-feature">
                      ✓ Available for orders above ₹100
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="payment-sidebar">
          <div className="order-summary">
            <h2 className="section-title">Order Summary</h2>

            <div className="billing-info">
              <h3>Billing Address</h3>
              <div className="address-info">
                <p>
                  <strong>
                    {orderData.billingDetails.firstName}{" "}
                    {orderData.billingDetails.lastName}
                  </strong>
                </p>
                <p>{orderData.billingDetails.address}</p>
                <p>
                  {orderData.billingDetails.city},{" "}
                  {orderData.billingDetails.state}{" "}
                  {orderData.billingDetails.pincode}
                </p>
                <p>{orderData.billingDetails.phone}</p>
                <p>{orderData.billingDetails.email}</p>
              </div>
            </div>

            <div className="order-items-summary">
              <h3>Items ({orderData.items.length})</h3>
              {orderData.items.slice(0, 3).map((item) => {
                const itemId = item.id || item._id;
                const itemPrice = parseFloat(
                  item.price?.toString().replace(/[^0-9.]/g, "") || 0,
                );
                return (
                  <div key={itemId} className="order-item-mini">
                    <img
                      src={item.image || "/placeholder-image.jpg"}
                      alt={item.title || item.name}
                    />
                    <div className="item-info">
                      <span className="item-name">
                        {item.title || item.name}
                      </span>
                      <span className="item-qty">
                        Qty: {item.quantity || 1}
                      </span>
                    </div>
                    <span className="item-total">
                      ₹{(itemPrice * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              {orderData.items.length > 3 && (
                <div className="more-items">
                  +{orderData.items.length - 3} more items
                </div>
              )}
            </div>

            <div className="price-summary">
              <div className="price-row">
                <span>Subtotal</span>
                <span>₹{orderData.pricing.subtotal.toFixed(2)}</span>
              </div>

              {orderData.pricing.couponDiscount > 0 && (
                <div className="price-row discount">
                  <span>Coupon Discount</span>
                  <span>-₹{orderData.pricing.couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="price-row">
                <span>GST (18%)</span>
                <span>₹{orderData.pricing.gstAmount.toFixed(2)}</span>
              </div>

              <div className="price-row">
                <span>Packaging</span>
                <span>₹{orderData.pricing.packagingCharge.toFixed(2)}</span>
              </div>

              <div className="price-row">
                <span>Delivery</span>
                <span
                  className={
                    orderData.pricing.deliveryCharge === 0 ? "free" : ""
                  }
                >
                  {orderData.pricing.deliveryCharge === 0
                    ? "FREE"
                    : `₹${orderData.pricing.deliveryCharge.toFixed(2)}`}
                </span>
              </div>

              <div className="price-row total">
                <span>Total Amount</span>
                <span>₹{orderData.pricing.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="pay-now-btn"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <JumpingLoader size="small" />
                  Processing...
                </>
              ) : (
                <>
                  {selectedPaymentMethod === "cod"
                    ? "Place Order"
                    : `Pay ₹${orderData.pricing.grandTotal.toFixed(2)}`}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="security-info">
              <div className="security-item">
                <Shield size={16} />
                <span>256-bit SSL Encrypted</span>
              </div>
              <div className="security-item">
                <Lock size={16} />
                <span>100% Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
