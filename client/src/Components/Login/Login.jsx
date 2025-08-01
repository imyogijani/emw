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
              redirectBasedOnRole(userObj.role);
            }
          }
        } catch (error) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    };
    checkAuth();
  }, [customerOnly, returnUrl, navigate]);

  const redirectBasedOnRole = (role) => {
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "shopowner") {
      navigate("/seller/dashboard");
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
          redirectBasedOnRole(response.data.user.role);
        }
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FaUserCircle className="login-icon" />
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
  );
};

export default Login;
