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
import {
  processImageUrl,
  processCategoryImageUrl,
} from "../../utils/apiConfig";

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
  const [offers, setOffers] = useState([]);
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

        console.log("Address  Checkout :", res.data);

        if (res.data.success) {
          setUserData((prevData) => ({
            ...prevData, // purana userData copy
            shippingAddress: {
              name: res.data.name,
              phone: res.data.phone,
              email: res.data.email,
              addressLine1: res.data.address.addressLine1,
              addressLine2: res.data.address?.addressLine2 || "",
              state: res.data.address.state,
              city: res.data.address.city,
              pincode: res.data.address.pincode,
              country: res.data.address.country,
            },
          }));

          // Abhi fresh address ke sath summary call karo
          fetchCheckoutSummary({
            ...userData,
            shippingAddress: res.data.address,
          });
        } else {
          showErrorToast("No address found!", "Checkout");
        }
      } catch (err) {
        console.error("Error fetching address", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const resp = await axios.get("/api/offers/all?status=active");

        if (resp.data.success) {
          console.log("✅ Active Offers Response:", resp.data);
          setOffers(resp.data.offers); // store in state
        } else {
          console.warn("⚠️ Failed to fetch offers:", resp.data.message);
        }
      } catch (err) {
        console.error("❌ Error fetching offers:", err.message);
      }
    };

    fetchOffers();
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

  // useEffect(() => {
  //   if (userData.shippingAddress && userData.shippingAddress.pincode) {
  //     // summary call sirf tab hogi jab pincode (or required field) aaya ho
  //     fetchCheckoutSummary(userData.shippingAddress);
  //   }
  // }, [userData.shippingAddress]);

  //  helper function  (reusable)
  const buildCartItemsFromResponse = (respData) => {
    if (!respData?.sellers) return [];

    // sellers → products flatten
    const items = respData.sellers.flatMap((seller) =>
      seller.products.map((p) => ({
        ...p, // product ka data
        sellerId: seller.sellerId,
        shopName: seller.shopName,
        pickupPincode: seller.pickupPincode,
        deliveryCharge: seller.deliveryCharge,
      }))
    );

    return items;
  };

  const buildShippingAddress = (user) => {
    return {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      phone: user.phone || "",
      email: user.email || "",
      addressLine1: user.shippingAddress.addressLine1 || "",
      addressLine2: user.shippingAddress.addressLine2 || "",
      city: user.shippingAddress.city || "",
      pincode: user.shippingAddress.pincode || "",
      country: user.shippingAddress.country || "India",
      state: user.shippingAddress.state || "",
    };
  };

  const fetchCheckoutSummary = async (updatedUser = userData) => {
    try {
      setLoadingSummary(true);

      const shippingAddress = buildShippingAddress(updatedUser);

      console.log("Checkout Summary Payload ===>", shippingAddress);

      const resp = await axios.post("/api/checkout/summary", {
        shippingAddress,
      });

      if (resp.data.success) {
        setSummaryData(resp.data);
        const items = buildCartItemsFromResponse(resp.data);
        setCartItems(items);
        console.log("fetchCheckoutSummary ---> ---> ", resp.data);
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

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   const updated = { ...billingDetails, [name]: value };
  //   setBillingDetails(updated);

  //   // re-fetch summary if key fields changed
  //   if (["pincode", "city", "state", "address"].includes(name)) {
  //     fetchCheckoutSummary(updated);
  //   }
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // address related fields
    if (
      [
        "addressLine1",
        "addressLine2",
        "city",
        "state",
        "pincode",
        "country",
      ].includes(name)
    ) {
      setUserData((prev) => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [name]: value,
        },
      }));
    } else {
      // top level fields
      setUserData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const applyCoupon = async (updatedUser = userData) => {
    try {
      const shippingAddress = buildShippingAddress(updatedUser);
      const couponCode = (userData.code || "").toUpperCase();

      console.log(
        "Apply Coupon body Frontend --> ",
        shippingAddress,
        couponCode
      );

      const resp = await axios.post("/api/checkout/apply-coupon", {
        code: couponCode,
        shippingAddress,
      });

      if (resp.data.success) {
        setAppliedCoupon({
          code: resp.data.coupon,
          discount: resp.data.discount,
          description: resp.data.description,
          offerId: resp.data.offerId,
        });

        //  Backend se updated summary lo (ye important hai)
        if (resp.data) {
          setSummaryData(resp.data);
          const items = buildCartItemsFromResponse(resp.data);
          setCartItems(items);
        }
        console.log("Apply coupan success : --> ", resp.data);

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

  const removeCoupon = () => {
    // setAppliedCoupon(null);
    // fetchCheckoutSummary(billingDetails); // refresh without coupon
    // console.log("code: 000-0-", appliedCoupon.code);

    setAppliedCoupon(null);
    setUserData((prev) => ({ ...prev, code: "" })); // reset code
    fetchCheckoutSummary({ ...userData, code: "" });
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
      // Shipping Address validation
      shippingAddress: {
        addressLine1: {
          required: true,
          requiredMessage: "Address Line 1 is required",
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
      },
    };

    // Custom validate function for nested fields
    const validateData = (data, rules) => {
      let isValid = true;

      for (const key in rules) {
        if (typeof rules[key] === "object" && !Array.isArray(rules[key])) {
          // Nested object validation
          if (data[key] && typeof data[key] === "object") {
            const nestedValid = validateData(data[key], rules[key]);
            if (!nestedValid) isValid = false;
          }
        } else {
          // Simple field validation
          const value = data[key];
          const rule = rules[key];
          if (rule.required && (!value || value.toString().trim() === "")) {
            showErrorToast(rule.requiredMessage);
            isValid = false;
          } else if (rule.pattern && !rule.pattern.test(value)) {
            showErrorToast(rule.patternMessage);
            isValid = false;
          } else if (rule.minLength && value.length < rule.minLength) {
            showErrorToast(rule.minLengthMessage);
            isValid = false;
          } else if (rule.maxLength && value.length > rule.maxLength) {
            showErrorToast(rule.maxLengthMessage);
            isValid = false;
          }
        }
      }

      return isValid;
    };

    return validateData(userData, validationRules);
  };

  const handleProceedToPayment = () => {
    if (!validateCheckoutForm()) return;

    const orderData = {
      items: cartItems,
      // billingDetails,
      userData,
      // pricing: {
      //   // subtotal,
      //   subTotal: summaryData?.subTotal,
      //   totalDeliveryCharge: summaryData?.totalDeliveryCharge,
      //   gstAmount: summaryData?.totalGST,
      //   deliveryCharge,
      //   // packagingCharge,
      //   couponDiscount: appliedCoupon?.discount,
      //   couponCode: appliedCoupon?.code || null,
      //   // grandTotal,
      //   totalAmount: summaryData?.totalAmount,
      // },
      pricing: summaryData,
      appliedCoupon: appliedCoupon,
     
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
                    value={userData.firstName}
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
                    value={userData.lastName}
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
                    value={userData.email}
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
                    value={userData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Delievery Address *</label>
                <input
                  name="addressLine1"
                  value={userData.shippingAddress.addressLine1}
                  onChange={handleInputChange}
                  placeholder="AddressLine 1 (e.g., Flat / House No / Building)"
                  rows="3"
                  required
                />

                {/* <input
                  name="addressLine1"
                  value={userData.shippingAddress?.addressLine2}
                  onChange={handleInputChange}
                  placeholder="AddressLine 2 (Optional) (e.g., Flat / House No / Building)"
                  rows="3"
                  required
                /> */}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={userData.shippingAddress.city}
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
                    value={userData.shippingAddress.state}
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
                    value={userData.shippingAddress.pincode}
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
                    value={userData.shippingAddress.country}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => fetchCheckoutSummary(userData)}
                  >
                    Recalculate Checkout Summary
                  </button>
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
                    {`₹${appliedCoupon?.discount || 0} off`}
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
                      name="code"
                      value={userData.code}
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          code: e.target.value.toUpperCase(), // hamesha uppercase
                        }))
                      }
                      placeholder="Enter coupon code"
                      className="coupon-input"
                    />

                    <button
                      className="apply-coupon-btn"
                      onClick={() => applyCoupon(userData)}
                    >
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
                  {/* {offers.map((coupon) => (
                    <div key={coupon.code} className="coupon-suggestion">
                      <span className="coupon-code">{coupon.code}</span>
                      <span className="coupon-desc">
                        {coupon.type === "percentage"
                          ? `${coupon.discount}% off`
                          : `₹${coupon.discount} off`}
                        on orders above ₹{coupon.minOrder}
                      </span>
                    </div>
                  ))} */}

                  {offers.length > 0 && (
                    <div className="offers-list">
                      <h3>Available Offers 🎁</h3>
                      {offers.map((offer) => (
                        <div key={offer._id} className="offer-card">
                          <h4>{offer.title}</h4>
                          <p>{offer.description}</p>

                          <div className="offer-details">
                            <strong>Code:</strong> {offer.code}
                            <br />
                            <strong>Discount:</strong>{" "}
                            {offer.discountType === "PERCENTAGE"
                              ? `${offer.discountValue}% off`
                              : `₹${offer.discountValue} off`}
                            {offer.maxDiscountAmount > 0 &&
                              ` (Max ₹${offer.maxDiscountAmount})`}
                            <br />
                            <strong>Min Cart:</strong> ₹{offer.minCartValue}
                          </div>

                          {/* ✅ Show applied scope */}
                          <div className="offer-scope">
                            {offer.categories?.length > 0 && (
                              <p>
                                Applicable on categories:{" "}
                                {offer.categories.join(", ")}
                              </p>
                            )}
                            {offer.brands?.length > 0 && (
                              <p>
                                Applicable on brands: {offer.brands.join(", ")}
                              </p>
                            )}
                            {offer.products?.length > 0 && (
                              <p>
                                Applicable on products:{" "}
                                {offer.products.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                const itemId = item.productId || item._id;
                const itemPrice = parseFloat(
                  item.price?.toString().replace(/[^0-9.]/g, "") || 0
                );
                return (
                  <div key={itemId} className="order-item">
                    <img
                      src={
                        processImageUrl(item?.image) || "/placeholder-image.jpg"
                      }
                      alt={item?.name}
                      className="order-item-image"
                    />
                    <div className="order-item-details">
                      <h4 className="order-item-name">{item?.name}</h4>
                      <div className="order-item-meta">
                        <span className="order-item-qty">
                          Qty: {item?.quantity || 1}
                        </span>
                        <span className="order-item-price">
                          ₹{item?.finalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="order-item-total">
                        {/* Total: ₹{(itemPrice * (item.quantity || 1)).toFixed(2)} */}
                        Total: ₹{item?.productTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{summaryData?.subTotal.toFixed(2) || 0}</span>
              </div>

              {summaryData?.coupon && (
                <div className="price-row discount">
                  <span>Coupon Discount ({summaryData?.coupon || 0})</span>
                  <span>-₹{summaryData?.discount?.toFixed(2) || 0}</span>
                </div>
              )}

              <div className="price-row">
                <span>GST (18%)</span>
                <span>₹{summaryData?.totalGST.toFixed(2) || 0}</span>
              </div>

              {/* <div className="price-row">
                <span>Packaging Charges</span>
                <span>₹{packagingCharge.toFixed(2)}</span>
              </div> */}

              <div className="price-row">
                <span>
                  <Truck size={16} />
                  Delivery Charges
                </span>
                <span
                  className={
                    summaryData?.totalDeliveryCharge === 0 ? "free" : ""
                  }
                >
                  {summaryData?.totalDeliveryCharge === 0
                    ? "FREE"
                    : `₹${summaryData?.totalDeliveryCharge.toFixed(2) || 0}`}
                </span>
              </div>

              {deliveryCharge === 0 && (
                <div className="free-delivery-note">
                  🎉 Free delivery on orders above ₹500
                </div>
              )}
              <div className="price-row total">
                <span>Grand Total</span>
                <span>₹{summaryData?.totalAmount.toFixed(2) || 0}</span>
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
