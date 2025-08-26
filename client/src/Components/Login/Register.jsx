/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { showErrorToast } from "../../utils/errorHandler";
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
import { requestPushPermission } from "../../utils/pushNotification";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/api/settings");
        localStorage.setItem(
          "systemSettings",
          JSON.stringify(res.data.settings)
        );
        // console.log("⚙️ Loaded system settings:", res.data.settings);
      } catch (err) {
        console.error("❌ Failed to fetch system settings:", err);
      }
    };
    fetchSettings();
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

    // Basic validations
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      setError("Please enter a valid 10-digit phone number");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    trackEvent("register_attempt", {
      email: formData.email,
      location: window.location.pathname,
    });

    try {
      // STEP 1: Call backend first
      const submitData = {
        ...formData,
        names: `${formData.firstName} ${formData.lastName}`.trim(),
      };
      const response = await axios.post("/api/auth/register", submitData);

      if (!response.data.success) {
        toast.error(response.data.message);
        setError(response.data.message);
        setIsLoading(false);
        return;
      }

      // // STEP 2: Only now create Firebase user
      // const userCred = await createUserWithEmailAndPassword(
      //   auth,
      //   formData.email,
      //   formData.password
      // );

      // //  NEW: Check settings before sending email
      // const systemSettings = JSON.parse(localStorage.getItem("systemSettings"));
      // console.log("⚙️ System settings in frontend:", systemSettings);

      // // Send verification email (only for non-admin)
      // if (submitData.role !== "admin") {
      //   await sendEmailVerification(userCred.user);
      //   toast.success("Email verification sent. Please check your inbox.");
      // }

      const systemSettings = JSON.parse(localStorage.getItem("systemSettings"));
      // console.log("⚙️ System settings:", systemSettings);

      let requiresVerification = false;

      // --- Logic match backend ---
      if (submitData.role === "admin") {
        requiresVerification = false;
      } else if (systemSettings?.emailVerificationEnabled) {
        // master ON → sab roles verify honge
        requiresVerification = true;
      } else {
        // master OFF → role-wise check
        if (submitData.role === "client") {
          requiresVerification = systemSettings.customerEmailVerification;
        } else if (submitData.role === "shopowner") {
          requiresVerification = systemSettings.sellerEmailVerification;
        }
      }

      // STEP 3: Firebase user create only if verification required
      if (requiresVerification) {
        // console.log("📩 Email verification required → Firebase auth create");

        const userCred = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await sendEmailVerification(userCred.user);
        toast.success("📩 Verification email sent! Please check your inbox.");
      } else {
        // console.log("✅ Email verification not required → skipping Firebase");
      }
      const user = response.data.user;
      await requestPushPermission(user._id);

      trackEvent("register_success", {
        email: formData.email,
        location: window.location.pathname,
      });

      toast.success(
        "Registration successful! Please check your email to verify."
      );
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      trackEvent("register_failed", {
        email: formData.email,
        reason: err.message || err.code,
        location: window.location.pathname,
      });

      const ERROR_CODE = err.code;
      if (err.code === "auth/email-already-in-use") {
        showErrorToast(
          "This email is already registered. Try logging in.",
          "Registration Error",
          {
            errorCode: err.code,
            email: formData.email,
          }
        );
      } else {
        showErrorToast(err, "Registration failed", {
          errorCode: err.code,
          operation: "createUserWithEmailAndPassword",
          email: formData.email,
        });
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

            {/* phone Number */}
            <div className="form-group">
              <div className="input-group">
                {/* <FaPhone className="input-icon" /> */}
                <input
                  type="tel"
                  name="phone"
                  placeholder="phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="form-input"
                  pattern="[6-9]\d{9}"
                  maxLength="10"
                  title="Please enter a valid 10-digit phone number starting with 6-9"
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
                  className="btn btn-small btn-secondary password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  <span className="sparkle">
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
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
                  className="btn btn-small btn-secondary password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  <span className="sparkle">
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-large btn-primary ${
                isLoading ? "loading" : ""
              }`}
              disabled={isLoading}
            >
              <span className="text">
                {isLoading ? "Creating Account..." : "Create Account"}
              </span>
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
