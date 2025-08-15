/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../../utils/axios";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaStore,
} from "react-icons/fa";
import "./Register.css";
import {
  auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "../../firebase/firebase";
import { trackEvent } from "../../analytics/trackEvent";
import Mall1Logo from "../../images/Mall1.png";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "client",
    firstName: "",
    lastName: "",
    shopownerName: "",
    shopName: "",
    phone: "",
    addressLine: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    subscriptionId: "",
    country: "India",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState(false); // State to store subscription plans
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true); // State for loading subscriptions
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get("/api/subscriptions");
        if (response.data.success) {
          setSubscriptions(response.data.subscriptions);
        } else {
          toast.error(response.data.message);
        }
      } catch (err) {
        toast.error("Failed to fetch subscription plans.");
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const response = await axios.get("/api/location/states");
        if (response.data.success) {
          setStates(response.data.data);
        } else {
          toast.error("Failed to fetch states");
        }
      } catch (err) {
        toast.error("Failed to fetch states");
      } finally {
        setLoadingStates(false);
      }
    };

    fetchSubscriptions();
    fetchStates();
    trackEvent("register_page_view", {
      page_location: window.location.pathname,
    });
  }, []);

  // const handleChange = (e) => {
  //   setError("");
  //   const { name, value } = e.target;
  //   if (name.startsWith("address.")) {
  //     setFormData({
  //       ...formData,
  //       address: {
  //         ...formData.address,
  //         [name.split(".")[1]]: value,
  //       },
  //     });
  //   } else {
  //     setFormData({
  //       ...formData,
  //       [name]: value,
  //     });
  //   }
  // };

  const fetchCities = async (stateName) => {
    setLoadingCities(true);
    try {
      const response = await axios.get(
        `/api/location/cities/${encodeURIComponent(stateName)}`
      );
      if (response.data.success) {
        setCities(response.data.data);
      } else {
        toast.error("Failed to fetch cities");
        setCities([]);
      }
    } catch (err) {
      toast.error("Failed to fetch cities");
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleChange = (e) => {
    setError("");
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // If state changes, fetch cities and reset city selection
    if (name === "state") {
      setCities([]);
      setPincodes([]);
      setFormData((prev) => ({ ...prev, city: "", pincode: "" }));
      if (value) {
        fetchCities(value);
      }
    }

    if (name === "city") {
      setPincodes([]);
      setFormData((prev) => ({ ...prev, pincode: "" }));
    }
  };

  // Fetch cities when state changes or search text changes
  useEffect(() => {
    if (!formData.state) return;

    const fetchCities = async () => {
      try {
        const res = await axios.get(
          `/api/location/cities/${formData.state}`,
          { params: { q: citySearch } } // send query param for search
        );
        setCities(res.data.data || []);
      } catch {
        toast.error("Failed to load cities");
        setCities([]);
      }
    };

    fetchCities();
  }, [formData.state, citySearch]);

  // Fetch pincodes when city changes
  useEffect(() => {
    if (!formData.state || !formData.city) return;

    axios
      .get(`/api/location/pincodes/${formData.state}/${formData.city}`)
      .then((res) => setPincodes(Object.values(res.data.data) || []))
      .catch(() => {
        toast.error("Failed to load pincodes");
        setPincodes([]);
      });
  }, [formData.city]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    trackEvent("register_attempt", {
      email: formData.email,
      role: formData.role,
      location: window.location.pathname,
    });

    // Handle shop owner registration with new onboarding flow
    if (formData.role === "shopowner") {
      try {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Send verification email
        await sendEmailVerification(userCred.user);
        toast.success("Email verification sent. Please check your inbox.");
        
        // Prepare data for backend
        const submitData = {
          ...formData,
          names: formData.shopownerName,
          addressLine: formData.addressLine,
          addressLine2: formData.addressLine2,
        };
        
        const response = await axios.post("/api/auth/register", submitData);
        if (response.data.success) {
          toast.success("Registration successful! Let's set up your business profile.");
          trackEvent("register_success", {
            email: formData.email,
            role: formData.role,
            location: window.location.pathname,
          });

          // Redirect to seller dashboard
          navigate("/seller/dashboard");
        } else {
          setError(response.data.message);
          toast.error(response.data.message);
        }
      } catch (err) {
        trackEvent("register_failed", {
          email: formData.email,
          role: formData.role,
          reason: err.message || err.code,
          location: window.location.pathname,
        });

        console.error("Firebase registration error:", err);
        const errorCode = err.code;

        if (errorCode === "auth/email-already-in-use") {
          toast.error("This email is already registered. Try logging in.");
        } else if (errorCode === "auth/invalid-email") {
          toast.error("Invalid email address. Please check your email.");
        } else if (errorCode === "auth/weak-password") {
          toast.error("Password is too weak. Must be at least 6 characters.");
        } else if (errorCode === "auth/network-request-failed") {
          toast.error("Network error. Please check your connection.");
        } else if (errorCode === "auth/operation-not-allowed") {
          toast.error(
            "Email/password sign-up is not allowed. Enable it in Firebase Authentication settings."
          );
        } else {
          toast.error(
            `Registration failed: ${err.message || "Try again later."}`
          );
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Send verification email
      await sendEmailVerification(userCred.user);
      toast.success("Email verification sent. Please check your inbox.");
      // Before sending formData to backend
      const submitData = {
        ...formData,
        names: `${formData.firstName} ${formData.lastName}`.trim(),
        addressLine: formData.addressLine,
        addressLine2: formData.addressLine2,
        country: "India"
      };
      const response = await axios.post("/api/auth/register", submitData);
      if (response.data.success) {
        toast.success("Registration successful! Please login.");
        trackEvent("register_success", {
          email: formData.email,
          role: formData.role,
          location: window.location.pathname,
        });

        navigate("/login");
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      // const errorMessage =
      //   err.response?.data?.message || "Registration failed. Please try again.";
      // setError(errorMessage);
      // toast.error(errorMessage);

      trackEvent("register_failed", {
        email: formData.email,
        role: formData.role,
        reason: err.message || err.code,
        location: window.location.pathname,
      });

      console.error("Firebase registration error:", err);

      const errorCode = err.code;

      if (errorCode === "auth/email-already-in-use") {
        toast.error("This email is already registered. Try logging in.");
      } else if (errorCode === "auth/invalid-email") {
        toast.error("Invalid email address. Please check your email.");
      } else if (errorCode === "auth/weak-password") {
        toast.error("Password is too weak. Must be at least 6 characters.");
      } else if (errorCode === "auth/network-request-failed") {
        toast.error("Network error. Please check your connection.");
      } else if (errorCode === "auth/operation-not-allowed") {
        toast.error(
          "Email/password sign-up is not allowed. Enable it in Firebase Authentication settings."
        );
      } else {
        toast.error(
          `Registration failed: ${err.message || "Try again later."}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Left Side - Logo and Graphics */}
      <div className="register-visual-section">
        <div className="logo-container">
          <img 
            src={Mall1Logo} 
            alt="EMW Logo" 
            className="main-logo"
          />
        </div>
        
        <div className="visual-content">
          <div className="welcome-text">
            <h1>Welcome to EMW</h1>
            <p>Your Gateway to Digital Commerce</p>
          </div>
          
          <div className="feature-highlights">
            <div className="feature-item">
              <div className="feature-icon">
                <FaStore />
              </div>
              <div className="feature-text">
                <h3>Build Your Store</h3>
                <p>Create and manage your online presence</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <FaUser />
              </div>
              <div className="feature-text">
                <h3>Connect with Customers</h3>
                <p>Reach millions of potential buyers</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="feature-text">
                <h3>Local & Global Reach</h3>
                <p>Expand your business boundaries</p>
              </div>
            </div>
          </div>
          
          <div className="decorative-elements">
            <div className="floating-shape shape-1"></div>
            <div className="floating-shape shape-2"></div>
            <div className="floating-shape shape-3"></div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Registration Form */}
      <div className="register-form-section">
        <div className="register-card">
          <div className="register-header">
            <div className="header-icon">
              <FaUser className="register-icon" />
            </div>
            <h2>Create Your Account</h2>
            <p>Join thousands of successful businesses</p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <div className="input-group">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input role-select"
              >
                <option value="client">Client</option>
                <option value="shopowner">Shop Owner</option>
              </select>
            </div>
          </div>

          {formData.role === "client" || formData.role === "admin" ? (
            <div className="form-row">
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    name="shopownerName"
                    placeholder="Seller name"
                    value={formData.shopownerName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    name="shopName"
                    placeholder="Shop Name"
                    value={formData.shopName}
                    onChange={handleChange}
                    required={formData.role === "shopowner"}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <div className="input-group">
                {/* <FaEnvelope className="input-icon" /> */}
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-group">
                {/* <FaLock className="input-icon" /> */}
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  minLength="6"
                />
              </div>
            </div>
          </div>

          <div className="form-row single-column">
            <div className="form-group">
              <div className="input-group">
                {/* <FaPhone className="input-icon" /> */}
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="form-input"
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </div>

          <div className="form-row single-column">
            <div className="form-group">
              <div className="input-group">
                <input
                  type="text"
                  name="addressLine"
                  placeholder="Address Line 1 (House/Building/Street)"
                  value={formData.addressLine}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-row single-column">
            <div className="form-group">
              <div className="input-group">
                <input
                  type="text"
                  name="addressLine2"
                  placeholder="Address Line 2 (Area/Locality) - Optional"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <div className="input-group">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="form-input"
                  disabled={loadingStates}
                >
                  <option value="">Select State</option>
                  {states.map((state, index) => (
                    <option key={index} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="input-group">
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="form-input"
                  disabled={loadingCities || !formData.state}
                >
                  <option value="">Select City</option>
                  {cities.map((city, index) => (
                    <option key={index} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>



          <div className="form-group">
            <div className="input-group">
              <select
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                disabled={!formData.city}
                className="form-input"
              >
                <option value="">Select Pincode</option>
                {[...new Set(pincodes)].map((p, index) => (
                  <option key={index} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* {formData.role === "shopowner" && (
            <div className="form-group">
              <div className="input-group">
                <select
                  name="subscriptionId"
                  value={formData.subscriptionId}
                  onChange={handleChange}
                  required
                  className="form-input"
                  disabled={loadingSubscriptions}
                >
                  <option value="">Select Subscription Plan</option>
                  {subscriptions && subscriptions.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} - ₹{sub.price}/{sub.duration}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )} */}

          <button
            type="submit"
            className={`register-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

            <div className="register-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="login-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
