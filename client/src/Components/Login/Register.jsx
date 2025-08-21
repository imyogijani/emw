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
  FaEye,
  FaEyeSlash,
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
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent("register_page_view", {
      page_location: window.location.pathname,
    });
  }, []);

  const handleChange = (e) => {
    setError("");
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate mobile number
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      toast.error("Please enter a valid 10-digit mobile number");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      toast.error("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    trackEvent("register_attempt", {
      email: formData.email,
      location: window.location.pathname,
    });

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
        names: `${formData.firstName} ${formData.lastName}`.trim(),
      };

      const response = await axios.post("/api/auth/register", submitData);
      if (response.data.success) {
        trackEvent("register_success", {
          email: formData.email,
          location: window.location.pathname,
        });

        toast.success(
          "Registration successful! Please check your email for verification, then login."
        );
        navigate("/login");
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      trackEvent("register_failed", {
        email: formData.email,
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
          <img src={Mall1Logo} alt="EMW Logo" className="main-logo" />
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
              {/* <FaUser className="register-icon" /> */}
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
            {/* First Name */}
            <div className="form-group">
              <div className="input-group">
                {/* <FaUser className="input-icon" /> */}
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

            {/* Last Name */}
            <div className="form-group">
              <div className="input-group">
                {/* <FaUser className="input-icon" /> */}
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

            {/* Email Address */}
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

            {/* Mobile Number */}
            <div className="form-group">
              <div className="input-group">
                {/* <FaPhone className="input-icon" /> */}
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  className="form-input"
                  pattern="[6-9]\d{9}"
                  maxLength="10"
                  title="Please enter a valid 10-digit mobile number starting with 6-9"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="input-group">
                {/* <FaLock className="input-icon" /> */}
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <div className="input-group">
                {/* <FaLock className="input-icon" /> */}
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="form-input"
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

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
