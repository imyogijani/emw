import React, { useState, useEffect } from "react";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./OnboardingForms.css";
import { FaSignOutAlt, FaRegClock } from "react-icons/fa";

const SellerOnboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState({
    // Step 1 - Basic Details
    shopName: "",
    categories: [],
    brands: [],
    shopLogo: null,
    logoPreview: null,

    // Step 2 - Shop Timing
    workingHours: {
      monday: { isOpen: true, open: "09:00", close: "18:00" },
      tuesday: { isOpen: true, open: "09:00", close: "18:00" },
      wednesday: { isOpen: true, open: "09:00", close: "18:00" },
      thursday: { isOpen: true, open: "09:00", close: "18:00" },
      friday: { isOpen: true, open: "09:00", close: "18:00" },
      saturday: { isOpen: true, open: "09:00", close: "18:00" },
      sunday: { isOpen: false, open: "09:00", close: "18:00" },
    },

    // Step 3 - Subscription
    selectedPlan: null,
  });

  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  // Subscription plans data
  const subscriptionPlans = [
    {
      id: "basic",
      name: "Basic",
      price: "₹499/month",
      features: [
        "List up to 50 products",
        "Basic analytics",
        "Standard support",
        "Single location",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: "₹999/month",
      features: [
        "Unlimited products",
        "Advanced analytics",
        "Priority support",
        "Multiple locations",
        "Custom branding",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "₹1999/month",
      features: [
        "Everything in Premium",
        "API access",
        "Dedicated account manager",
        "Custom development",
        "24/7 support",
      ],
    },
  ];

  // Fetch categories and brands on component mount
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch from new server endpoint for shop categories
      const response = await axios.get("/api/shop/categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get("/api/brands");
      setBrands(response.data.brands || []);
    } catch (error) {
      toast.error("Failed to fetch brands");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        shopLogo: file,
        logoPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleMultiSelect = (e, field) => {
    const values = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData({ ...formData, [field]: values });
  };

  // Remove from selected categories/brands with animation
  const handleRemoveSelected = (field, id) => {
    // Animate tag removal
    const tagEl = document.getElementById(`${field}-tag-${id}`);
    if (tagEl) {
      tagEl.classList.add("removing");
      setTimeout(() => {
        setFormData({
          ...formData,
          [field]: formData[field].filter((item) => item !== id),
        });
      }, 200);
    } else {
      setFormData({
        ...formData,
        [field]: formData[field].filter((item) => item !== id),
      });
    }
  };

  const handleTimeChange = (day, field, value) => {
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  const handleDayToggle = (day) => {
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          isOpen: !formData.workingHours[day].isOpen,
        },
      },
    });
  };

  const handlePlanSelect = (planId) => {
    setFormData({ ...formData, selectedPlan: planId });
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.shopName) {
          toast.error("Shop name is required");
          return false;
        }
        if (formData.categories.length === 0) {
          toast.error("Please select at least one category");
          return false;
        }
        if (!formData.shopLogo) {
          toast.error("Shop logo is required");
          return false;
        }
        break;
      case 2:
        // At least one day should be open
        const hasOpenDay = Object.values(formData.workingHours).some(
          (day) => day.isOpen
        );
        if (!hasOpenDay) {
          toast.error("Please select at least one working day");
          return false;
        }
        break;
      case 3:
        if (!formData.selectedPlan) {
          toast.error("Please select a subscription plan");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("shopName", formData.shopName);
      formDataToSend.append("categories", JSON.stringify(formData.categories));
      formDataToSend.append("brands", JSON.stringify(formData.brands));
      formDataToSend.append(
        "workingHours",
        JSON.stringify(formData.workingHours)
      );
      formDataToSend.append("subscriptionPlan", formData.selectedPlan);
      if (formData.shopLogo) {
        formDataToSend.append("shopLogo", formData.shopLogo);
      }

      await axios.post("/api/seller/complete-profile", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profile completed successfully!");
      // Redirect to seller dashboard or appropriate page
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to complete profile"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fix: Add to selected on dropdown click, clear input, and prevent duplicate selection
  const handleCategoryDropdownClick = (catId) => {
    if (!formData.categories.includes(catId)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, catId],
        categoryInput: "",
        categoryInputFocused: false,
      });
    }
  };

  const handleBrandDropdownClick = (brandId) => {
    if (!formData.brands.includes(brandId)) {
      setFormData({
        ...formData,
        brands: [...formData.brands, brandId],
        brandInput: "",
        brandInputFocused: false,
      });
    }
  };

  // Get seller name from localStorage
  let sellerName = "Seller";
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    sellerName = user?.names || user?.shopownerName || user?.shopName || "Seller";
  } catch {}

  const renderBasicDetailsForm = () => (
    <div className="form-step">
      {/* Logout button top right */}
      <button
        className="logout-btn-onboarding"
        onClick={handleLogout}
      >
        <FaSignOutAlt /> Logout
      </button>
      <h2 className="step-title">Basic Details</h2>
      <p className="step-description">
        Let's get started with your shop's basic information
      </p>

      <div className="form-group">
        <label className="form-label">Shop Logo</label>
        <div className="logo-upload">
          <div className="logo-preview">
            {formData.logoPreview ? (
              <img src={formData.logoPreview} alt="Shop logo preview" />
            ) : (
              <span>Upload Logo</span>
            )}
          </div>
          <input
            type="file"
            id="logo"
            accept="image/*"
            onChange={handleLogoChange}
            style={{ display: "none" }}
          />
          <label htmlFor="logo" className="logo-upload-btn">
            Choose File
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Shop Name</label>
        <input
          type="text"
          className="form-input"
          value={formData.shopName}
          onChange={(e) =>
            setFormData({ ...formData, shopName: e.target.value })
          }
          placeholder="Enter your shop name"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Categories</label>
        <div className="multi-select-tags">
          <input
            type="text"
            className="form-input"
            placeholder="Type to filter categories..."
            value={formData.categoryInput || ""}
            onChange={(e) =>
              setFormData({ ...formData, categoryInput: e.target.value })
            }
            onFocus={() =>
              setFormData({ ...formData, categoryInputFocused: true })
            }
            onBlur={() =>
              setTimeout(
                () =>
                  setFormData({ ...formData, categoryInputFocused: false }),
                200
              )
            }
          />
          <div className="selected-tags">
            {formData.categories.map((catId) => {
              const cat = categories.find((c) => c._id === catId);
              return cat ? (
                <span className="tag" id={`categories-tag-${catId}`} key={catId}>
                  {cat.name}
                  <button
                    type="button"
                    className="remove-tag"
                    onClick={() => handleRemoveSelected("categories", catId)}
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
          {formData.categoryInputFocused && (
            <div className="dropdown-list">
              {categories
                .filter(
                  (cat) =>
                    (!formData.categoryInput ||
                      cat.name
                        .toLowerCase()
                        .includes(formData.categoryInput.toLowerCase())) &&
                    !formData.categories.includes(cat._id)
                )
                .map((cat) => (
                  <div
                    key={cat._id}
                    className="dropdown-item"
                    onMouseDown={() => handleCategoryDropdownClick(cat._id)}
                  >
                    {cat.name}
                  </div>
                ))}
              {categories.filter(
                (cat) =>
                  (!formData.categoryInput ||
                    cat.name
                      .toLowerCase()
                      .includes(formData.categoryInput.toLowerCase())) &&
                  !formData.categories.includes(cat._id)
              ).length === 0 && (
                <div className="dropdown-item no-match">
                  No categories found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Brands</label>
        <div className="multi-select-tags">
          <input
            type="text"
            className="form-input"
            placeholder="Type to filter brands..."
            value={formData.brandInput || ""}
            onChange={(e) =>
              setFormData({ ...formData, brandInput: e.target.value })
            }
            onFocus={() =>
              setFormData({ ...formData, brandInputFocused: true })
            }
            onBlur={() =>
              setTimeout(
                () =>
                  setFormData({ ...formData, brandInputFocused: false }),
                200
              )
            }
          />
          <div className="selected-tags">
            {formData.brands.map((brandId) => {
              const brand = brands.find((b) => b._id === brandId);
              return brand ? (
                <span className="tag" id={`brands-tag-${brandId}`} key={brandId}>
                  {brand.name}
                  <button
                    type="button"
                    className="remove-tag"
                    onClick={() => handleRemoveSelected("brands", brandId)}
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
          {formData.brandInputFocused && (
            <div className="dropdown-list">
              {brands
                .filter(
                  (brand) =>
                    (!formData.brandInput ||
                      brand.name
                        .toLowerCase()
                        .includes(formData.brandInput.toLowerCase())) &&
                    !formData.brands.includes(brand._id)
                )
                .map((brand) => (
                  <div
                    key={brand._id}
                    className="dropdown-item"
                    onMouseDown={() => handleBrandDropdownClick(brand._id)}
                  >
                    {brand.name}
                  </div>
                ))}
              {brands.filter(
                (brand) =>
                  (!formData.brandInput ||
                    brand.name
                      .toLowerCase()
                      .includes(formData.brandInput.toLowerCase())) &&
                  !formData.brands.includes(brand._id)
              ).length === 0 && (
                <div className="dropdown-item no-match">No brands found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTimingForm = () => (
    <div className="form-step timing-form">
      <h2 className="step-title">Shop Timing</h2>
      <p className="step-description">Set your shop's working hours. Toggle each day ON/OFF and specify opening and closing times. <span style={{color:'#b71c1c',fontWeight:500}}>Use 24-hour format (e.g., 09:00, 18:00)</span>.</p>
      <div className="timing-form-days">
        {Object.entries(formData.workingHours).map(([day, timing], idx) => (
          <div key={day} className="timing-day-card">
            <div className="timing-day-header">
              <input
                type="checkbox"
                checked={timing.isOpen}
                onChange={() => handleDayToggle(day)}
                id={`day-${day}`}
              />
              <label htmlFor={`day-${day}`}>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
            </div>
            {timing.isOpen ? (
              <div className="timing-slots-row">
                <span className="timing-label">Open</span>
                <div style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>
                  <input
                    type="time"
                    value={timing.open}
                    onChange={e => handleTimeChange(day, "open", e.target.value)}
                    aria-label={`Opening time for ${day}`}
                    ref={el => (window[`openRef_${day}`] = el)}
                  />
                </div>
                <span className="timing-label">Close</span>
                <div style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>
                  <input
                    type="time"
                    value={timing.close}
                    onChange={e => handleTimeChange(day, "close", e.target.value)}
                    aria-label={`Closing time for ${day}`}
                    ref={el => (window[`closeRef_${day}`] = el)}
                  />
                </div>
              </div>
            ) : (
              <div className="timing-label" style={{color:'#b71c1c',fontWeight:500,marginTop:'0.5rem'}}>Closed</div>
            )}
            {idx < 6 && <div style={{height:1,background:'#e3e8ee',width:'100%',marginTop:'0.7rem',opacity:0.5}}></div>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubscriptionForm = () => (
    <div className="form-step">
      <h2 className="step-title">Choose Subscription Plan</h2>
      <p className="step-description">
        Select a plan that suits your business needs
      </p>

      <div className="subscription-plans">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${
              formData.selectedPlan === plan.id ? "selected" : ""
            }`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            <h3 className="plan-title">{plan.name}</h3>
            <div className="plan-price">{plan.price}</div>
            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="onboarding-container">
      <div className="onboarding-form">
        <h1 className="onboarding-main-heading">Welcome {sellerName}!</h1>
        <div className="onboarding-note">
          <span role="img" aria-label="info" style={{marginRight:8}}>ℹ️</span>
          <span>To get started, please set up your profile first. Complete the steps below to unlock your seller dashboard and start selling!</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {step === 1 && renderBasicDetailsForm()}
        {step === 2 && renderTimingForm()}
        {step === 3 && renderSubscriptionForm()}

        <div className="form-actions">
          {step > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Completing..." : "Complete Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
