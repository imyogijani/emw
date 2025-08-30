/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  validateForm,
} from "../../utils/errorHandler";
import {
  ShoppingCart,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  Tag,
  ArrowLeft,
  ArrowRight,
  Percent,
  Truck,
  Receipt,
} from "lucide-react";
import "./Checkout.css";
import axios from "../../utils/axios";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  // const { cartItems, getTotalPrice, clearCart } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [summaryData, setSummaryData] = useState(null); // backend summary
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [userData, setUserData] = useState({
    code: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    shippingAddress: {
      name: "N/A",
      phone: "N/A",
      email: "N/A",
      addressLine1: "N/A",
      addressLine2: "N/A",
      city: "N/A",
      pincode: "N/A",
      country: "N/A",
      state: "N/A",
    },
  });

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      showErrorToast(
        "Please login to proceed with checkout",
        "Checkout - Authentication"
      );
      navigate("/login", { state: { returnUrl: location.pathname } });
      return;
    }

    // if (cartItems.length === 0) {
    //   showErrorToast("Your cart is empty!", "Checkout - Cart Validation");
    //   navigate("/");
    //   return;
    // }
  }, [navigate, location.pathname]);

  // Try to pre-fill user details from localStorage if available
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("User Details --- ", JSON.stringify(user));
    if (user) {
      setBillingDetails((prev) => ({
        ...prev,
        firstName: user.firstName || user.names?.split(" ")[0] || "",
        lastName: user.lastName || user.names?.split(" ")[1] || "",
        email: user.email || "",
        phone: user.phone || "",
      }));

      setUserData((prev) => ({
        ...prev,
        firstName: user.firstName || user.names?.split(" ")[0] || "",
        lastName: user.lastName || user.names?.split(" ")[1] || "",
        email: user.email || "",
        phone: user.phone || "",
        shippingAddress: {
          ...prev.shippingAddress,
          name: user?.firstName + user?.lastName,
          phone: user?.phone,
          email: user?.email,
        },
      }));
    }
  }, []);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        // localStorage se token uthao
        const token = localStorage.getItem("token");

        // API call karo
        const res = await axios.get("/api/users/address");

        console.log("Address  Checkout :", res);

        if (res.data.success) {
          setUserData((prevData) => ({
            ...prevData, // purana userData copy
            shippingAddress: {
              ...prevData.shippingAddress,
              ...res.data.address,
            },
          }));
        }
      } catch (err) {
        console.error("Error fetching address", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, []);

  // Billing Details State
  const [billingDetails, setBillingDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // Available coupons (in real app, fetch from API)
  const availableCoupons = [
    { code: "SAVE10", discount: 10, type: "percentage", minOrder: 200 },
    { code: "FLAT50", discount: 50, type: "fixed", minOrder: 500 },
    { code: "NEWUSER", discount: 15, type: "percentage", minOrder: 100 },
    { code: "WEEKEND20", discount: 20, type: "percentage", minOrder: 300 },
  ];

  // Redirect if cart is empty
  // useEffect(() => {
  //   if (cartItems.length === 0) {
  //     showErrorToast("Your cart is empty!", "Checkout - Cart Validation");
  //     navigate("/");
  //   }
  // }, [cartItems.length, navigate]);

  // Calculate pricing
  const subtotal = 100;
  const gstRate = 0.18; // 18% GST
  const gstAmount = subtotal * gstRate;
  const deliveryCharge = subtotal > 500 ? 0 : 40;
  const packagingCharge = 10;

  // Calculate coupon discount
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      couponDiscount = (subtotal * appliedCoupon.discount) / 100;
    } else {
      couponDiscount = appliedCoupon.discount;
    }
  }

  const totalBeforeTax = subtotal - couponDiscount;
  const finalGstAmount = totalBeforeTax * gstRate;
  const grandTotal =
    totalBeforeTax + finalGstAmount + deliveryCharge + packagingCharge;

  // useEffect(() => {
  //   fetchCheckoutSummary();
  // }, []);

  useEffect(() => {
    if (userData.shippingAddress && userData.shippingAddress.pincode) {
      // summary call sirf tab hogi jab pincode (or required field) aaya ho
      fetchCheckoutSummary(userData.shippingAddress);
    }
  }, [userData.shippingAddress]);

  const fetchCheckoutSummary = async () => {
    try {
      setLoadingSummary(true);

      const resp = await axios.post("/api/checkout/summary", {
        shippingAddress: userData.shippingAddress,
      });

      if (resp.data.success) {
        setSummaryData(resp.data);
      } else {
        showErrorToast(
          resp.data.message || "Failed to fetch summary",
          "Checkout"
        );
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || err.message, "Checkout");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...billingDetails, [name]: value };
    setBillingDetails(updated);

    // re-fetch summary if key fields changed
    if (["pincode", "city", "state", "address"].includes(name)) {
      fetchCheckoutSummary(updated);
    }
  };

  const applyCoupon = async () => {
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.post(
        "/api/checkout/apply-coupon",
        { code: couponCode, summary: summaryData }, // send coupon + current summary
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.data.success) {
        setAppliedCoupon(resp.data.coupon);
        setSummaryData(resp.data.updatedSummary); // backend recalculates totals
        showSuccessToast(
          `Coupon applied: ${resp.data.coupon.code}`,
          "Checkout"
        );
      } else {
        showErrorToast(resp.data.message, "Coupon");
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || err.message, "Coupon");
    }
  };

  // const applyCoupon = () => {
  //   const coupon = availableCoupons.find(
  //     (c) => c.code.toLowerCase() === couponCode.toLowerCase()
  //   );
  //   if (!coupon) {
  //     showErrorToast("Invalid coupon code!", "Checkout - Coupon Validation");
  //     return;
  //   }
  //   if (subtotal < coupon.minOrder) {
  //     showErrorToast(
  //       `Minimum order amount ₹${coupon.minOrder} required for this coupon!`,
  //       "Checkout - Coupon Validation"
  //     );
  //     return;
  //   }
  //   setAppliedCoupon(coupon);
  //   showSuccessToast(
  //     `Coupon "${coupon.code}" applied successfully!`,
  //     "Checkout - Coupon Applied"
  //   );
  //   setShowCouponInput(false);
  //   setCouponCode("");
  // };

  // const removeCoupon = () => {
  //   setAppliedCoupon(null);
  //   showInfoToast("Coupon removed", "Checkout - Coupon Management");
  // };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    fetchCheckoutSummary(billingDetails); // refresh without coupon
  };
  const validateCheckoutForm = () => {
    const validationRules = {
      firstName: {
        required: true,
        requiredMessage: "First name is required",
      },
      lastName: {
        required: true,
        requiredMessage: "Last name is required",
      },
      email: {
        required: true,
        requiredMessage: "Email is required",
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: "Please enter a valid email address",
      },
      phone: {
        required: true,
        requiredMessage: "Phone number is required",
        minLength: 10,
        maxLength: 10,
        minLengthMessage: "Please enter a valid 10-digit phone number",
        maxLengthMessage: "Please enter a valid 10-digit phone number",
      },
      address: {
        required: true,
        requiredMessage: "Address is required",
      },
      city: {
        required: true,
        requiredMessage: "City is required",
      },
      state: {
        required: true,
        requiredMessage: "State is required",
      },
      pincode: {
        required: true,
        requiredMessage: "Pincode is required",
        minLength: 6,
        maxLength: 6,
        minLengthMessage: "Please enter a valid 6-digit pincode",
        maxLengthMessage: "Please enter a valid 6-digit pincode",
      },
    };

    const { isValid } = validateForm(billingDetails, validationRules);
    return isValid;
  };

  const handleProceedToPayment = () => {
    if (!validateCheckoutForm()) return;

    const orderData = {
      items: cartItems,
      billingDetails,
      pricing: {
        subtotal,
        gstAmount: finalGstAmount,
        deliveryCharge,
        packagingCharge,
        couponDiscount,
        couponCode: appliedCoupon?.code || null,
        grandTotal,
      },
    };

    // Store order data in sessionStorage for payment page
    sessionStorage.setItem("checkoutData", JSON.stringify(orderData));
    navigate("/payment");
  };

  const handleContinueShopping = () => {
    navigate("/");
  };

  // if (cartItems.length === 0) {
  //   return (
  //     <div className="checkout-empty">
  //       <div className="empty-cart-icon">
  //         <ShoppingCart size={64} />
  //       </div>
  //       <h2>Your cart is empty</h2>
  //       <p>Add some items to your cart to proceed with checkout</p>
  //       <button
  //         className="continue-shopping-btn"
  //         onClick={handleContinueShopping}
  //       >
  //         Continue Shopping
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Checkout</h1>
        <div className="checkout-steps">
          <div className="step active">
            <span className="step-number">1</span>
            <span className="step-text">Details</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span className="step-text">Payment</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-text">Confirmation</span>
          </div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-main">
          <div className="billing-section">
            <h2 className="section-title">
              <User size={20} />
              Billing & Delivery Address Details
            </h2>
            <div className="billing-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={billingDetails.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={billingDetails.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={billingDetails.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={billingDetails.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={billingDetails.address}
                  onChange={handleInputChange}
                  placeholder="Enter complete address"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={billingDetails.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={billingDetails.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={billingDetails.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit pincode"
                    maxLength="6"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={billingDetails.country}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="coupon-section">
            <h2 className="section-title">
              <Tag size={20} />
              Coupon Code
            </h2>
            {appliedCoupon ? (
              <div className="applied-coupon">
                <div className="coupon-info">
                  <Percent size={16} />
                  <span className="coupon-code">{appliedCoupon.code}</span>
                  <span className="coupon-benefit">
                    {appliedCoupon.type === "percentage"
                      ? `${appliedCoupon.discount}% off`
                      : `₹${appliedCoupon.discount} off`}
                  </span>
                </div>
                <button className="remove-coupon" onClick={removeCoupon}>
                  Remove
                </button>
              </div>
            ) : (
              <div className="coupon-input-section">
                {showCouponInput ? (
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter coupon code"
                      className="coupon-input"
                    />
                    <button className="apply-coupon-btn" onClick={applyCoupon}>
                      Apply
                    </button>
                    <button
                      className="cancel-coupon-btn"
                      onClick={() => {
                        setShowCouponInput(false);
                        setCouponCode("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="add-coupon-btn"
                    onClick={() => setShowCouponInput(true)}
                  >
                    <Tag size={16} />
                    Add Coupon Code
                  </button>
                )}

                <div className="available-coupons">
                  <p>Available coupons:</p>
                  {availableCoupons.map((coupon) => (
                    <div key={coupon.code} className="coupon-suggestion">
                      <span className="coupon-code">{coupon.code}</span>
                      <span className="coupon-desc">
                        {coupon.type === "percentage"
                          ? `${coupon.discount}% off`
                          : `₹${coupon.discount} off`}
                        on orders above ₹{coupon.minOrder}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="checkout-sidebar">
          <div className="order-summary">
            <h2 className="section-title">
              <Receipt size={20} />
              Order Summary
            </h2>

            <div className="order-items">
              {cartItems.map((item) => {
                const itemId = item.id || item._id;
                const itemPrice = parseFloat(
                  item.price?.toString().replace(/[^0-9.]/g, "") || 0
                );
                return (
                  <div key={itemId} className="order-item">
                    <img
                      src={item.image || "/placeholder-image.jpg"}
                      alt={item.title || item.name}
                      className="order-item-image"
                    />
                    <div className="order-item-details">
                      <h4 className="order-item-name">
                        {item.title || item.name}
                      </h4>
                      <div className="order-item-meta">
                        <span className="order-item-qty">
                          Qty: {item.quantity || 1}
                        </span>
                        <span className="order-item-price">
                          ₹{itemPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="order-item-total">
                        Total: ₹{(itemPrice * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="price-row discount">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="price-row">
                <span>GST (18%)</span>
                <span>₹{finalGstAmount.toFixed(2)}</span>
              </div>

              <div className="price-row">
                <span>Packaging Charges</span>
                <span>₹{packagingCharge.toFixed(2)}</span>
              </div>

              <div className="price-row">
                <span>
                  <Truck size={16} />
                  Delivery Charges
                </span>
                <span className={deliveryCharge === 0 ? "free" : ""}>
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${deliveryCharge.toFixed(2)}`}
                </span>
              </div>

              {deliveryCharge === 0 && (
                <div className="free-delivery-note">
                  🎉 Free delivery on orders above ₹500
                </div>
              )}

              <div className="price-row total">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="proceed-payment-btn"
              onClick={handleProceedToPayment}
              disabled={loading}
            >
              {loading ? "Processing..." : "Proceed to Payment"}
              <ArrowRight size={16} />
            </button>

            <div className="secure-checkout">
              <div className="security-badges">
                <span>🔒 Secure Checkout</span>
                <span>✅ SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
