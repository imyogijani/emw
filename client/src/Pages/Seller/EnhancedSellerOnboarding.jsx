/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "../../utils/axios";
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from "../../utils/errorHandler";
import { useNavigate } from "react-router-dom";
import "./OnboardingForms.css?v=1.0.0";
import "./GSTForm.css?v=1.0.0";
import {
  FaSignOutAlt,
  FaRegClock,
  FaForward,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";

const EnhancedSellerOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingConfig, setOnboardingConfig] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [formData, setFormData] = useState({});
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  // Removed subscription plans state

  // Fetch onboarding configuration and seller progress
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        setLoading(true);

        // Fetch onboarding configuration
        const configResponse = await axios.get("/api/seller/onboarding/config");
        const config = configResponse.data.config;

        if (!config.isEnabled) {
          showInfoToast(
            "Onboarding is currently disabled. You have full dashboard access!",
            "Onboarding Status"
          );
          navigate("/seller/dashboard");
          return;
        }

        setOnboardingConfig(config);

        // Fetch seller's current progress
        const progressResponse = await axios.get(
          "/api/sellers/onboarding-status"
        );
        if (progressResponse.data.success) {
          const progress = progressResponse.data;
          setCompletedSteps(progress.completedSteps || []);

          // Find the first incomplete required step
          const activeSteps = config.steps.filter((step) => step.isActive);
          const requiredSteps = activeSteps.filter((step) => step.isRequired);

          let nextStepIndex = 0;
          for (let i = 0; i < activeSteps.length; i++) {
            const step = activeSteps[i];
            if (!progress.completedSteps?.includes(step.stepId)) {
              nextStepIndex = i;
              break;
            }
          }

          setCurrentStep(nextStepIndex);
        }

        // Fetch additional data
  await Promise.all([fetchCategories(), fetchBrands()]);
      } catch (error) {
        console.error("Onboarding initialization error:", error);
        showErrorToast(
          "Failed to initialize onboarding",
          "Seller Onboarding - Initialization"
        );
      } finally {
        setLoading(false);
      }
    };

    initializeOnboarding();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/category/get-category");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get("/api/brands");
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    }
  };

  // Removed fetchPlans function

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  const canSkipCurrentStep = () => {
    if (!onboardingConfig || !onboardingConfig.steps[currentStep]) return false;
    const step = onboardingConfig.steps[currentStep];
    return !step.isRequired && onboardingConfig.allowSkipping;
  };

  const handleSkipStep = () => {
    if (!canSkipCurrentStep()) {
      showErrorToast("This step is required and cannot be skipped.");
      return;
    }

    const step = onboardingConfig.steps[currentStep];
    showInfoToast(
      `${step.stepName} step skipped. You can complete it later from your dashboard.`,
      "Step Skipped"
    );

    // Move to next step
    if (currentStep < onboardingConfig.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/seller/dashboard");
    }
  };

  const handleStepSubmit = async (stepData) => {
    const step = onboardingConfig.steps[currentStep];

    try {
      setLoading(true);

      // Submit step data based on step type
      let response;
      switch (step.stepId) {
        case "basic_details":
          response = await submitBasicDetails(stepData);
          break;
        case "shop_timing":
          response = await submitShopTiming(stepData);
          break;
        case "document_verification":
          response = await submitDocuments(stepData);
          // After document upload, redirect to dashboard
          if (response.success) {
            showSuccessToast(
              "Documents uploaded successfully! Redirecting to dashboard...",
              "Onboarding Complete"
            );
            // Use role-based navigation if needed
            navigate("/seller/dashboard");
            return;
          }
          break;
        default:
          throw new Error(`Unknown step type: ${step.stepId}`);
      }

      if (response.success) {
        // Mark step as completed
        const newCompletedSteps = [...completedSteps, step.stepId];
        setCompletedSteps(newCompletedSteps);

        showSuccessToast(
          `${step.stepName} completed successfully!`,
          "Step Completed"
        );

        // Move to next step or complete onboarding
        if (currentStep < onboardingConfig.steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          // Check if all required steps are completed
          const requiredSteps = onboardingConfig.steps
            .filter((s) => s.isRequired && s.isActive)
            .map((s) => s.stepId);

          const allRequiredCompleted = requiredSteps.every((stepId) =>
            newCompletedSteps.includes(stepId)
          );

          if (allRequiredCompleted) {
            showSuccessToast(
              "Onboarding completed successfully! Welcome to your dashboard.",
              "Onboarding Complete"
            );
            navigate("/seller/dashboard");
          } else {
            // Find next incomplete required step
            const nextRequiredStep = onboardingConfig.steps.findIndex(
              (s) =>
                s.isRequired &&
                s.isActive &&
                !newCompletedSteps.includes(s.stepId)
            );

            if (nextRequiredStep !== -1) {
              setCurrentStep(nextRequiredStep);
            } else {
              navigate("/seller/dashboard");
            }
          }
        }
      }
    } catch (error) {
      console.error("Step submission error:", error);
      showErrorToast(
        error.response?.data?.message || `Failed to complete ${step.stepName}`,
        "Step Submission Error"
      );
    } finally {
      setLoading(false);
    }
  };

  const submitBasicDetails = async (data) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User session not found");

    const user = JSON.parse(userStr);
    const sellerId = user?.sellerId;
    if (!sellerId) throw new Error("Seller ID not found");

    const fd = new FormData();
    fd.append("sellerId", sellerId);
    fd.append("shopName", data.shopName);
    fd.append("categories", JSON.stringify(data.categories));
    fd.append("brands", JSON.stringify(data.brands));
    fd.append("shopAddresses", JSON.stringify(data.shopAddresses));
    fd.append("incrementOnboarding", true);

    if (data.shopLogo) {
      fd.append("shopImage", data.shopLogo);
    }

    data.shopImages?.forEach((img) => {
      fd.append(`shopImages`, img);
    });

    const response = await axios.post("/api/seller/onboarding/step1", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  };

  const submitShopTiming = async (data) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User session not found");

    const user = JSON.parse(userStr);
    const sellerId = user?.sellerId;
    if (!sellerId) throw new Error("Seller ID not found");

    const convertedTimings = {};
    Object.entries(data.workingHours).forEach(([day, timing]) => {
      if (timing.isOpen) {
        convertedTimings[day] = [
          { openTime: timing.open, closeTime: timing.close },
        ];
      } else {
        convertedTimings[day] = [];
      }
    });

    const requestData = {
      shopTimingMode: "scheduled",
      shopTimings: convertedTimings,
      incrementOnboarding: true,
    };

    const response = await axios.post(
      `/api/shop-timing/${sellerId}`,
      requestData
    );
    return response.data;
  };

  const submitDocuments = async (data) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User session not found");

    const user = JSON.parse(userStr);
    const sellerId = user?.sellerId;
    if (!sellerId) throw new Error("Seller ID not found");

    const fd = new FormData();
    fd.append("sellerId", sellerId);
    fd.append("incrementOnboarding", "true");

    data.documents?.forEach((doc) => {
      if (!doc.file || !doc.docType) return;

      fd.append(doc.docType, doc.file);
      fd.append(`${doc.docType}_number`, doc.number);
      fd.append(`${doc.docType}_categories`, doc.categories.join(","));
    });

    const response = await axios.post("/api/seller/documents/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  };

  // Subscription function removed - no longer needed

  const renderStepContent = () => {
    if (!onboardingConfig || !onboardingConfig.steps[currentStep]) {
      return <div>Loading step content...</div>;
    }

    const step = onboardingConfig.steps[currentStep];

    switch (step.stepId) {
      case "basic_details":
        return (
          <BasicDetailsStep
            onSubmit={handleStepSubmit}
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            brands={brands}
          />
        );
      case "shop_timing":
        return (
          <ShopTimingStep
            onSubmit={handleStepSubmit}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case "document_verification":
        return (
          <DocumentVerificationStep
            onSubmit={handleStepSubmit}
            formData={formData}
            setFormData={setFormData}
            config={onboardingConfig}
          />
        );
      default:
        return <div>Unknown step type: {step.stepId}</div>;
    }
  };

  const getSellerName = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.name || "Seller";
    } catch {
      return "Seller";
    }
  };

  if (loading) {
    return (
      <div className="onboarding-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!onboardingConfig) {
    return (
      <div className="onboarding-container">
        <div className="error-message">
          Failed to load onboarding configuration
        </div>
      </div>
    );
  }

  const activeSteps = onboardingConfig.steps.filter((step) => step.isActive);
  const currentStepData = activeSteps[currentStep];

  return (
    <div className="onboarding-container">
      <div className="onboarding-form">
        {/* Header */}
        <div className="onboarding-header">
          <button
            className="btn btn-small btn-danger logout-btn-onboarding"
            onClick={handleLogout}
            title="Logout and exit onboarding"
          >
            <FaSignOutAlt />
          </button>

          <h1 className="onboarding-main-heading">
            Welcome {getSellerName()}!
          </h1>
          <div className="onboarding-note">
            <span role="img" aria-label="info" style={{ marginRight: 8 }}>
              ℹ️
            </span>
            <span>
              Complete your seller onboarding to unlock your dashboard and start
              selling!
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentStep + 1) / activeSteps.length) * 100}%`,
            }}
          />
        </div>

        {/* Step Indicators */}
        <div className="step-indicators">
          <div className="step-labels">
            {activeSteps.map((step, index) => (
              <div
                key={step.stepId}
                className={`step-label ${
                  index === currentStep
                    ? "active"
                    : completedSteps.includes(step.stepId)
                    ? "completed"
                    : ""
                }`}
              >
                <div className="step-number">
                  {completedSteps.includes(step.stepId) ? (
                    <FaCheck />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="step-info">
                  <span className="step-name">{step.stepName}</span>
                  {step.isRequired && (
                    <span className="required-badge">Required</span>
                  )}
                  {step.estimatedTimeMinutes && (
                    <span className="time-estimate">
                      <FaRegClock /> {step.estimatedTimeMinutes}min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="step-content">
          {currentStepData && (
            <div className="step-header">
              <h2 className="step-title">{currentStepData.stepName}</h2>
              {currentStepData.description && (
                <p className="step-description">
                  {currentStepData.description}
                </p>
              )}
              {currentStepData.category && (
                <span className="step-category">
                  {currentStepData.category}
                </span>
              )}
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Step Actions */}
        <div className="step-actions">
          {canSkipCurrentStep() && (
            <button
              type="button"
              className="btn btn-medium btn-secondary"
              onClick={handleSkipStep}
            >
              <FaForward /> Skip This Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual Step Components
const BasicDetailsStep = ({
  onSubmit,
  formData,
  setFormData,
  categories,
  brands,
}) => {
  const [localData, setLocalData] = useState({
    shopName: formData.shopName || "",
    categories: formData.categories || [],
    brands: formData.brands || [],
    shopLogo: formData.shopLogo || null,
    logoPreview: formData.logoPreview || null,
    shopAddresses: formData.shopAddresses || [
      {
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        isDefault: true,
        type: "store",
      },
    ],
    shopImages: formData.shopImages || [],
    shopImagesPreview: formData.shopImagesPreview || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!localData.shopName.trim()) {
      showErrorToast("Shop name is required");
      return;
    }

    if (localData.categories.length === 0) {
      showErrorToast("Please select at least one category");
      return;
    }

    setFormData({ ...formData, ...localData });
    onSubmit(localData);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLocalData({
          ...localData,
          shopLogo: file,
          logoPreview: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-step">
      {/* Shop Logo */}
      <div className="form-group">
        <label className="form-label">Shop Logo</label>
        <div className="logo-upload">
          <div className="logo-preview">
            {localData.logoPreview ? (
              <img src={localData.logoPreview} alt="Shop logo preview" />
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
          <label
            htmlFor="logo"
            className="btn btn-medium btn-secondary logo-upload-btn"
          >
            <span className="text">Choose File</span>
          </label>
        </div>
      </div>

      {/* Shop Name */}
      <div className="form-group">
        <label className="form-label">Shop Name *</label>
        <input
          type="text"
          className="form-input"
          value={localData.shopName}
          onChange={(e) =>
            setLocalData({ ...localData, shopName: e.target.value })
          }
          placeholder="Enter your shop name"
          required
        />
      </div>

      {/* Categories */}
      <div className="form-group">
        <label className="form-label">Categories *</label>
        <select
          multiple
          className="form-input"
          value={localData.categories}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (option) => option.value
            );
            setLocalData({ ...localData, categories: selected });
          }}
          required
        >
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        <small className="form-help">
          Hold Ctrl/Cmd to select multiple categories
        </small>
      </div>

      {/* Brands */}
      <div className="form-group">
        <label className="form-label">Brands</label>
        <select
          multiple
          className="form-input"
          value={localData.brands}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (option) => option.value
            );
            setLocalData({ ...localData, brands: selected });
          }}
        >
          {brands.map((brand) => (
            <option key={brand._id} value={brand._id}>
              {brand.name}
            </option>
          ))}
        </select>
        <small className="form-help">
          Hold Ctrl/Cmd to select multiple brands
        </small>
      </div>

      {/* Shop Address */}
      <div className="form-group">
        <label className="form-label">Shop Address *</label>
        <input
          type="text"
          className="form-input"
          value={localData.shopAddresses[0]?.addressLine1 || ""}
          onChange={(e) => {
            const newAddresses = [...localData.shopAddresses];
            newAddresses[0] = {
              ...newAddresses[0],
              addressLine1: e.target.value,
            };
            setLocalData({ ...localData, shopAddresses: newAddresses });
          }}
          placeholder="Enter your shop address"
          required
        />
      </div>

      <button type="submit" className="btn btn-large btn-primary">
        Save & Continue
      </button>
    </form>
  );
};

const ShopTimingStep = ({ onSubmit, formData, setFormData }) => {
  const [localData, setLocalData] = useState({
    workingHours: formData.workingHours || {
      monday: { isOpen: true, open: "09:00", close: "18:00" },
      tuesday: { isOpen: true, open: "09:00", close: "18:00" },
      wednesday: { isOpen: true, open: "09:00", close: "18:00" },
      thursday: { isOpen: true, open: "09:00", close: "18:00" },
      friday: { isOpen: true, open: "09:00", close: "18:00" },
      saturday: { isOpen: true, open: "09:00", close: "18:00" },
      sunday: { isOpen: false, open: "09:00", close: "18:00" },
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData({ ...formData, ...localData });
    onSubmit(localData);
  };

  const updateDayTiming = (day, field, value) => {
    setLocalData({
      ...localData,
      workingHours: {
        ...localData.workingHours,
        [day]: {
          ...localData.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-step">
      <div className="timing-grid">
        {Object.entries(localData.workingHours).map(([day, timing]) => (
          <div key={day} className="day-timing">
            <div className="day-header">
              <span className="day-name">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={timing.isOpen}
                  onChange={(e) =>
                    updateDayTiming(day, "isOpen", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {timing.isOpen && (
              <div className="time-inputs">
                <input
                  type="time"
                  value={timing.open}
                  onChange={(e) => updateDayTiming(day, "open", e.target.value)}
                  className="time-input"
                />
                <span>to</span>
                <input
                  type="time"
                  value={timing.close}
                  onChange={(e) =>
                    updateDayTiming(day, "close", e.target.value)
                  }
                  className="time-input"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="submit" className="btn btn-large btn-primary">
        Save & Continue
      </button>
    </form>
  );
};

const DocumentVerificationStep = ({
  onSubmit,
  formData,
  setFormData,
  config,
}) => {
  const [documents, setDocuments] = useState(formData.documents || []);
  const [requiredDocTypes, setRequiredDocTypes] = useState([]);
  const [optionalDocTypes, setOptionalDocTypes] = useState([]);

  useEffect(() => {
    if (config && config.documentVerification) {
      const required = config.documentVerification.documentTypes
        .filter((dt) => dt.isRequired && dt.isActive)
        .map((dt) => dt.name);
      const optional = config.documentVerification.documentTypes
        .filter((dt) => !dt.isRequired && dt.isActive)
        .map((dt) => dt.name);

      setRequiredDocTypes(required);
      setOptionalDocTypes(optional);

      // Initialize documents array with required document slots
      if (documents.length === 0) {
        const initialDocs = required.map((docType) => ({
          docType: "",
          file: null,
          preview: null,
          number: "",
          categories: [],
        }));
        setDocuments(initialDocs);
      }
    }
  }, [config]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required documents
    const requiredDocsCount = requiredDocTypes.length;
    const uploadedRequiredDocs = documents.filter(
      (doc) =>
        doc.file &&
        doc.docType &&
        doc.number &&
        requiredDocTypes.includes(doc.docType)
    ).length;

    if (
      config.documentVerification.isRequired &&
      uploadedRequiredDocs < requiredDocsCount
    ) {
      showErrorToast(
        `Please upload all ${requiredDocsCount} required documents`
      );
      return;
    }

    const dataToSubmit = { ...formData, documents };
    setFormData(dataToSubmit);
    onSubmit(dataToSubmit);
  };

  const handleDocChange = (index, field, value) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], [field]: value };

    // Auto-populate categories based on document type
    if (field === "docType" && value) {
      const docTypeConfig = config.documentVerification.documentTypes.find(
        (dt) => dt.name === value
      );
      if (docTypeConfig && docTypeConfig.validationRules?.categories) {
        newDocs[index].categories = docTypeConfig.validationRules.categories;
      }
    }

    setDocuments(newDocs);
  };

  const handleFileChange = (index, file) => {
    if (!file) return;

    // Validate file size
    const docType = documents[index].docType;
    const docTypeConfig = config.documentVerification.documentTypes.find(
      (dt) => dt.name === docType
    );

    if (docTypeConfig && docTypeConfig.maxSizeInMB) {
      const maxSizeBytes = docTypeConfig.maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        showErrorToast(
          `File size must be less than ${docTypeConfig.maxSizeInMB}MB`
        );
        return;
      }
    }

    // Validate file format
    if (docTypeConfig && docTypeConfig.acceptedFormats) {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (!docTypeConfig.acceptedFormats.includes(fileExtension)) {
        showErrorToast(
          `File format must be one of: ${docTypeConfig.acceptedFormats.join(
            ", "
          )}`
        );
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newDocs = [...documents];
      newDocs[index] = {
        ...newDocs[index],
        file: file,
        preview: e.target.result,
      };
      setDocuments(newDocs);
    };
    reader.readAsDataURL(file);
  };

  const addDocument = () => {
    setDocuments([
      ...documents,
      {
        docType: "",
        file: null,
        preview: null,
        number: "",
        categories: [],
      },
    ]);
  };

  const removeDocument = (index) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    setDocuments(newDocs);
  };

  const allDocTypes = [...requiredDocTypes, ...optionalDocTypes];

  return (
    <form onSubmit={handleSubmit} className="form-step">
      {config.documentVerification.isRequired && (
        <div className="verification-notice">
          <FaExclamationTriangle className="warning-icon" />
          <p>Document verification is required to complete your onboarding.</p>
          <p>Required documents: {requiredDocTypes.length}</p>
        </div>
      )}

      <div className="documents-section">
        {documents.map((doc, index) => (
          <div key={index} className="document-upload-item">
            <div className="document-header">
              <h4>Document {index + 1}</h4>
              {index >= requiredDocTypes.length && (
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => removeDocument(index)}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Document Type *
                {index < requiredDocTypes.length && (
                  <span className="required-badge">Required</span>
                )}
              </label>
              <select
                className="form-input"
                value={doc.docType}
                onChange={(e) =>
                  handleDocChange(index, "docType", e.target.value)
                }
                required={index < requiredDocTypes.length}
              >
                <option value="">Select Document Type</option>
                {allDocTypes.map((docType) => {
                  const docConfig =
                    config.documentVerification.documentTypes.find(
                      (dt) => dt.name === docType
                    );
                  return (
                    <option key={docType} value={docType}>
                      {docConfig?.displayName || docType}
                      {requiredDocTypes.includes(docType) && " (Required)"}
                    </option>
                  );
                })}
              </select>
            </div>

            {doc.docType && (
              <>
                <div className="form-group">
                  <label className="form-label">Document Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={doc.number}
                    onChange={(e) =>
                      handleDocChange(index, "number", e.target.value)
                    }
                    placeholder={`Enter ${doc.docType} number`}
                    required={index < requiredDocTypes.length}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Document *</label>
                  <input
                    type="file"
                    accept={(() => {
                      const docConfig =
                        config.documentVerification.documentTypes.find(
                          (dt) => dt.name === doc.docType
                        );
                      return docConfig?.acceptedFormats
                        ? docConfig.acceptedFormats
                            .map((f) => `.${f}`)
                            .join(",")
                        : "image/*,.pdf";
                    })()}
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    required={index < requiredDocTypes.length}
                  />
                  {doc.preview && (
                    <div className="document-preview">
                      {doc.file?.type.startsWith("image/") ? (
                        <img src={doc.preview} alt="Document preview" />
                      ) : (
                        <div className="pdf-preview">📄 {doc.file?.name}</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {documents.length < allDocTypes.length && (
          <button
            type="button"
            className="btn btn-medium btn-secondary"
            onClick={addDocument}
          >
            Add Another Document
          </button>
        )}
      </div>

      <button type="submit" className="btn btn-large btn-primary">
        Save & Continue
      </button>
    </form>
  );
};



export default EnhancedSellerOnboarding;
