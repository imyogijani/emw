/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./Register.css";

const Pricing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [billingType, setBillingType] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // Get registration form data from navigation state
  const formData = location.state?.formData;

  useEffect(() => {
    if (!formData) {
      navigate("/register");
      return;
    }
    const fetchPlans = async () => {
      try {
        const res = await axios.get("/api/subscriptions");
        if (res.data.success) {
          setPlans(res.data.subscriptions);
          console.log(
            "Pricing Page - Get subscriptions Plan-",
            res.data.subscriptions
          );
        } else {
          setError(res.data.message || "Failed to load plans");
        }
      } catch (err) {
        setError("Failed to fetch subscription plans.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [formData, navigate]);

  const handleBillingToggle = (type) => setBillingType(type);

  const handleSelectPlan = async (planId) => {
    setSubmitting(true);
    setError("");
    try {
      const submitData = {
        ...formData,
        subscriptionId: planId,
        billingType,
        names:
          formData.shopownerName ||
          `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
      };
      const response = await axios.post("/api/auth/register", submitData);
      if (response.data.success) {
        toast.success("Registration successful! Please login.");
        navigate("/login");
      } else {
        setError(response.data.message || "Registration failed");
        toast.error(response.data.message || "Registration failed");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container pricing-page">
      <div className="register-card pricing-card-wrapper">
        <div className="register-header">
          <h2>Plans and Pricing</h2>
          <p>Choose a subscription plan to continue your registration</p>
          <div className="pricing-toggle-row">
            <button
              className={`role-select${
                billingType === "monthly" ? " active" : ""
              }`}
              onClick={() => handleBillingToggle("monthly")}
              disabled={billingType === "monthly"}
            >
              Monthly
            </button>
            <button
              className={`role-select${
                billingType === "annual" ? " active" : ""
              }`}
              onClick={() => handleBillingToggle("annual")}
              disabled={billingType === "annual"}
            >
              Annual <span className="save-badge">Save 35%</span>
            </button>
          </div>
        </div>
        <button
          className="back-to-register-btn"
          onClick={() => navigate("/register")}
        >
          ← Back to Registration
        </button>
        {loading ? (
          <p>Loading plans...</p>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <div className="pricing-cards-row">
            {plans.map((plan, idx) => (
              <div
                key={plan._id}
                className={`pricing-card${
                  selectedPlanId === plan._id ? " selected" : ""
                }`}
                style={{
                  background: "#fff",
                  color: "#18181b",
                  border:
                    selectedPlanId === plan._id
                      ? "2.5px solid #e48a00"
                      : "2px solid #eee",
                }}
              >
                {plan.planName.toLowerCase().includes("pro") && (
                  <span className="popular-badge">Popular</span>
                )}
                <h3>{plan.planName}</h3>
                <div className="plan-price">
                  {plan.pricing.monthly === 0 ? (
                    <span>Free</span>
                  ) : (
                    <>
                      ₹
                      {billingType === "annual"
                        ? Math.round(plan.pricing.monthly * 12 * 0.65)
                        : plan.pricing.monthly}
                      <span className="plan-duration">
                        / {billingType === "annual" ? "year" : "month"}
                      </span>
                    </>
                  )}
                </div>
                <ul className="plan-features">
                  {plan.includedFeatures &&
                    plan.includedFeatures.map((f, i) => (
                      <li key={i}>
                        <span className="feature-check">✔</span> {f}
                      </li>
                    ))}
                </ul>
                <button
                  className="register-button select-plan-btn"
                  disabled={submitting}
                  onClick={() => {
                    setSelectedPlanId(plan._id);
                    handleSelectPlan(plan._id);
                  }}
                  style={{
                    background: "var(--primary-color)",
                    color: "#fff",
                  }}
                >
                  {submitting && selectedPlanId === plan._id
                    ? "Processing..."
                    : plan.monthlyPrice === 0
                    ? "Continue with Free"
                    : `Select ${plan.planName}`}
                </button>

                {/* <h1>Hello Meet</h1> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
