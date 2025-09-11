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
import { FaSignOutAlt, FaRegClock, FaForward } from "react-icons/fa";
import {
  getSystemSettings,
  isOnboardingEnabled,
  getRequiredOnboardingSteps,
  STEP_MAPPING,
} from "../../utils/systemSettings";

const SellerOnboarding = () => {
  // -------------------- STATE --------------------
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [requiredSteps, setRequiredSteps] = useState([]);
  const [onboardingDisabled, setOnboardingDisabled] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isDocsSubmitted, setIsDocsSubmitted] = useState(false);

  const [settings, setSettings] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);

  // Helper function to check if a step is required
  const isStepRequired = (stepNumber) => {
    const stepKey = getStepKey(stepNumber);
    return requiredSteps.includes(stepKey);
  };

  // Helper function to check if skipping is allowed for current step
  const canSkipCurrentStep = () => {
    return !isStepRequired(step);
  };

  // const STEP_MAP = {
  //   basicDetails: renderBasicDetailsForm,
  //   shopTiming: renderTimingForm,
  //   legalDocuments: renderGSTForm,
  //   subscription: renderSubscriptionForm,
  // };

  // useEffect(() => {
  //   const fetchSettings = async () => {
  //     try {
  //       const res = await axios.get("/api/settings");
  //       if (res.data.success) {
  //         // filter only enabled steps
  //         const enabledSteps = res.data.settings.onboardingRequiredSteps
  //           .filter((s) => s.enabled)
  //           .map((s) => s.name);

  //         // add subscription always at the end
  //         enabledSteps.push("subscription");

  //         setSteps(enabledSteps);
  //         setSettings(res.data.settings);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching settings:", err);
  //     }
  //   };

  //   fetchSettings();
  // }, []);

  // const currentStepName = steps[stepIndex];
  // const renderStep = STEP_MAP[currentStepName];

  // old :
  // Fetch system settings and check onboarding status
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        // Fetch system settings first
        const settings = await getSystemSettings();
        setSystemSettings(settings);

        const onboardingEnabled = await isOnboardingEnabled();
        const steps = await getRequiredOnboardingSteps();

        setRequiredSteps(steps);
        setOnboardingDisabled(!onboardingEnabled);

        // If onboarding is disabled, redirect to dashboard with toast
        if (!onboardingEnabled) {
          showInfoToast(
            "Onboarding is currently disabled. You have full dashboard access!",
            "Onboarding Status"
          );
          navigate("/seller/dashboard");
          return;
        }

        // Fetch current onboarding step
        const response = await axios.get("/api/sellers/onboarding-status");
        if (response.data.success) {
          let serverStep = response.data.step;
          if (serverStep === 1 || !serverStep) {
            setStep(1); // Always start at basic details
          } else {
            setStep(serverStep);
          }
        }
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

  const [formData, setFormData] = useState({
    // Step 1 - Basic Details
    shopName: "",
    categories: [],
    // Document Type Selection
    brands: [],
    shopLogo: null,
    logoPreview: null,
    categoryInput: "",
    brandInput: "",
    categoryInputFocused: false,
    brandInputFocused: false,
    shopAddress: "",
    location: "",
    shopAddresses: [
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
    shopImages: [],
    shopImagesPreview: [],

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

    // Step 3 - Documents and Bank Details (subscription removed)
    hasGST: null,
    gstNumber: "",
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      beneficiaryName: "",
      confirmAccountNumber: "",
    },
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [pincodes, setPincodes] = useState([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPincode, setSelectedPincode] = useState("");

  // Document options based on GST status
  // -------------------- STATE --------------------
  const [documents, setDocuments] = useState([
    {
      docType: "",
      file: null,
      preview: null,
      number: "",
    },
  ]);

  // Doc types as per backend schema
  const docTypes = {
    // Identity documents
    identity: [
      "aadhaar",
      "pan",
      "drivingLicense",
      "voterId",
      "passport",
      "governmentIdCard",
    ],
    // Address proof documents
    address: [
      "aadhaar",
      "electricityBill",
      "telephoneBill",
      "rentAgreement",
      "passbook",
    ],
    // Business documents
    business: [
      "gst",
      "udyam",
      "certificateOfIncorporation",
      "partnershipDeed",
      "trustDeed",
    ],
    // Bank related documents
    bank: ["bankPassbook", "bankStatement"],
  };

  // All available document types
  const docOptions = [
    "aadhaar",
    "pan",
    "gst",
    "bankPassbook",
    "bankStatement",
    "drivingLicense",
    "voterId",
    "passport",
    "udyam",
    "certificateOfIncorporation",
    "electricityBill",
    "telephoneBill",
    "rentAgreement",
    "partnershipDeed",
    "trustDeed",
  ];

  const documentCategoriesMap = {
    aadhaar: ["identity", "address"],
    pan: ["identity"],
    gst: ["business"],
    udyam: ["business"],
    drivingLicense: ["identity", "address"],
    voterId: ["identity", "address"],
    electricityBill: ["address"],
    passport: ["identity", "address"],
    rentAgreement: ["address"],
    bankPassbook: ["bank", "address"],
    telephoneBill: ["address"],
    bankAccountStatement: ["bank", "address"],
    certificateOfIncorporation: ["business"],
    memorandumOfAssociation: ["business"],
    partnershipDeed: ["business"],
    trustDeed: ["business"],
    lastIssuedPassport: ["identity"],
    birthCertificate: ["identity"],
    gasConnection: ["address"],
    incomeTaxOrder: ["identity", "business"],
    rationCard: ["identity", "address"],
    governmentIdCard: ["identity"],
    pensionDocuments: ["identity", "bank"],
    certificateFromEmployer: ["identity", "business"],
  };

  const getAvailableCategories = (docType) => {
    return documentCategoriesMap[docType] || [];
  };
  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  // Skip step handler
  const handleSkipStep = () => {
    // Don't allow skipping if step is required
    if (!canSkipCurrentStep()) {
      showErrorToast("This step is required and cannot be skipped.");
      return;
    }

    const currentStepKey = getStepKey(step);
    const stepLabels = {
      basicDetails: "Basic Details",
      shopTiming: "Shop Timing",
      legalDocuments: "Legal Documents",
      subscription: "Subscription",
    };

    // Store skipped step in localStorage for dashboard reminders
    const existingSkippedSteps = JSON.parse(
      localStorage.getItem("skippedOnboardingSteps") || "[]"
    );
    if (!existingSkippedSteps.includes(currentStepKey)) {
      existingSkippedSteps.push(currentStepKey);
      localStorage.setItem(
        "skippedOnboardingSteps",
        JSON.stringify(existingSkippedSteps)
      );
    }

    showInfoToast(
      `${stepLabels[currentStepKey]} step skipped. You can complete it later from your dashboard.`,
      "Step Skipped"
    );

    // Find next required step
    let nextStep = step + 1;
    while (nextStep <= 3 && !isStepRequired(nextStep)) {
      nextStep++;
    }

    // If we've passed all steps, go to dashboard
    if (nextStep > 3) {
      navigate("/seller/dashboard");
    } else {
      setStep(nextStep);
    }
  };

  // Check if current step is required
  const isCurrentStepRequired = () => {
    const currentStepKey = getStepKey(step);
    return requiredSteps.includes(currentStepKey);
  };

  // Get step key from step number
  const getStepKey = (stepNumber) => {
    const stepKeys = Object.keys(STEP_MAPPING);
    return (
      stepKeys.find((key) => STEP_MAPPING[key] === stepNumber) || "basicDetails"
    );
  };

  // ================== 1. Load States ==================
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get("/api/location/states-dropdown");
        setStates(res.data.data || []);
        // console.log("States loaded:", res.data.data);
      } catch (err) {
        console.error("Error fetching states:", err);
      }
    };
    fetchStates();
  }, []);

  // ================== 2. Load Cities when state changes ==================
  useEffect(() => {
    if (!selectedState) return;
    const fetchCities = async () => {
      try {
        const res = await axios.get(
          `/api/location/cities-dropdown/${selectedState}`
        );
        setCities(res.data.data || []);
        // console.log("Cities loaded:", res.data.data);
      } catch (err) {
        console.error("Error fetching cities:", err);
      }
    };
    fetchCities();
  }, [selectedState]);

  // ================== 3. Load Pincodes when city changes ==================
  useEffect(() => {
    if (!selectedState || !selectedCity) return;
    const fetchPincodes = async () => {
      try {
        const res = await axios.get(
          `/api/location/pincodes-dropdown/${selectedState}/${selectedCity}`
        );
        setPincodes(res.data.data || {});
        // console.log("Pincodes loaded:", res.data.data);
      } catch (err) {
        console.error("Error fetching pincodes:", err);
      }
    };
    fetchPincodes();
  }, [selectedState, selectedCity]);

  // Cleanup effect for logo preview URL
  useEffect(() => {
    return () => {
      // Clean up logo preview URL on component unmount
      if (formData.logoPreview) {
        URL.revokeObjectURL(formData.logoPreview);
      }
    };
  }, [formData.logoPreview]);

  // Onboarding completion check
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      // Skip onboarding if user has demo access or onboarding is complete
      if (user.demoAccess || user.isOnboardingComplete) {
        navigate("/seller/dashboard");
      }
    }
  }, [navigate]);

  // Fetch categories and brands on component mount
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  // Subscription plans removed - simplified onboarding

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/category/get-category");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showErrorToast(
        "Failed to fetch categories",
        "Seller Onboarding - Categories"
      );
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get("/api/brands");
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
      showErrorToast("Failed to fetch brands", "Seller Onboarding - Brands");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clean up previous preview URL to prevent memory leaks
      if (formData.logoPreview) {
        URL.revokeObjectURL(formData.logoPreview);
      }
      setFormData({
        ...formData,
        shopLogo: file,
        logoPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleShopImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      shopImages: files,
      shopImagesPreview: files.map((file) => URL.createObjectURL(file)),
    }));
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

  // Plan selection removed - simplified onboarding

  const validateStep = () => {
    // If step is not required, allow to proceed without validation
    if (!isCurrentStepRequired()) {
      return true;
    }

    switch (step) {
      case 1:
        if (!formData.shopName) {
          showErrorToast(
            "Shop name is required",
            "Seller Onboarding - Step 1 Validation"
          );
          return false;
        }
        if (!formData.shopLogo) {
          showErrorToast(
            "Shop logo is required",
            "Seller Onboarding - Step 1 Validation"
          );
          return false;
        }
        if (formData.shopImages.length === 0) {
          showErrorToast(
            "Please upload at least one shop image",
            "Seller Onboarding - Step 1 Validation"
          );
          return false;
        }
        break;
      case 2: {
        // At least one day should be open
        const hasOpenDay = Object.values(formData.workingHours).some(
          (day) => day.isOpen
        );
        if (!hasOpenDay) {
          showErrorToast(
            "Please select at least one working day",
            "Seller Onboarding - Step 2 Validation"
          );
          return false;
        }
        break;
      }
      case 3: {
        // Check if GST selection is made
        if (formData.hasGST === null) {
          showErrorToast(
            "Please select your GST registration status",
            "Seller Onboarding - Step 3 Validation"
          );
          return false;
        }

        // If has GST, validate GST number
        if (
          formData.hasGST === true &&
          (!formData.gstNumber || formData.gstNumber.trim().length !== 15)
        ) {
          showErrorToast(
            "Please enter a valid 15-character GST number",
            "Seller Onboarding - Step 3 Validation"
          );
          return false;
        }

        // Validate bank details
        const bankDetails = formData.bankDetails;
        if (
          !bankDetails.beneficiaryName ||
          bankDetails.beneficiaryName.trim() === ""
        ) {
          showErrorToast(
            "Please enter the account holder name",
            "Seller Onboarding - Step 3 Validation"
          );
          return false;
        }

        if (
          !bankDetails.accountNumber ||
          bankDetails.accountNumber.trim() === ""
        ) {
          showErrorToast(
            "Please enter the bank account number",
            "Seller Onboarding - Step 3 Validation"
          );
          return false;
        }

        if (
          !bankDetails.ifscCode ||
          !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode)
        ) {
          showErrorToast(
            "Please enter a valid IFSC code",
            "Seller Onboarding - Step 3 Validation"
          );
          return false;
        }

        // Validate documents based on GST status
        const requiredDocsCount = formData.hasGST === false ? 2 : 0;
        const validDocuments = documents.filter(
          (doc) =>
            doc.docType &&
            doc.number &&
            doc.file &&
            (!formData.hasGST || ["aadhaar", "pan"].includes(doc.docType))
        );

        if (validDocuments.length < requiredDocsCount) {
          showErrorToast(
            `Please provide ${requiredDocsCount} valid identification documents (Aadhaar and PAN)`,
            "Seller Onboarding - Step 3 Validation"
          );
          return false;
        }
        break;
      }
      case 4: {
        // Subscription validation if needed
        break;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }

    try {
      if (step === 2) {
        // Step 2 ke liye hamesha submitStep2 call hoga
        await submitStep2();
      } else if (isCurrentStepRequired()) {
        // Required steps ke liye
        if (step === 1) {
          await submitStep1();
        } else if (step === 3) {
          await submitStep3();
        }
      } else {
        // Optional steps ke liye skip message
        const currentStepKey = getStepKey(step);
        const stepLabels = {
          basicDetails: "Basic Details",
          shopTiming: "Shop Timing",
          legalDocuments: "Legal Documents",
          subscription: "Subscription",
        };
        showInfoToast(
          `${stepLabels[currentStepKey]} step is optional and was skipped.`,
          "Optional Step Skipped"
        );
      }

      // Agar sab thik raha to next step me jao
      setStep(step + 1);
    } catch (error) {
      console.error("Step submission error:", error);
      showErrorToast(
        error.response?.data?.message || "Step submission failed",
        "Seller Onboarding"
      );
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    // if (!validateStep()) return;

    // console.log("Complate Seller Profile call --> ");

    try {
      setLoading(true);

      const userStr = localStorage.getItem("user");
      if (!userStr)
        throw new Error("User session not found. Please login again.");

      const user = JSON.parse(userStr);
      const sellerId = user?.sellerId;
      if (!sellerId)
        throw new Error("Seller ID not found. Please contact support.");

      if (!validateStep()) throw new Error("Validation failed");

      // ---------- 1. Documents Upload ----------
      const fd = new FormData();
      fd.append("sellerId", sellerId);
      fd.append("incrementOnboarding", "true");

      // ---------- 2. Bank + GST (single API) ----------
      await axios.post("/api/seller/onboarding/complete", {
        gstNumber: formData.hasGST ? formData.gstNumber : null,
        beneficiaryName: formData.bankDetails.beneficiaryName,
        accountNumber: formData.bankDetails.accountNumber,
        ifscCode: formData.bankDetails.ifscCode,
      });

      localStorage.removeItem("skippedOnboardingSteps");

      showSuccessToast(
        "🎉 Profile completed successfully! Welcome to your dashboard!",
        "Seller Onboarding - Complete"
      );
      // Redirect to seller dashboard
      navigate("/seller/dashboard");
    } catch (error) {
      console.error("Profile completion error:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to complete profile"
      );
    } finally {
      setLoading(false);
    }
  };

  // Subscription functionality removed - simplified onboarding

  // -------------------- STEP 1 API --------------------
  const submitStep1 = async () => {
    try {
      setLoading(true);

      // Safe localStorage access
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        showErrorToast(
          "User session not found. Please login again.",
          "Seller Onboarding - Authentication"
        );
        navigate("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const sellerId = user?.sellerId;
      // console.log("User details:", sellerId);

      if (!sellerId) {
        showErrorToast(
          "Seller ID not found. Please contact support.",
          "Seller Onboarding - Authentication"
        );
        return;
      }

      const fd = new FormData();
      fd.append("sellerId", sellerId);
      fd.append("shopName", formData.shopName);
      fd.append("categories", JSON.stringify(formData.categories));
      fd.append("brands", JSON.stringify(formData.brands));
      // fd.append("shopAddress", formData.shopAddress);
      // fd.append("location", formData.location);
      fd.append("shopAddresses", JSON.stringify(formData.shopAddresses));
      fd.append("incrementOnboarding", true); // Increment onboarding step on server
      if (formData.shopLogo) {
        fd.append("shopImage", formData.shopLogo);
      }
      formData.shopImages.forEach((img, idx) => {
        fd.append(`shopImages`, img);
      });

      // console.log("form data Images onboarding", formData.shopImages);
      // console.log("form data Images onboarding---1", formData.shopLogo);

      // console.log("form data onboarding step1 passed", fd);
      const response = await axios.post("/api/seller/onboarding/step1", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      showSuccessToast(
        "Step 1 saved successfully",
        "Seller Onboarding - Step 1"
      );
      setStep(2);
    } catch (error) {
      console.error("Step 1 submission error:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to save Step 1",
        "Seller Onboarding - Step 1"
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------- STEP 2 API --------------------
  const submitStep2 = async () => {
    try {
      setLoading(true);

      // Safe localStorage access
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        showErrorToast(
          "User session not found. Please login again.",
          "Seller Onboarding - Authentication"
        );
        navigate("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const sellerId = user?.sellerId;

      if (!sellerId) {
        showErrorToast(
          "Seller ID not found. Please contact support.",
          "Seller Onboarding - Authentication"
        );
        return;
      }

      // Convert frontend workingHours → backend format
      const convertedTimings = {};
      Object.entries(formData.workingHours).forEach(([day, timing]) => {
        if (timing.isOpen) {
          convertedTimings[day] = [
            { openTime: timing.open, closeTime: timing.close },
          ];
        } else {
          convertedTimings[day] = [];
        }
      });

      const data = {
        shopTimingMode: "scheduled",
        shopTimings: convertedTimings,
        incrementOnboarding: true,
      };
      console.log("ShopTiming --- Data --- ", data);

      const response = await axios.post(`/api/shop-timing/${sellerId}`, data);
      showSuccessToast(
        "Shop timings saved successfully",
        "Seller Onboarding - Step 2"
      );
      setStep(3);
    } catch (error) {
      console.error("Step 2 submission error:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to save timings",
        "Seller Onboarding - Step 2"
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

  // GST change
  const handleGstChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      gstNumber: e.target.value,
    }));
  };

  // Document change (single file each type)
  const handleDocChange = (index, field, value) => {
    const updated = [...documents];
    // updated[index] = {
    //   ...updated[index],
    //   [field]: value,
    //   categories: field === "docType" ? [] : updated[index].categories || [],
    // };
    updated[index][field] = value;

    // If document type changes, reset categories and auto-select all available categories
    if (field === "docType") {
      updated[index].categories = getAvailableCategories(value);
    }
    setDocuments(updated);
  };
  const handleFileChange = (index, file) => {
    const updated = [...documents];
    updated[index].file = file;
    updated[index].preview = URL.createObjectURL(file);
    setDocuments(updated);
  };

  const addDocumentRow = () => {
    setDocuments((prev) => [
      ...prev,
      // { docType: "", file: null, preview: null, number: "" },
      { docType: "", file: null, preview: null, number: "", categories: [] },
    ]);
  };

  const submitStep3 = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("User session not found. Please login again.");
      }

      const user = JSON.parse(userStr);
      const sellerId = user?.sellerId;

      if (!sellerId) {
        throw new Error("Seller ID not found. Please contact support.");
      }

      if (!validateStep()) {
        throw new Error("Validation failed");
      }

      // Create form data for document upload
      const fd = new FormData();
      fd.append("sellerId", sellerId);
      // fd.append("bankDetails", JSON.stringify(formData.bankDetails));
      fd.append("incrementOnboarding", "true");

      documents.forEach((doc) => {
        if (!doc.file || !doc.docType) return;

        const docKey = doc.docType; // e.g. "aadhaar", "pan"

        // console.log(`---- Document ${docKey} ----`);
        // console.log("docNumber:", doc.number);
        // console.log("categories:", doc.categories);
        // console.log("file:", doc.file?.name);

        // Match Postman style
        fd.append(docKey, doc.file); // file field
        fd.append(`${docKey}_number`, doc.number);
        fd.append(`${docKey}_categories`, doc.categories.join(","));
        fd.append("incrementOnboarding", true);
      });

      // Debug all formData
      for (let pair of fd.entries()) {
        console.log(pair[0] + ":", pair[1]);
      }

      const response = await axios.post("/api/seller-documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedDocs(response.data.uploadedDocs || []); // backend se docs aayenge
      setIsDocsSubmitted(true);

      console.log("Upload response:", response.data);
      showSuccessToast(
        "Documents & Bank Details uploaded successfully 🎉",
        "Seller Onboarding"
      );
    } catch (err) {
      // Only show error, do not advance step
      if (err instanceof Error && err.message) {
        showErrorToast(err.message, "Seller Onboarding - GST/Documents");
      } else {
        showErrorToast(
          "Upload failed. Please try again.",
          "Seller Onboarding - Documents"
        );
      }
    }
  };

  // Get seller name from localStorage with proper error handling
  const getSellerName = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return "Seller";

      const user = JSON.parse(userStr);
      return (
        user?.firstName ||
        user?.names ||
        user?.shopownerName ||
        user?.shopName ||
        "Seller"
      );
    } catch (error) {
      console.warn("Error parsing user data from localStorage:", error);
      return "Seller";
    }
  };

  const sellerName = getSellerName();

  const renderBasicDetailsForm = () => (
    <div className="form-step">
      {/* Logout button top right */}
      <button
        className="btn btn-small btn-danger logout-btn-onboarding"
        onClick={handleLogout}
        title="Logout and exit onboarding"
      >
        <span className="sparkle">
          <FaSignOutAlt />
        </span>
        {/* <span className="text">Logout</span> */}
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
          <label
            htmlFor="logo"
            className="btn btn-medium btn-secondary logo-upload-btn"
          >
            <span className="text">Choose File</span>
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

      {/* <div className="form-group">
        <label className="form-label">Shop Address</label>
        <input
          type="text"
          className="form-input"
          value={formData.shopAddress}
          onChange={(e) =>
            setFormData({ ...formData, shopAddress: e.target.value })
          }
          placeholder="Enter your shop address"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Location</label>
        <input
          type="text"
          className="form-input"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          placeholder="Enter your shop location (city, area, etc.)"
        />
      </div> */}

      {/* Address Section */}
      <div className="form-group">
        <label className="form-label">Shop Address</label>
        <input
          type="text"
          className="form-input"
          value={formData.shopAddresses[0].addressLine1}
          onChange={(e) => {
            const updatedAddresses = [...formData.shopAddresses];
            updatedAddresses[0].addressLine1 = e.target.value;
            setFormData({ ...formData, shopAddresses: updatedAddresses });
          }}
          placeholder="AddressLine 1 (e.g., Flat / House No / Building)"
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          className="form-input"
          value={formData.shopAddresses[0].addressLine2}
          onChange={(e) => {
            const updatedAddresses = [...formData.shopAddresses];
            updatedAddresses[0].addressLine2 = e.target.value;
            setFormData({ ...formData, shopAddresses: updatedAddresses });
          }}
          placeholder="AddressLine 2 (optional)"
        />
      </div>

      {/* <div className="form-group">
        <input
          type="text"
          className="form-input"
          value={formData.shopAddresses[0].city}
          onChange={(e) => {
            const updatedAddresses = [...formData.shopAddresses];
            updatedAddresses[0].city = e.target.value;
            setFormData({ ...formData, shopAddresses: updatedAddresses });
          }}
          placeholder="Enter city"
        />
      </div> */}

      {/* <label className="form-label">City</label> */}

      {/* 
      <div className="form-group">
        <input
          type="text"
          className="form-input"
          value={formData.shopAddresses[0].state}
          onChange={(e) => {
            const updatedAddresses = [...formData.shopAddresses];
            updatedAddresses[0].state = e.target.value;
            setFormData({ ...formData, shopAddresses: updatedAddresses });
          }}
          placeholder="Enter state"
        />
      </div> */}
      {/* ================== State Dropdown ================== */}
      {/* ================== State Dropdown ================== */}
      <select
        className="form-input"
        value={formData.shopAddresses[0].state}
        onChange={(e) => {
          const value = e.target.value;
          setSelectedState(value);
          setSelectedCity("");
          setSelectedPincode("");
          setCities([]);
          setPincodes([]);

          // update formData
          const updatedAddresses = [...formData.shopAddresses];
          updatedAddresses[0].state = value;
          updatedAddresses[0].city = ""; // reset city
          updatedAddresses[0].pincode = ""; // reset pincode
          setFormData({ ...formData, shopAddresses: updatedAddresses });
        }}
      >
        <option value="">-- Select State --</option>
        {states.map((state, idx) => (
          <option key={idx} value={state}>
            {state}
          </option>
        ))}
      </select>

      {/* ================== City Dropdown ================== */}
      <select
        className="form-input"
        value={formData.shopAddresses[0].city}
        onChange={(e) => {
          const value = e.target.value;
          setSelectedCity(value);
          setSelectedPincode("");
          setPincodes([]);

          // update formData
          const updatedAddresses = [...formData.shopAddresses];
          updatedAddresses[0].city = value;
          updatedAddresses[0].pincode = ""; // reset pincode
          setFormData({ ...formData, shopAddresses: updatedAddresses });
        }}
        disabled={!formData.shopAddresses[0].state} // disable if state not selected
      >
        <option value="">-- Select City --</option>
        {cities.map((city, idx) => (
          <option key={idx} value={city}>
            {city}
          </option>
        ))}
      </select>

      {/* ================== Pincode Dropdown ================== */}
      <select
        className="form-input"
        value={formData.shopAddresses[0].pincode}
        onChange={(e) => {
          const selectedPincode = e.target.value;
          const selectedArea =
            e.target.options[e.target.selectedIndex].dataset.area;

          // update formData
          const updatedAddresses = [...formData.shopAddresses];
          updatedAddresses[0].pincode = selectedPincode;
          updatedAddresses[0].area = selectedArea;

          setFormData({ ...formData, shopAddresses: updatedAddresses });
        }}
        disabled={!formData.shopAddresses[0].city} // disable if city not selected
      >
        <option value="">-- Select Pincode --</option>
        {Object.entries(pincodes).map(([area, pincode], idx) => (
          <option key={idx} value={pincode} data-area={area}>
            {area} ({pincode})
          </option>
        ))}
      </select>

      {/* <div className="form-group">
        <input
          type="text"
          className="form-input"
          value={formData.shopAddresses[0].pincode}
          onChange={(e) => {
            const updatedAddresses = [...formData.shopAddresses];
            updatedAddresses[0].pincode = e.target.value;
            setFormData({ ...formData, shopAddresses: updatedAddresses });
          }}
          placeholder="Enter pincode"
        />
      </div> */}

      <div className="form-group">
        <input
          type="text"
          className="form-input"
          value={formData.shopAddresses[0].country}
          onChange={(e) => {
            const updatedAddresses = [...formData.shopAddresses];
            updatedAddresses[0].country = e.target.value;
            setFormData({ ...formData, shopAddresses: updatedAddresses });
          }}
          placeholder="Enter country"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Shop Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleShopImagesChange}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {formData.shopImagesPreview.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt="Shop"
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          ))}
        </div>
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
                () => setFormData({ ...formData, categoryInputFocused: false }),
                200
              )
            }
          />
          <div className="selected-tags">
            {formData.categories.map((catId) => {
              const cat = categories.find((c) => c._id === catId);
              return cat ? (
                <span
                  className="tag"
                  id={`categories-tag-${catId}`}
                  key={catId}
                >
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
        <label className="form-label">Brands (Optional)</label>
        <div className="multi-select-tags">
          <input
            type="text"
            className="form-input"
            placeholder="Type to filter brands... (Optional)"
            value={formData.brandInput || ""}
            onChange={(e) =>
              setFormData({ ...formData, brandInput: e.target.value })
            }
            onFocus={() =>
              setFormData({ ...formData, brandInputFocused: true })
            }
            onBlur={() =>
              setTimeout(
                () => setFormData({ ...formData, brandInputFocused: false }),
                200
              )
            }
          />
          <div className="selected-tags">
            {formData.brands.map((brandId) => {
              const brand = brands.find((b) => b._id === brandId);
              return brand ? (
                <span
                  className="tag"
                  id={`brands-tag-${brandId}`}
                  key={brandId}
                >
                  {brand.name}
                  <button
                    type="button"
                    className="btn btn-small btn-danger remove-tag"
                    onClick={() => handleRemoveSelected("brands", brandId)}
                  >
                    <span className="text">×</span>
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
      <p className="step-description">
        Set your shop's working hours. Toggle each day ON/OFF and specify
        opening and closing times.{" "}
        <span style={{ color: "#b71c1c", fontWeight: 500 }}>
          Use 24-hour format (e.g., 09:00, 18:00)
        </span>
        .
      </p>
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
              <label htmlFor={`day-${day}`}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </label>
            </div>
            {timing.isOpen ? (
              <div className="timing-slots-row">
                <span className="timing-label">Open</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <input
                    type="time"
                    value={timing.open}
                    onChange={(e) =>
                      handleTimeChange(day, "open", e.target.value)
                    }
                    aria-label={`Opening time for ${day}`}
                    ref={(el) => (window[`openRef_${day}`] = el)}
                  />
                </div>
                <span className="timing-label">Close</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <input
                    type="time"
                    value={timing.close}
                    onChange={(e) =>
                      handleTimeChange(day, "close", e.target.value)
                    }
                    aria-label={`Closing time for ${day}`}
                    ref={(el) => (window[`closeRef_${day}`] = el)}
                  />
                </div>
              </div>
            ) : (
              <div
                className="timing-label"
                style={{
                  color: "#b71c1c",
                  fontWeight: 500,
                  marginTop: "0.5rem",
                }}
              >
                Closed
              </div>
            )}
            {idx < 6 && (
              <div
                style={{
                  height: 1,
                  background: "#e3e8ee",
                  width: "100%",
                  marginTop: "0.7rem",
                  opacity: 0.5,
                }}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Subscription form removed - simplified onboarding

  const renderGSTForm = () => {
    const requiredDocTypes =
      formData.hasGST === false
        ? ["aadhaar", "pan", "bankStatement"]
        : docOptions;

    return (
      <div className="form-step">
        <h2 className="step-title">GST & Identity Verification</h2>
        <p className="step-description">
          Please provide your business registration details
        </p>

        {/* GST Section */}
        <div className="form-section">
          <h3>GST Registration</h3>
          <div className="form-group">
            <label className="form-label">Do you have GST Registration?</label>
            <div className="gst-options">
              <button
                type="button"
                className={`gst-option ${
                  formData.hasGST === true ? "selected" : ""
                }`}
                onClick={() => setFormData({ ...formData, hasGST: true })}
              >
                Yes, I have GST
              </button>
              <button
                type="button"
                className={`gst-option ${
                  formData.hasGST === false ? "selected" : ""
                }`}
                onClick={() => setFormData({ ...formData, hasGST: false })}
              >
                No, I don't have GST
              </button>
            </div>
          </div>

          {formData.hasGST === true && (
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.gstNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gstNumber: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter your GST number"
                maxLength="15"
              />
            </div>
          )}
        </div>

        {/* Bank Account Section */}
        <div className="form-section">
          <h3>Bank Account Details</h3>
          <p className="section-note">
            This account will be used to receive your payments from sales
          </p>

          <div className="form-group">
            <label className="form-label">Account Holder Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.bankDetails.beneficiaryName || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: {
                    ...formData.bankDetails,
                    beneficiaryName: e.target.value,
                  },
                })
              }
              placeholder="Enter account holder name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Number *</label>
            <input
              type="text"
              className="form-input"
              value={formData.bankDetails.accountNumber || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: {
                    ...formData.bankDetails,
                    accountNumber: e.target.value,
                  },
                })
              }
              placeholder="Enter account number"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">IFSC Code *</label>
            <input
              type="text"
              className="form-input"
              value={formData.bankDetails.ifscCode || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: {
                    ...formData.bankDetails,
                    ifscCode: e.target.value.toUpperCase(),
                  },
                })
              }
              placeholder="Enter IFSC code"
              required
            />
          </div>
        </div>

        {/* Document Upload Section */}
        <div className="form-section">
          <h3>Identity Verification</h3>
          {formData.hasGST === false ? (
            <>
              <p className="section-note">
                Please provide any two documents for verification:
              </p>
              <ul className="document-list">
                <li>Aadhaar Card</li>
                <li>PAN Card</li>
                <li>Bank Statement/Passbook (Optional)</li>
              </ul>
            </>
          ) : (
            <p className="section-note">
              Additional verification documents (optional)
            </p>
          )}
          {isDocsSubmitted ? (
            <div className="uploaded-docs">
              <h4>Uploaded Documents ✅</h4>
              <ul>
                {uploadedDocs.map((doc) => {
                  // Extract only file name from filePath
                  const fileName = doc.filePath
                    .split("\\")
                    .pop()
                    .split("/")
                    .pop();
                  return (
                    <li key={doc._id}>
                      <strong>{doc.docType}</strong> - {doc.docNumber}
                      <br />
                      <span>{fileName}</span> {/* ✅ Only show file name */}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <>
              {documents.map((doc, index) => (
                <div key={index} className="document-upload-item">
                  <div className="form-group">
                    <label className="form-label">Document Type *</label>
                    <select
                      className="form-input"
                      value={doc.docType}
                      onChange={(e) =>
                        handleDocChange(index, "docType", e.target.value)
                      }
                      required={formData.hasGST === false && index < 2}
                    >
                      <option value="">Select Document Type</option>
                      {requiredDocTypes.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() +
                            option.slice(1).replace(/([A-Z])/g, " $1")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Categories */}
                  <select
                    className="form-input"
                    multiple
                    value={doc.categories}
                    onChange={(e) =>
                      handleDocChange(
                        index,
                        "categories",
                        Array.from(e.target.selectedOptions, (o) => o.value)
                      )
                    }
                    disabled={!doc.docType}
                  >
                    {doc.docType ? (
                      getAvailableCategories(doc.docType).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))
                    ) : (
                      <option value="">Select document type first</option>
                    )}
                  </select>

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
                          placeholder={`Enter ${doc.docType
                            .replace(/([A-Z])/g, " $1")
                            .toLowerCase()} number`}
                          required={formData.hasGST === false && index < 2}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Upload Document *</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleFileChange(index, e.target.files[0])
                          }
                          required={formData.hasGST === false && index < 2}
                        />
                        {doc.preview && (
                          <div className="document-preview">
                            {doc.file?.type.startsWith("image/") ? (
                              <img src={doc.preview} alt="Document preview" />
                            ) : (
                              <div className="pdf-preview">PDF Document</div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {index > 0 && (
                    <button
                      type="button"
                      className="remove-document"
                      onClick={() => {
                        const newDocs = [...documents];
                        newDocs.splice(index, 1);
                        setDocuments(newDocs);
                      }}
                    >
                      Remove Document
                    </button>
                  )}
                </div>
              ))}

              {documents.length < 3 && (
                <button
                  type="button"
                  className="add-document"
                  onClick={() =>
                    setDocuments([
                      ...documents,
                      {
                        docType: "",
                        file: null,
                        preview: null,
                        number: "",
                      },
                    ])
                  }
                >
                  Add Another Document
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  {
    /* Dynamic Document Upload Rows */
  }
  {
    documents.map((doc, idx) => (
      <div key={idx} className="form-group doc-upload-box">
        <label className="form-label">Document {idx + 1}</label>
        <div className="doc-row">
          {/* Document Type */}
          <select
            className="form-input"
            value={doc.docType}
            onChange={(e) => handleDocChange(idx, "docType", e.target.value)}
          >
            <option value="">Select Document Type</option>
            {docOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Document Number */}
          <input
            type="text"
            className="form-input"
            placeholder="Enter Document Number"
            value={doc.number}
            onChange={(e) => handleDocChange(idx, "number", e.target.value)}
          />

          {/* Document Number */}
          {doc.docType && (
            <div className="form-group">
              <label className="form-label">Document Number *</label>
              <input
                type="text"
                className="form-input"
                value={doc.number}
                onChange={(e) => handleDocChange(idx, "number", e.target.value)}
                placeholder={`Enter ${doc.docType} number`}
                required
              />
            </div>
          )}

          {/* File Upload */}
          <div className="file-upload">
            <input
              type="file"
              id={`file-${idx}`}
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(idx, e.target.files[0])}
              style={{ display: "none" }}
            />
            <label htmlFor={`file-${idx}`} className="logo-upload-btn">
              Choose File
            </label>
            {doc.file && <span className="file-name">{doc.file.name}</span>}
            {doc.preview && (
              <img
                src={doc.preview}
                alt="preview"
                style={{
                  width: 50,
                  height: 50,
                  objectFit: "cover",
                  marginLeft: 8,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
            )}
          </div>
        </div>
      </div>
    ));
  }

  {
    /* Validation Error */
  }
  {
    formData.error && (
      <p style={{ color: "red", marginTop: 8 }}>{formData.error}</p>
    );
  }

  {
    /* Add More Button */
  }
  <div className="form-actions">
    <button type="button" className="secondary-btn" onClick={addDocumentRow}>
      + Add Document
    </button>
  </div>;

  {
    /* Submit */
  }
  <div className="form-actions">
    <button
      className="btn btn-primary"
      onClick={() => {
        // Validation: At least one document with a file required
        const hasFile = documents.some((doc) => doc.file);
        if (!hasFile) {
          setFormData({
            ...formData,
            error: "Please upload at least one document.",
          });
          return;
        }

        // Clear error and proceed
        setFormData({ ...formData, error: "" });
        submitStep3();
        // setStep(4);
      }}
    >
      Save & Continue
    </button>
  </div>;

  if (loading) {
    return (
      <div className="onboarding-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-form">
        <h1 className="onboarding-main-heading">Welcome {sellerName}!</h1>
        <div className="onboarding-note">
          <span role="img" aria-label="info" style={{ marginRight: 8 }}>
            ℹ️
          </span>
          <span>
            To get started, please set up your profile first. Complete the steps
            below to unlock your seller dashboard and start selling!
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="step-indicators">
          <div className="step-labels">
            <div
              className={`step-label ${
                step === 1 ? "active" : step > 1 ? "completed" : ""
              }`}
            >
              <span className="step-number">1</span>
              <span className="step-name">Basic Details</span>
              {!requiredSteps.includes("basicDetails") && (
                <span className="optional-badge">Optional</span>
              )}
            </div>
            <div
              className={`step-label ${
                step === 2 ? "active" : step > 2 ? "completed" : ""
              }`}
            >
              <span className="step-number">2</span>
              <span className="step-name">Shop Timing</span>
              {!requiredSteps.includes("shopTiming") && (
                <span className="optional-badge">Optional</span>
              )}
            </div>
            <div
              className={`step-label ${
                step === 3 ? "active" : step > 3 ? "completed" : ""
              }`}
            >
              <span className="step-number">3</span>
              <span className="step-name">Legal Documents</span>
              {!requiredSteps.includes("legalDocuments") && (
                <span className="optional-badge">Optional</span>
              )}
            </div>
          </div>
        </div>

        {/* Step rendering */}
        {step === 1
          ? renderBasicDetailsForm()
          : step === 2
          ? renderTimingForm()
          : step === 3
          ? renderGSTForm()
          : null}

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

          {/* Skip button for optional steps */}
          {step < 3 && !isCurrentStepRequired() && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleSkipStep}
              disabled={loading}
              style={{ marginLeft: "10px" }}
            >
              <FaForward style={{ marginRight: "5px" }} />
              Skip This Step
            </button>
          )}

          {/* Save Document button for step 3 */}
          {step === 3 && !isDocsSubmitted && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={submitStep3}
              disabled={loading}
              style={{ marginLeft: "10px" }}
            >
              Save Document
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={loading}
              style={{ marginLeft: "10px" }}
            >
              {isCurrentStepRequired() ? "Next" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
              style={{ marginLeft: "10px" }}
            >
              {loading ? "Completing Profile..." : "Complete Profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
