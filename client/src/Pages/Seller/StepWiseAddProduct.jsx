/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from "../../utils/errorHandler";
import axios from "../../utils/axios";
import { Button, Input } from "../../Components/Reusable";
import "./SellerProducts.css";
import "./OnboardingForms.css";

const StepWiseAddProduct = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount: "",
    category: "",
    subcategory: "",
    brand: "",
    stock: "",
    image: [],
    status: "In Stock",
    variants: [],
    technicalDetailsId: "",
    hsnCode: "",
    gstPercentage: 0,
    finalPrice: 0,
    gstAmount: 0,
    commissionRate: 0,
    commissionAmount: 0,
    sellerEarning: 0,
  });

  // Data states
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [gstVerified, setGstVerified] = useState(false);

  // Technical details
  const [techAttributes, setTechAttributes] = useState([]);
  const [technicalDetails, setTechnicalDetails] = useState(null);
  const [techForm, setTechForm] = useState({
    title: "",
    modelNumber: "",
    material: "",
    dimensions: { length: "", width: "", height: "", unit: "cm" },
    weight: "",
    warranty: "",
    originCountry: "",
    isReturnable: false,
    careInstructions: "",
    usageInstructions: "",
    certification: "",
    compatibleDevices: "",
    processor: "",
    ram: "",
    storage: "",
    brand: "",
  });

  // HSN search
  const [hsnSearch, setHsnSearch] = useState("");
  const [showHsnDropdown, setShowHsnDropdown] = useState(false);

  const steps = [
    {
      id: "basic_info",
      title: "Basic Information",
      description: "Enter product name, description and category",
      icon: "📝",
    },
    {
      id: "pricing_stock",
      title: "Pricing & Stock",
      description: "Set price, discount and stock quantity",
      icon: "💰",
    },
    {
      id: "technical_details",
      title: "Technical Details",
      description: "Add technical specifications",
      icon: "⚙️",
    },
    {
      id: "images_gst",
      title: "Images & GST",
      description: "Upload images and GST information",
      icon: "🖼️",
    },
    {
      id: "review_submit",
      title: "Review & Submit",
      description: "Review all details and submit",
      icon: "✅",
    },
  ];

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCategories(), fetchSellerInfo()]);
      } catch (error) {
        console.error("Error initializing data:", error);
        showErrorToast("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/category/get-category", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSellerInfo = async () => {
    try {
      const res = await axios.get("/api/sellers/me");
      if (res.data.success) {
        setGstVerified(res.data.seller.gstVerified);
      }
    } catch (error) {
      console.error("Error fetching seller info:", error);
    }
  };

  const fetchBrands = async (subcategoryId) => {
    try {
      const response = await axios.get(`/api/category/${subcategoryId}/brands`);
      if (response.data.success) {
        setBrands(response.data.subcategory.brands);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchHSNCodes = async (searchTerm = "") => {
    try {
      const response = await axios.get(
        `/api/hsn?search=${searchTerm}&limit=20`
      );
      if (response.data.success) {
        setHsnCodes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching HSN codes:", error);
    }
  };

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(
        (cat) => cat._id === formData.category
      );
      if (selectedCategory && selectedCategory.children) {
        setSubcategories(selectedCategory.children);
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  }, [formData.category, categories]);

  // Update brands when subcategory changes
  useEffect(() => {
    if (formData.subcategory) {
      fetchBrands(formData.subcategory);
      fetchTechAttributes(formData.subcategory);
    } else {
      setBrands([]);
      setFormData((prev) => ({ ...prev, brand: "" }));
      setTechForm({}); // reset
      setTechAttributes([]);
    }
  }, [formData.subcategory]);

  const fetchTechAttributes = async (subCategoryId) => {
    try {
      const response = await axios.get(
        `/api/technical-details/attribute/${subCategoryId}`
      );
      if (response.data) {
        setTechAttributes(response.data); // response is array of fields
        // Initialize techForm with empty values
        const initialForm = {};
        response.data.forEach((field) => {
          if (field.type === "object") {
            initialForm[field.key] = {};
          } else {
            initialForm[field.key] = "";
          }
        });
        setTechForm(initialForm);
      }
    } catch (error) {
      console.error("Error fetching technical attributes", error);
    }
  };

  // Calculate pricing
  useEffect(() => {
    const price = Number(formData.price) || 0;
    const discount = Number(formData.discount) || 0;
    const gstPercentage = Number(formData.gstPercentage) || 0;

    let finalPrice = price;
    if (discount > 0) {
      finalPrice = price - (price * discount) / 100;
    }

    const gstAmount = (finalPrice * gstPercentage) / (100 + gstPercentage);
    const commissionRate = finalPrice > 10000 ? 4 : 7;
    const commissionAmount = (finalPrice * commissionRate) / 100;
    // const sellerEarning = finalPrice - commissionAmount;
    // Add commission into selling price
    const sellerEarning = finalPrice + commissionAmount;

    setFormData((prev) => ({
      ...prev,
      finalPrice: Number(finalPrice.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      commissionRate,
      commissionAmount: Number(commissionAmount.toFixed(2)),
      sellerEarning: Number(sellerEarning.toFixed(2)),
    }));
  }, [formData.price, formData.discount, formData.gstPercentage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        subcategory: "",
        brand: "",
      }));
    } else if (["price", "stock", "discount", "gstPercentage"].includes(name)) {
      const numberValue = parseFloat(value);
      if (!isNaN(numberValue) && numberValue >= 0) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      image: files,
    }));

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleHsnSearch = (e) => {
    const value = e.target.value;
    setHsnSearch(value);
    setShowHsnDropdown(true);
    if (value.length >= 2) {
      fetchHSNCodes(value);
    } else {
      setHsnCodes([]);
    }
  };

  const handleTechChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [mainKey, subKey] = name.split(".");
      setTechForm((prev) => ({
        ...prev,
        [mainKey]: { ...prev[mainKey], [subKey]: value },
      }));
    } else if (type === "checkbox") {
      setTechForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setTechForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  const selectHsnCode = (hsn) => {
    setFormData((prev) => ({
      ...prev,
      hsnCode: hsn.HSN_CD,
    }));
    setHsnSearch(`${hsn.HSN_CD} - ${hsn.HSN_Description}`);
    setShowHsnDropdown(false);
  };

  const saveTechnicalDetails = async () => {
    if (!techForm.title || !techForm.weight || !techForm.dimensions?.length) {
      showErrorToast("Title, weight, and dimensions are required");
      return;
    }

    try {
      const response = await axios.post(
        `/api/technical-details/${formData.subcategory}`,
        techForm
      );
      if (response.data) {
        const tech = response.data.data; // your API returns saved details
        setTechnicalDetails({ id: tech._id, title: tech.title });
        setFormData((prev) => ({
          ...prev,
          technicalDetailsId: tech._id,
        }));
        showSuccessToast("Technical details saved");
      }
    } catch (error) {
      showErrorToast("Error saving technical details", error);
    }
  };

  const validateCurrentStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case "basic_info": {
        if (!formData.name.trim()) {
          showErrorToast("Product name is required");
          return false;
        }
        if (!formData.category) {
          showErrorToast("Please select a category");
          return false;
        }
        if (!formData.description.trim()) {
          showErrorToast("Product description is required");
          return false;
        }
        const selectedCategory = categories.find(
          (cat) => cat._id === formData.category
        );
        if (selectedCategory?.children?.length > 0 && !formData.subcategory) {
          showErrorToast("Please select a subcategory");
          return false;
        }
        return true;
      }

      case "pricing_stock":
        if (!formData.price || parseFloat(formData.price) <= 0) {
          showErrorToast("Please enter a valid price");
          return false;
        }
        if (!formData.stock || parseInt(formData.stock) < 0) {
          showErrorToast("Please enter a valid stock quantity");
          return false;
        }
        if (
          formData.discount &&
          (parseFloat(formData.discount) < 0 ||
            parseFloat(formData.discount) > 100)
        ) {
          showErrorToast("Discount must be between 0 and 100");
          return false;
        }
        return true;

      case "technical_details":
        // Technical details are optional for some products
        return true;

      case "images_gst":
        if (!formData.image || formData.image.length === 0) {
          showErrorToast("Product image is required");
          return false;
        }
        if (
          gstVerified &&
          (!formData.gstPercentage ||
            parseFloat(formData.gstPercentage) < 0 ||
            parseFloat(formData.gstPercentage) > 28)
        ) {
          showErrorToast("Please enter a valid GST percentage (0-28%)");
          return false;
        }
        return true;

      case "review_submit":
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTechFormSubmit = async () => {
    if (!techForm.title || !techForm.weight || !techForm.dimensions.length) {
      showErrorToast("Title, dimensions and weight are required");
      return;
    }

    try {
      const response = await axios.post("/api/technical-details", techForm);
      if (response.data) {
        const tech = response.data.technicalDetails;
        setTechnicalDetails({ id: tech._id, title: tech.title });
        setFormData((prev) => ({
          ...prev,
          technicalDetailsId: tech._id,
        }));
        showSuccessToast("Technical details saved");
      }
    } catch (error) {
      showErrorToast("Error saving technical details");
    }
  };

  const handleFinalSubmit = async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user?.email === "demo@seller.com") {
      showInfoToast("This is a demo account. You cannot add products.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const productData = new FormData();

      // Append all form data
      Object.keys(formData).forEach((key) => {
        if (key === "subcategory" && !formData[key]) {
          // Skip if empty
          return;
        }
        if (key === "image") {
          formData.image.forEach((file) => {
            productData.append("images", file);
          });
        } else if (key === "variants") {
          productData.append(key, JSON.stringify(formData[key]));
        } else {
          productData.append(key, formData[key]);
        }
      });
      for (let [key, val] of productData.entries()) {
        console.log("FormData ->", key, val);
      }

      const response = await axios.post("/api/products/add", productData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        showSuccessToast("Product added successfully!");
        navigate("/seller/products");
      }
    } catch (error) {
      showErrorToast("Error adding product");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case "basic_info":
        return (
          <BasicInfoStep
            formData={formData}
            categories={categories}
            subcategories={subcategories}
            brands={brands}
            onChange={handleInputChange}
          />
        );

      case "pricing_stock":
        return (
          <PricingStockStep
            formData={formData}
            onChange={handleInputChange}
            gstVerified={gstVerified}
          />
        );

      case "technical_details":
        return (
          <TechnicalDetailsStep
            techForm={techForm}
            setTechForm={setTechForm}
            technicalDetails={technicalDetails}
            setTechnicalDetails={setTechnicalDetails}
            onSubmit={saveTechnicalDetails}
            techAttributes={techAttributes}
            handleTechChange={handleTechChange}
          />
        );

      case "images_gst":
        return (
          <ImagesGstStep
            formData={formData}
            imagePreview={imagePreview}
            hsnSearch={hsnSearch}
            hsnCodes={hsnCodes}
            showHsnDropdown={showHsnDropdown}
            gstVerified={gstVerified}
            onChange={handleInputChange}
            onImageChange={handleImageChange}
            onHsnSearch={handleHsnSearch}
            onSelectHsn={selectHsnCode}
          />
        );

      case "review_submit":
        return (
          <ReviewSubmitStep
            formData={formData}
            imagePreview={imagePreview}
            categories={categories}
            subcategories={subcategories}
            brands={brands}
            technicalDetails={technicalDetails}
          />
        );

      default:
        return <div>Unknown step</div>;
    }
  };

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
        {/* Header */}
        <div className="onboarding-header">
          <h1>Add New Product</h1>
          <p>Create your product listing step by step</p>
        </div>

        {/* Progress Steps */}
        <div className="step-progress">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`step-item ${index === currentStep ? "active" : ""} ${
                index < currentStep ? "completed" : ""
              }`}
            >
              <div className="step-number">
                {index < currentStep ? "✓" : index + 1}
              </div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="step-content">
          <div className="step-header">
            <div className="step-icon">{steps[currentStep].icon}</div>
            <h2>{steps[currentStep].title}</h2>
            <p>{steps[currentStep].description}</p>
          </div>

          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="step-navigation">
          <Button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="btn-secondary"
          >
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Submitting..." : "Submit Product"}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext} className="btn-primary">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Step Components
const BasicInfoStep = ({
  formData,
  categories,
  subcategories,
  brands,
  onChange,
}) => (
  <div className="form-section">
    <div className="form-group">
      <label htmlFor="name">Product Name *</label>
      <Input
        type="text"
        id="name"
        name="name"
        value={formData.name}
        onChange={onChange}
        placeholder="Enter product name"
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="description">Description *</label>
      <textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={onChange}
        placeholder="Describe your product..."
        rows={4}
        required
      />
    </div>

    <div className="form-row">
      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={onChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {subcategories.length > 0 && (
        <div className="form-group">
          <label htmlFor="subcategory">Subcategory *</label>
          <select
            id="subcategory"
            name="subcategory"
            value={formData.subcategory}
            onChange={onChange}
            required
          >
            <option value="">Select Subcategory</option>
            {subcategories.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>

    {brands.length > 0 && (
      <div className="form-group">
        <label htmlFor="brand">Brand</label>
        <select
          id="brand"
          name="brand"
          value={formData.brand}
          onChange={onChange}
        >
          <option value="">Select Brand</option>
          {brands.map((brand) => (
            <option key={brand._id} value={brand._id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);

const PricingStockStep = ({ formData, onChange, gstVerified }) => (
  <div className="form-section">
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="price">Price (₹) *</label>
        <Input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={onChange}
          placeholder="0.00"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="discount">Discount (%)</label>
        <Input
          type="number"
          id="discount"
          name="discount"
          value={formData.discount}
          onChange={onChange}
          placeholder="0"
          min="0"
          max="100"
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="stock">Stock Quantity *</label>
      <Input
        type="number"
        id="stock"
        name="stock"
        value={formData.stock}
        onChange={onChange}
        placeholder="0"
        min="0"
        required
      />
    </div>

    {gstVerified && (
      <div className="form-group">
        <label htmlFor="gstPercentage">GST Percentage *</label>
        <Input
          type="number"
          id="gstPercentage"
          name="gstPercentage"
          value={formData.gstPercentage}
          onChange={onChange}
          placeholder="0"
          min="0"
          max="28"
          step="0.01"
        />
      </div>
    )}

    {/* Pricing Summary */}
    {formData.price && (
      <div className="pricing-summary">
        <h4>Pricing Summary</h4>
        <div className="pricing-row">
          <span>Base Price:</span>
          <span>₹{formData.price}</span>
        </div>
        {formData.discount > 0 && (
          <div className="pricing-row">
            <span>After Discount:</span>
            <span>₹{formData.finalPrice}</span>
          </div>
        )}
        <div className="pricing-row">
          <span>Commission ({formData.commissionRate}%):</span>
          <span>₹{formData.commissionAmount}</span>
        </div>
        {gstVerified && (
          <div className="pricing-row">
            <span>GST Charge: </span>
            <span>₹{formData.gstAmount}</span>
          </div>
        )}

        <div className="pricing-row total">
          <span>Your Earning:</span>
          <span>₹{formData.sellerEarning}</span>
        </div>
      </div>
    )}
  </div>
);

const TechnicalDetailsStep = ({
  techForm,
  setTechForm,
  technicalDetails,
  setTechnicalDetails,
  onSubmit,
  techAttributes,
  handleTechChange,
}) => (
  <div className="form-section">
    <p className="step-note">
      Technical details help customers understand your product better. This step
      is optional.
    </p>

    {technicalDetails ? (
      <div className="tech-details-saved">
        <h4>✅ Technical Details Saved</h4>
        <p>Title: {technicalDetails.title}</p>
        <Button
          type="button"
          onClick={() => setTechnicalDetails(null)}
          className="btn-secondary"
        >
          Edit Details
        </Button>
      </div>
    ) : (
      <>
        <div className="form-row">
          <div className="form-group">
            {techAttributes?.map((attr) => (
              <div className="form-group" key={attr.key}>
                <label>
                  {attr.label} {attr.required ? "*" : ""}
                </label>
                {attr.type === "object" ? (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Input
                      type="number"
                      name={`${attr.key}.length`}
                      placeholder="Length"
                      value={techForm[attr.key]?.length || ""}
                      onChange={handleTechChange}
                    />
                    <Input
                      type="number"
                      name={`${attr.key}.width`}
                      placeholder="Width"
                      value={techForm[attr.key]?.width || ""}
                      onChange={handleTechChange}
                    />
                    <Input
                      type="number"
                      name={`${attr.key}.height`}
                      placeholder="Height"
                      value={techForm[attr.key]?.height || ""}
                      onChange={handleTechChange}
                    />
                    <select
                      name={`${attr.key}.unit`}
                      value={techForm[attr.key]?.unit || "cm"}
                      onChange={handleTechChange}
                      style={{
                        padding: "6px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                      <option value="inch">inch</option>
                    </select>
                  </div>
                ) : attr.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    name={attr.key}
                    checked={techForm[attr.key] || false}
                    onChange={handleTechChange}
                  />
                ) : (
                  <Input
                    type={attr.type === "number" ? "number" : "text"}
                    name={attr.key}
                    value={techForm[attr.key]}
                    onChange={handleTechChange}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Button type="button" onClick={onSubmit} className="btn-primary">
          Save Technical Details
        </Button>
      </>
    )}
  </div>
);

const ImagesGstStep = ({
  formData,
  imagePreview,
  hsnSearch,
  hsnCodes,
  showHsnDropdown,
  gstVerified,
  onChange,
  onImageChange,
  onHsnSearch,
  onSelectHsn,
}) => (
  <div className="form-section">
    <div className="form-group">
      <label htmlFor="image">Product Images *</label>
      <input
        type="file"
        id="image"
        name="image"
        onChange={onImageChange}
        multiple
        accept="image/*"
        className="file-input"
      />
      <p className="form-note">
        Upload up to 5 images. First image will be the main image.
      </p>
    </div>

    {imagePreview.length > 0 && (
      <div className="image-preview-grid">
        {imagePreview.map((preview, index) => (
          <div key={index} className="image-preview-item">
            <img src={preview} alt={`Preview ${index + 1}`} />
            {index === 0 && <span className="main-image-badge">Main</span>}
          </div>
        ))}
      </div>
    )}

    {gstVerified && (
      <>
        <div className="form-group hsn-search-group">
          <label htmlFor="hsnSearch">HSN Code</label>
          <div className="hsn-search-container">
            <Input
              type="text"
              id="hsnSearch"
              name="hsnSearch"
              value={hsnSearch}
              onChange={onHsnSearch}
              placeholder="Search HSN code..."
            />
            {showHsnDropdown && hsnCodes.length > 0 && (
              <div className="hsn-dropdown">
                {hsnCodes.map((hsn) => (
                  <div
                    key={hsn.HSN_CD}
                    className="hsn-item"
                    onClick={() => onSelectHsn(hsn)}
                  >
                    <strong>{hsn.HSN_CD}</strong> - {hsn.HSN_Description}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="gstPercentage">GST Percentage *</label>
          <Input
            type="number"
            id="gstPercentage"
            name="gstPercentage"
            value={formData.gstPercentage}
            onChange={onChange}
            placeholder="0"
            min="0"
            max="28"
            step="0.01"
            required
          />
        </div>
      </>
    )}
  </div>
);

const ReviewSubmitStep = ({
  formData,
  imagePreview,
  categories,
  subcategories,
  brands,
  technicalDetails,
}) => {
  const getCategoryName = (id) => {
    const category = categories.find((cat) => cat._id === id);
    return category ? category.name : "Unknown Category";
  };

  const getSubcategoryName = (id) => {
    const subcategory = subcategories.find((sub) => sub._id === id);
    return subcategory ? subcategory.name : "Unknown Subcategory";
  };

  const getBrandName = (id) => {
    const brand = brands.find((b) => b._id === id);
    return brand ? brand.name : "No Brand";
  };

  return (
    <div className="review-section">
      <h3>Review Your Product Details</h3>

      <div className="review-grid">
        <div className="review-card">
          <h4>Basic Information</h4>
          <div className="review-item">
            <span>Name:</span>
            <span>{formData.name}</span>
          </div>
          <div className="review-item">
            <span>Category:</span>
            <span>{getCategoryName(formData.category)}</span>
          </div>
          {formData.subcategory && (
            <div className="review-item">
              <span>Subcategory:</span>
              <span>{getSubcategoryName(formData.subcategory)}</span>
            </div>
          )}
          {formData.brand && (
            <div className="review-item">
              <span>Brand:</span>
              <span>{getBrandName(formData.brand)}</span>
            </div>
          )}
          <div className="review-item">
            <span>Description:</span>
            <span>{formData.description}</span>
          </div>
        </div>

        <div className="review-card">
          <h4>Pricing & Stock</h4>
          <div className="review-item">
            <span>Price:</span>
            <span>₹{formData.price}</span>
          </div>
          {formData.discount > 0 && (
            <div className="review-item">
              <span>Discount:</span>
              <span>{formData.discount}%</span>
            </div>
          )}
          <div className="review-item">
            <span>Final Price:</span>
            <span>₹{formData.finalPrice}</span>
          </div>
          <div className="review-item">
            <span>Stock:</span>
            <span>{formData.stock} units</span>
          </div>
          <div className="review-item">
            <span>Your Earning:</span>
            <span>₹{formData.sellerEarning}</span>
          </div>
        </div>

        {technicalDetails && (
          <div className="review-card">
            <h4>Technical Details</h4>
            <div className="review-item">
              <span>Title:</span>
              <span>{technicalDetails.title}</span>
            </div>
          </div>
        )}

        <div className="review-card">
          <h4>Images & GST</h4>
          <div className="review-item">
            <span>Images:</span>
            <span>{formData.image?.length || 0} uploaded</span>
          </div>
          {formData.hsnCode && (
            <div className="review-item">
              <span>HSN Code:</span>
              <span>{formData.hsnCode}</span>
            </div>
          )}
          {formData.gstPercentage > 0 && (
            <div className="review-item">
              <span>GST:</span>
              <span>{formData.gstPercentage}%</span>
            </div>
          )}
        </div>
      </div>

      {imagePreview.length > 0 && (
        <div className="review-images">
          <h4>Product Images</h4>
          <div className="image-preview-grid">
            {imagePreview.map((preview, index) => (
              <div key={index} className="image-preview-item">
                <img src={preview} alt={`Preview ${index + 1}`} />
                {index === 0 && <span className="main-image-badge">Main</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StepWiseAddProduct;
