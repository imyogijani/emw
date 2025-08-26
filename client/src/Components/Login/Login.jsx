/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../utils/errorHandler";
import axios from "../../utils/axios";
import { FaUserCircle } from "react-icons/fa";
import "./Login.css";
import { CloudCog } from "lucide-react";
import LoadingTransition from "../LoadingTransition/LoadingTransition";
import { navigateByRole, navigateWithTransition, getReturnUrl, clearReturnUrl } from "../../utils/navigationUtils";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth, createUserWithEmailAndPassword } from "../../firebase/firebase";
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

  const firebaseLoginOrCreate = async (email, password) => {
    try {
      // Pehle login try kar
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await userCred.user.reload();

      if (!userCred.user.emailVerified) {
        // Agar verified nahi hai toh verification bhej
        await sendEmailVerification(userCred.user);
        throw new Error("Please verify your email. Verification link resent.");
      }

      return userCred.user; // verified user return kar
    } catch (error) {
      // console.log("Firebase Error:", error.code);

      // Yahan dono case handle kar le
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        // User exist nahi karta → create kar
        const newUserCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await sendEmailVerification(newUserCred.user);
        throw new Error(
          "Account created in Firebase. Verification email sent to your inbox."
        );
      } else {
        // koi aur error toh wahi throw kar
        throw error;
      }
    }
  };

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

  const redirectBasedOnRole = (role, userObj, loginResponse) => {
    navigateByRole(navigate, role, userObj, loginResponse);
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
      showErrorToast("Please fill in all fields", "Login - Form Validation");
      setError("Please fill in all fields");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showErrorToast("Please enter a valid email address", "Login - Form Validation");
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

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      let response;

      // --- Step 1: Load system settings ---
      const systemSettings = JSON.parse(localStorage.getItem("systemSettings"));
      // console.log("⚙️ System settings at login:", systemSettings);

      // --- Admin skip ---
      if (formData.email === "yogij@mail.com") {
        // Call backend API directly for admin
        response = await axios.post("/api/auth/login", formData);
      } else if (
        formData.email === "demo@seller.com" &&
        formData.password === "12345678"
      ) {
        // Direct backend login
        response = await axios.post("/api/auth/login", formData);
      } else {
        // --- Normal users ---

        let requiresVerification = false;

        if (systemSettings?.emailVerificationEnabled) {
          // Master ON → sab non-admin users verify honge
          requiresVerification = true;
        } else {
          // Master OFF → role-based logic
          if (formData.role === "client") {
            requiresVerification = systemSettings.customerEmailVerification;
          } else if (formData.role === "shopowner") {
            requiresVerification = systemSettings.sellerEmailVerification;
          }
        }
        if (requiresVerification) {
          // console.log("📩 Email verification required → Firebase login");

          // // Firebase login
          // const userCred = await signInWithEmailAndPassword(
          //   auth,
          //   formData.email,
          //   formData.password
          // );

          // // Reload user
          // await userCred.user.reload();
          // const refreshedUser = auth.currentUser;

          // // Email check
          // if (!refreshedUser.emailVerified) {
          //   await sendEmailVerification(refreshedUser);
          //   toast.error("Please verify your email. Verification email resent.");
          //   setIsLoading(false);
          //   return;
          // }

          // // Backend login after Firebase verified
          // response = await axios.post("/api/auth/login", formData);

          try {
            const fbUser = await firebaseLoginOrCreate(
              formData.email,
              formData.password
            );

            // Agar yahan tak aaya to matlab verified hai
            response = await axios.post("/api/auth/login", formData);
          } catch (fbErr) {
            showErrorToast(fbErr.message, "Login - Firebase Authentication");
            setIsLoading(false);
            return;
          }
        } else {
          // console.log("✅ Email verification not required → skipping Firebase");
          // Direct backend login
          response = await axios.post("/api/auth/login", formData);
        }
      }

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        document.cookie = `token=${response.data.token}; path=/; max-age=86400; secure; samesite=strict`;
        showSuccessToast(response.data.message || "Welcome back! 👋", "Login - Success");

        // Admin redirect
        if (response.data.redirectToAdminDashboard) {
          navigate("/admin/dashboard");
          return;
        }

        // //  Skip onboarding if demoAccess is true
        if (response.data.demoAccess || response.data.user.demoAccess) {
          if (response.data.user.role === "shopowner") {
            navigate("/seller/dashboard");
          } else {
            navigate("/");
          }
          return;
        }

        // if (response.data.demoAccess || response.data.user.demoAccess) {
        //   if (!response.data.user.role) {
        //     // if role null is empty hai
        //     navigate("/onboarding");
        //   } else if (response.data.user.role === "shopowner") {
        //     navigate("/seller/dashboard");
        //   } else {
        //     navigate("/");
        //   }
        //   return;
        // }
        // Onboarding redirect for non-demo users
        if (response.data.requiresOnboarding) {
          navigateWithTransition(navigate, "/onboarding", { replace: true });
          return;
        }

        if (customerOnly) {
          if (response.data.user.role === "client") {
            navigateWithTransition(navigate, returnUrl, { replace: true });
            clearReturnUrl();
          } else {
            setError(
              "Only customers can checkout. Please login/register as a customer."
            );
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } else {
          if (response.data.user.role) {
            redirectBasedOnRole(
              response.data.user.role,
              response.data.user,
              response.data
            );
          } else {
            navigateWithTransition(navigate, "/onboarding", { replace: true });
          }
        }

        await trackEvent("login", {
          method: "email",
          role: response.data.user.role || "unknown",
          location: window.location.pathname,
        });
      } else {
        const errorMsg = response.data.message || "Login failed";
        showErrorToast(errorMsg, "Login - Backend Error");
        setError(errorMsg);
      }
    } catch (err) {
      let errorMsg = "Login failed. Please try again.";

      if (err.response && err.response.data) {
        errorMsg = err.response.data.message;
      } else if (err.code === "auth/user-not-found") {
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

      showErrorToast(errorMsg, "Login - Authentication Error");
      setError(errorMsg);
      setFormData((prev) => ({ ...prev, password: "" }));

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
            <img src={Mall1Logo} alt="EMW Logo" className="main-logo" />
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
              className={`btn btn-large btn-primary ${
                isLoading ? "loading" : ""
              }`}
              disabled={isLoading}
            >
              <span className="text">
                {isLoading ? "Signing in..." : "Sign In"}
              </span>
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
      
      {/* Loading Overlay */}
      <LoadingTransition 
        isLoading={isLoading} 
        message="Signing you in..." 
        overlay={true}
      />
    </div>
  );
};

export default Login;
