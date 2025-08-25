/* eslint-disable no-unused-vars */
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
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    // Step 1 - Basic Details
    shopName: "",
    categories: [],
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

    // Step 4 - Subscription
    selectedPlan: null,

    // Step 3 - GST
    gstNumber: "",
  });

  // const [documents, setDocuments] = useState([
  //   {
  //     docType: "aadhaar",
  //     file: null,
  //     preview: null,
  //     number: "",
  //     categories: [],
  //   },
  //   { docType: "pan", file: null, preview: null, number: "", categories: [] },
  //   {
  //     docType: "addressProof",
  //     file: null,
  //     preview: null,
  //     number: "",
  //     categories: [],
  //   },
  // ]);

  // -------------------- STATE --------------------
  const [documents, setDocuments] = useState([
    {
      docType: "",
      file: null,
      preview: null,
      number: "",
      categories: [],
    },
  ]);

  // Doc types exactly as per backend schema
  const docOptions = [
    "aadhaar",
    "pan",
    "gst",
    "udyam",
    "drivingLicense",
    "voterId",
    "electricityBill",
    "passport",
    "rentAgreement",
    "bankPassbook",
    "telephoneBill",
    "bankAccountStatement",
    "birthCertificate",
    "gasConnection",
    "incomeTaxOrder",
    "rationCard",
    "governmentIdCard",
    "certificateOfIncorporation",
    "pensionDocuments",
    "memorandumOfAssociation",
    "partnershipDeed",
    "trustDeed",
    "certificateFromEmployer",
    "lastIssuedPassport",
  ];

  // Document categories mapping as per backend
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

  // Get available categories for selected document type
  const getAvailableCategories = (docType) => {
    return documentCategoriesMap[docType] || [];
  };

  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

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

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get("/api/subscriptions");
        if (res.data.success) {
          setPlans(res.data.subscriptions);
        } else {
          toast.error(res.data.message || "Failed to load plans");
        }
      } catch (err) {
        console.error("Error fetching subscription plans:", err);
        toast.error("Failed to fetch subscription plans.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/category/get-category");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get("/api/brands");
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to fetch brands");
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
        if (!formData.shopLogo) {
          toast.error("Shop logo is required");
          return false;
        }
        // if (!formData.shopAddress) {
        //   toast.error("Shop address is required");
        //   return false;
        // }
        // if (!formData.location) {
        //   toast.error("Shop location is required");
        //   return false;
        // }
        if (formData.shopImages.length === 0) {
          toast.error("Please upload at least one shop image");
          return false;
        }
        break;
      case 2: {
        // At least one day should be open
        const hasOpenDay = Object.values(formData.workingHours).some(
          (day) => day.isOpen
        );
        if (!hasOpenDay) {
          toast.error("Please select at least one working day");
          return false;
        }
        break;
      }
      case 3:
        if (!formData.selectedPlan) {
          toast.error("Please select a subscription plan");
          return false;
        }
        break;
      // case 4:
      // if (!formData.gstNumber) {
      //   toast.error("GST number is required");
      //   return false;
      // }
      // break;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === 1) {
      await submitStep1();
    } else if (step === 2) {
      await submitStep2();
    } else if (step === 3) {
      await submitStep3();
    }
    setStep(step + 1);
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

      console.log("Final form data to send:", formDataToSend);

      // Complete profile first
      await axios.post("/api/seller/complete-profile", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Start free trial
      await axios.post("/api/seller/start-free-trial");

      toast.success("🎉 Profile completed! Your 7-day free trial has started!");
      // Redirect to seller dashboard
      navigate("/seller/dashboard");
    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete profile"
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------- STEP 1 API --------------------
  const submitStep1 = async () => {
    try {
      setLoading(true);

      // Safe localStorage access
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("User session not found. Please login again.");
        navigate("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const sellerId = user?.sellerId;
      // console.log("User details:", sellerId);

      if (!sellerId) {
        toast.error("Seller ID not found. Please contact support.");
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
      toast.success("Step 1 saved successfully");
      setStep(2);
    } catch (error) {
      console.error("Step 1 submission error:", error);
      toast.error(error.response?.data?.message || "Failed to save Step 1");
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
        toast.error("User session not found. Please login again.");
        navigate("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const sellerId = user?.sellerId;

      if (!sellerId) {
        toast.error("Seller ID not found. Please contact support.");
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

      const response = await axios.post(`/api/shop-timing/${sellerId}`, data);
      toast.success("Shop timings saved successfully");
      setStep(3);
    } catch (error) {
      console.error("Step 2 submission error:", error);
      toast.error(error.response?.data?.message || "Failed to save timings");
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
    updated[index][field] = value;
    
    // If document type changes, reset categories and auto-select all available categories
    if (field === 'docType') {
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
      { docType: "", file: null, preview: null, number: "", categories: [] },
    ]);
  };

  // const handleFileChange = (index, file) => {
  //   const updated = [...documents];
  //   updated[index].file = file;
  //   updated[index].preview = URL.createObjectURL(file);
  //   setDocuments(updated);
  // };

  const submitStep3 = async () => {
    try {
      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr);
      const sellerId = user?.sellerId;

      //  GST number update only if entered
      if (formData.gstNumber && formData.gstNumber.trim() !== "") {
        try {
          await axios.post("/api/sellers/gst-number", {
            gstNumber: formData.gstNumber,
          });
          toast.success("GST number updated successfully 🎉");
        } catch (gstErr) {
          console.error("GST update error:", gstErr);
          toast.error("GST number update failed");
          return; // agar GST invalid ho, process rok do
        }
      }

      const fd = new FormData();
      fd.append("sellerId", sellerId);
      console.log("sellerId:", sellerId);

      documents.forEach((doc) => {
        if (!doc.file || !doc.docType) return;

        const docKey = doc.docType.toLowerCase(); // e.g. "aadhaar", "pan"

        // console.log(`---- Document ${docKey} ----`);
        // console.log("docNumber:", doc.number);
        // console.log("categories:", doc.categories);
        // console.log("file:", doc.file?.name);

        // Match Postman style
        fd.append(docKey, doc.file); // file field
        fd.append(`${docKey}_number`, doc.number);
        fd.append(`${docKey}_categories`, doc.categories.join(","));
      });

      // Debug all formData
      for (let pair of fd.entries()) {
        console.log(pair[0] + ":", pair[1]);
      }

      const response = await axios.post("/api/seller-documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Upload response:", response.data);
      toast.success("Documents uploaded successfully 🎉");
      setStep(4);
    } catch (err) {
      console.error("Upload error:", err);
      
      // More specific error messages
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.status === 400) {
        toast.error("Invalid document data. Please check your inputs.");
      } else if (err.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else if (err.response?.status === 413) {
        toast.error("File size too large. Please use smaller files.");
      } else {
        toast.error("Upload failed. Please try again.");
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
      <button className="logout-btn-onboarding" onClick={handleLogout}>
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

      <div className="form-group">
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
      </div>

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
      </div>

      <div className="form-group">
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
      </div>

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

  const renderSubscriptionForm = () => {
    const selectedPlan = plans.find(plan => plan._id === formData.selectedPlan);
    
    return (
      <div className="form-step">
        <h2 className="step-title">Choose Your Plan</h2>
        <p className="step-description">
          Start with a 7-day free trial, then select a plan that suits your business needs
        </p>

        {/* Free Trial Banner */}
        <div className="free-trial-banner">
          <div className="trial-icon">🎉</div>
          <div className="trial-content">
            <h3>7-Day Free Trial</h3>
            <p>Get full access to all features for 7 days, no payment required!</p>
          </div>
        </div>

        <div className="subscription-plans">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`plan-card ${
                formData.selectedPlan === plan._id ? "selected" : ""
              }`}
              onClick={() => handlePlanSelect(plan._id)}
            >
              <h3 className="plan-title">{plan.planName}</h3>
              <div className="plan-price">
                <span className="monthly-price">₹{plan.pricing.monthly}/month</span>
                {plan.pricing.yearly && (
                  <span className="yearly-price">₹{plan.pricing.yearly}/year</span>
                )}
              </div>
              <ul className="plan-features">
                {plan.includedFeatures.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
              {formData.selectedPlan === plan._id && (
                <div className="selected-badge">Selected</div>
              )}
            </div>
          ))}
        </div>

        {/* UPI Payment Section */}
        {selectedPlan && selectedPlan.upiQrCode && (
          <div className="payment-section">
            <h3 className="payment-title">Payment Information</h3>
            <div className="payment-content">
              <div className="qr-code-section">
                <h4>Scan QR Code to Pay</h4>
                <div className="qr-code-container">
                  <img 
                    src={selectedPlan.upiQrCode} 
                    alt="UPI QR Code" 
                    className="qr-code-image"
                  />
                </div>
                {selectedPlan.upiId && (
                  <p className="upi-id">UPI ID: {selectedPlan.upiId}</p>
                )}
              </div>
              <div className="payment-instructions">
                <h4>Payment Instructions:</h4>
                <ol>
                  <li>Scan the QR code with any UPI app</li>
                  <li>Pay ₹{selectedPlan.pricing.monthly} for monthly plan</li>
                  <li>Take a screenshot of the payment confirmation</li>
                  <li>Click "Start Free Trial" to begin your 7-day trial</li>
                  <li>After trial, your paid subscription will activate</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Trial Terms */}
        <div className="trial-terms">
          <h4>Free Trial Terms:</h4>
          <ul>
            <li>✓ Full access to all features for 7 days</li>
            <li>✓ No payment required to start</li>
            <li>✓ Cancel anytime during trial</li>
            <li>✓ Automatic activation of paid plan after trial (if payment completed)</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderGSTForm = () => (
    <div className="form-step">
      <h2 className="step-title">GST & Documents</h2>
      <p className="step-description">
        Please provide your GST details and upload the required documents.
      </p>

      {/* GST Number */}
      <div className="form-group">
        <label className="form-label">GST Number</label>
        <input
          type="text"
          className="form-input"
          value={formData.gstNumber}
          onChange={(e) =>
            setFormData({ ...formData, gstNumber: e.target.value })
          }
          placeholder="Enter GST number"
        />
      </div>

      {/* Dynamic Document Upload Rows */}
      {documents.map((doc, idx) => (
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

            {/* Categories */}
            <select
              className="form-input"
              multiple
              value={doc.categories}
              onChange={(e) =>
                handleDocChange(
                  idx,
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
      ))}

      {/* Validation Error */}
      {formData.error && (
        <p style={{ color: "red", marginTop: 8 }}>{formData.error}</p>
      )}

      {/* Add More Button */}
      <div className="form-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={addDocumentRow}
        >
          + Add Document
        </button>
      </div>

      {/* Submit */}
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
      </div>
    </div>
  );

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
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {step === 1 && renderBasicDetailsForm()}
        {step === 2 && renderTimingForm()}
        {step === 3 && renderGSTForm()}
        {step === 4 && renderSubscriptionForm()}

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
          {step < 4 ? (
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
              {loading ? "Starting Trial..." : "Start 7-Day Free Trial"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
