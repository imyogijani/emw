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

  const handlePlanSelection = (planId) => {
    setSelectedPlanId(planId);
  };

  const handleSubscription = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a plan");
      return;
    }

    setSubmitting(true);
    try {
      const registrationData = {
        ...formData,
        subscriptionPlanId: selectedPlanId,
        billingType: billingType
      };

      const res = await axios.post("/api/auth/register", registrationData);
      
      if (res.data.success) {
        toast.success("Registration successful!");
        navigate("/login");
      } else {
        setError(res.data.message || "Registration failed");
        toast.error(res.data.message || "Registration failed");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipPricing = () => {
    navigate("/register", { 
      state: { 
        ...location.state, 
        skipPricing: true 
      } 
    });
  };

  if (loading) {
    return (
      <div className="pricing-container">
        <div className="loading-spinner">Loading plans...</div>
      </div>
    );
  }

  if (error && plans.length === 0) {
    return (
      <div className="pricing-container">
        <div className="error-message">
          <h2>Error Loading Plans</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/register")} className="btn-secondary">
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Select a subscription plan to complete your registration</p>
      </div>

      <div className="billing-toggle">
        <button
          className={billingType === "monthly" ? "active" : ""}
          onClick={() => setBillingType("monthly")}
        >
          Monthly
        </button>
        <button
          className={billingType === "yearly" ? "active" : ""}
          onClick={() => setBillingType("yearly")}
        >
          Yearly
        </button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`plan-card ${selectedPlanId === plan._id ? "selected" : ""}`}
            onClick={() => handlePlanSelection(plan._id)}
          >
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">
                  {billingType === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span className="period">/{billingType === "monthly" ? "mo" : "yr"}</span>
              </div>
            </div>
            
            <div className="plan-features">
              <ul>
                {plan.features?.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            <button
              className={`select-plan-btn ${selectedPlanId === plan._id ? "selected" : ""}`}
              onClick={() => handlePlanSelection(plan._id)}
            >
              {selectedPlanId === plan._id ? "Selected" : "Select Plan"}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="pricing-actions">
        <button
          onClick={handleSkipPricing}
          className="btn-secondary"
          disabled={submitting}
        >
          Skip for Now
        </button>
        <button
          onClick={handleSubscription}
          className="btn-primary"
          disabled={!selectedPlanId || submitting}
        >
          {submitting ? "Processing..." : "Complete Registration"}
        </button>
      </div>
    </div>
  );
};

export default Pricing;
