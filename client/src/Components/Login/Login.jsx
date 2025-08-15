/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../../utils/axios";
import { FaUserCircle } from "react-icons/fa";
import "./Login.css";
import { CloudCog } from "lucide-react";
import { auth } from "../../firebase/firebase"; // Make sure Firebase is set up
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { trackEvent } from "../../analytics/trackEvent";
import Mall1Logo from "../../images/Mall1.png";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if login is for customer-only checkout
  const customerOnly = location.state?.customerOnly;
  const returnUrl = location.state?.returnUrl || "/";

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        try {
          const response = await axios.get("/api/auth/verify-token");
          if (response.data.success) {
            const userObj = JSON.parse(user);
            if (customerOnly) {
              if (userObj.role === "client") {
                navigate(returnUrl);
              } else {
                setError(
                  "Only customers can checkout. Please login/register as a customer."
                );
              }
            } else {
              redirectBasedOnRole(userObj.role, userObj);
            }
          }
        } catch (error) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    };
    checkAuth();

    trackEvent("page_view", {
      page_title: "Login",
      page_location: window.location.pathname,
    });
  }, [customerOnly, returnUrl, navigate]);

  const redirectBasedOnRole = (role, userObj) => {
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "shopowner") {
      // Check if seller profile is completed (e.g., sellerId exists and has required fields)
      if (!userObj?.sellerId || !userObj.sellerId.shopName || !userObj.sellerId.categories || userObj.sellerId.categories.length === 0) {
        navigate("/seller/onboarding");
      } else {
        navigate("/seller/dashboard");
      }
    } else {
      navigate("/");
    }
  };

  const handleChange = (e) => {
    setError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await trackEvent("login_attempt", {
      email: formData.email,
      location: window.location.pathname,
    });

    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // Step 1: Firebase check
      // const userCred = await signInWithEmailAndPassword(
      //   auth,
      //   formData.email,
      //   formData.password
      // );

      // // Step 2: Check email verification
      // if (!userCred.user.emailVerified) {
      //   await sendEmailVerification(userCred.user); //  Resend email
      //   toast.error("Please verify your email. Verification email resent.");
      //   setIsLoading(false);
      //   return;
      // }

      const response = await axios.post("/api/auth/login", formData);
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        console.log(
          "user data",
          localStorage.getItem("user", JSON.stringify(response.data.user))
        );
        console.log(
          "user token",
          localStorage.getItem("token", JSON.stringify(response.data.token))
        );

        document.cookie = `token=${response.data.token}; path=/; max-age=86400; secure; samesite=strict`;
        toast.success("Welcome back! 👋");
        if (customerOnly) {
          if (response.data.user.role === "client") {
            navigate(returnUrl);
          } else {
            setError(
              "Only customers can checkout. Please login/register as a customer."
            );
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } else {
          redirectBasedOnRole(response.data.user.role, response.data.user);
        }

        await trackEvent("login", {
          method: "email",
          role: response.data.user.role,
          location: window.location.pathname,
        });
      } else {
        const errorMsg = response.data.message || "Login failed";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      let errorMsg = "Login failed. Please try again.";

      if (err.code === "auth/user-not-found") {
        errorMsg = "No account found with this email.";
      } else if (err.code === "auth/wrong-password") {
        errorMsg = "Incorrect password. Please try again.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Invalid email format.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Too many login attempts. Try again later.";
      } else if (err.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
      setError(errorMsg);
      setFormData((prev) => ({
        ...prev,
        password: "",
      }));

      await trackEvent("login_failed", {
        reason: errorMsg,
        email: formData.email,
        location: window.location.pathname,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Visual Section - Branding */}
      <div className="login-visual-section">
        <div className="welcome-content">
          <div className="logo-container">
            <img
              src={Mall1Logo}
              alt="EMW Logo"
              className="main-logo"
            />
          </div>
          <div className="welcome-text">
            <h1>Welcome Back!</h1>
            <p>Sign in to continue your journey with us</p>
          </div>

          <div className="feature-highlights">
            <div className="feature-item">
              <div className="feature-icon">
                <FaUserCircle />
              </div>
              <div className="feature-text">
                <h3>Secure Access</h3>
                <p>Your account is protected with advanced security</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <CloudCog />
              </div>
              <div className="feature-text">
                <h3>Cloud Integration</h3>
                <p>Access your data from anywhere, anytime</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <FaUserCircle />
              </div>
              <div className="feature-text">
                <h3>Personalized Experience</h3>
                <p>Tailored features just for you</p>
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

      {/* Right Side - Login Form */}
      <div className="login-form-section">
        <div className="login-card">
          <div className="login-header">
            <div className="header-icon">
              <FaUserCircle className="login-icon" />
            </div>
            <h2>Welcome Back</h2>
            <p>Please enter your details to sign in</p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`login-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <div className="login-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="register-link">
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
