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
    address: "",
    subscriptionId: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState(false); // State to store subscription plans
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true); // State for loading subscriptions
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

    fetchSubscriptions();
  }, []);

  const handleChange = (e) => {
    setError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.role === "shopowner") {
      // Redirect to pricing page with form data
      navigate("/pricing", { state: { formData } });
      setIsLoading(false);
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
      };
      const response = await axios.post("/api/auth/register", submitData);
      if (response.data.success) {
        toast.success("Registration successful! Please login.");
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
      <div className="register-card">
        <div className="register-header">
          <FaStore className="register-icon" />
          <h2>Create Account</h2>
          <p>Please fill in your information to register</p>
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
            <>
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
            </>
          ) : (
            <>
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    name="shopownerName"
                    placeholder="Shop Owner Name"
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
            </>
          )}

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

          <div className="form-group">
            <div className="input-group">
              {/* <FaMapMarkerAlt className="input-icon" /> */}
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
                className="form-input"
              />
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
  );
};

export default Register;
