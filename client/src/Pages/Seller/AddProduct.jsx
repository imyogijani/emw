/* eslint-disable no-unused-vars */
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../utils/errorHandler";
import axios from "../../utils/axios";
import "../../App.css";
import "./SellerProducts.css";
import { Button, Input } from "../../Components/Reusable";
import { showInfoToast } from "../../utils/muiAlertHandler.jsx";

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [hsnSearch, setHsnSearch] = useState("");
  const [showHsnDropdown, setShowHsnDropdown] = useState(false);
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
    technicalDetailsId: "6878d66d910126f21713e286",
    hsnCode: "",
    gstPercentage: 0, // Input
    finalPrice: 0, // Auto calculate
    gstAmount: 0, // Auto calculate
    commissionRate: 0, // Auto calculate
    commissionAmount: 0, // Auto calculate
    sellerEarning: 0, // Auto calculate
  });
  const [gstVerified, setGstVerified] = useState(false);

  // Technical Details States
  const [showTechModal, setShowTechModal] = useState(false);
  const [techAttributes, setTechAttributes] = useState([]);
  const [technicalDetails, setTechnicalDetails] = useState(null); // {id, title}
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
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);
  const imageInputRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchSellerInfo();
  }, []);

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
      // toast.error("Error fetching categories");
      console.error("Error fetching categories:", error);
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
  const fetchSellerInfo = async () => {
    const res = await axios.get("/api/sellers/me");
    if (res.data.success) {
      setGstVerified(res.data.seller.gstVerified); // ✅ backend ka seller info
    }
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

  const selectHsnCode = (hsn) => {
    setFormData((prev) => ({
      ...prev,
      hsnCode: hsn.HSN_CD,
    }));
    setHsnSearch(`${hsn.HSN_CD} - ${hsn.HSN_Description}`);
    setShowHsnDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      if (file) {
        reader.readAsDataURL(file);
      }
    } else if (
      name === "price" ||
      name === "stock" ||
      name === "discount" ||
      name === "gstPercentage"
    ) {
      // Ensure only positive numbers
      const numberValue = parseFloat(value);
      if (!isNaN(numberValue) && numberValue >= 0) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        subcategory: "", // Reset subcategory when category changes
      }));
    } else if (name === "brand") {
      setFormData((prev) => ({
        ...prev,
        [name]: value, // 👈 bas ye rakhna hai
      }));
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
      image: files, //  store array of files
    }));

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showErrorToast(
        "Product name is required",
        "Add Product - Form Validation"
      );
      return false;
    }
    if (!formData.category) {
      showErrorToast(
        "Please select a category",
        "Add Product - Form Validation"
      );
      return false;
    }
    const selectedCategoryObj = categories.find(
      (cat) => cat._id === formData.category
    );
    if (
      selectedCategoryObj &&
      selectedCategoryObj.children &&
      selectedCategoryObj.children.length > 0 &&
      !formData.subcategory
    ) {
      showErrorToast(
        "Please select a subcategory",
        "Add Product - Form Validation"
      );
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      showErrorToast(
        "Please enter a valid price",
        "Add Product - Form Validation"
      );
      return false;
    }
    if (
      formData.discount &&
      (parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100)
    ) {
      showErrorToast(
        "Discount must be between 0 and 100",
        "Add Product - Form Validation"
      );
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      showErrorToast(
        "Please enter a valid stock quantity",
        "Add Product - Form Validation"
      );
      return false;
    }
    if (!formData.description.trim()) {
      showErrorToast(
        "Product description is required",
        "Add Product - Form Validation"
      );
      return false;
    }
    if (!formData.image) {
      showErrorToast(
        "Product image is required",
        "Add Product - Form Validation"
      );
      return false;
    }
    if (
      gstVerified &&
      (!formData.gstPercentage ||
        parseFloat(formData.gstPercentage) < 0 ||
        parseFloat(formData.gstPercentage) > 28)
    ) {
      showErrorToast(
        "Please enter a valid GST percentage (0-28%)",
        "Add Product - Form Validation"
      );
      return false;
    }
    return true;
  };
  // assuming you save email on login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user.email === "demo@seller.com") {
      showInfoToast(
        "This is a demo account. You cannot add products.",
        "AddProduct - Demo Account"
      );
      return; //  stop here
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const productData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "image") {
          formData.image.forEach((img) => {
            productData.append("images", img);
          });
        } else if (key === "subcategory" && !formData.subcategory) {
          // Skip appending subcategory if it's empty
          return;
        } else if (
          key === "discount" &&
          (formData.discount === "" || formData.discount === null)
        ) {
          // Skip appending discount if it's empty or null
          return;
        } else if (key !== "variants") {
          productData.append(key, formData[key]);
        }
      });

      // ✅ debug FormData
      for (let [key, val] of productData.entries()) {
        console.log("FormData ->", key, val);
      }

      const response = await axios.post("/api/products/add", productData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const productId = response.data.product._id;
      for (const variant of formData.variants) {
        await axios.post(
          "/api/variants/add",
          { ...variant, productId } //  yaha productId attach hoga
        );
      }

      if (response.data.success) {
        showSuccessToast("Product added successfully!", "Product Creation");
        setFormData({
          name: "",
          description: "",
          price: "",
          discount: "",
          category: "",
          subcategory: "",
          stock: "",
          image: [],
          status: "In Stock",
          variants: [],
          technicalDetailsId: "",
        });
        setImagePreview([]);
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      }
    } catch (error) {
      showErrorToast(error, "Failed to add product", {
        operation: "addProduct",
        productName: formData.name,
        category: formData.category,
        hasImages: formData.image.length > 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    navigate("/seller/products");
  };
  const addVariant = () => {
    const newVariants = [
      ...formData.variants,
      { color: "", size: "", price: "", stock: "" }, //  align with backend schema
    ];
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index][field] = value;
    setFormData({ ...formData, variants: updated });
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

  const saveTechnicalDetails = async () => {
    if (!techForm.title || !techForm.weight || !techForm.dimensions.length) {
      showErrorToast("Title, dimensions and weight are required");
      return;
    }

    try {
      // const token = localStorage.getItem("token");
      const response = await axios.post("/api/technical-details", techForm);

      if (response.data) {
        const tech = response.data.technicalDetails;
        setTechnicalDetails({ id: tech._id, title: tech.title });
        setFormData((prev) => ({
          ...prev,
          technicalDetailsId: tech._id,
        }));
        showSuccessToast("Technical details saved");
        setShowTechModal(false);
      }
    } catch (error) {
      showErrorToast("Error saving technical details", error);
    }
  };

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
  useEffect(() => {
    const price = Number(formData.price) || 0; // Seller give price (GST included)
    const discount = Number(formData.discount) || 0;
    const gstPercentage = Number(formData.gstPercentage) || 0;

    // Step 1: Discount ke baad ka price (Customer ko dena hoga)
    let finalPrice = price;
    if (discount > 0) {
      finalPrice = price - (price * discount) / 100;
    }

    // Step 2: GST Amount calculate (sirf info ke liye, kyunki price already GST included hai)
    const gstAmount = (finalPrice * gstPercentage) / (100 + gstPercentage);

    // Step 3: Commission rate slab
    const commissionRate = finalPrice > 10000 ? 4 : 7;

    // Step 4: Commission amount
    const commissionAmount = (finalPrice * commissionRate) / 100;

    // Step 5: Seller earning (Final price - Commission)
    const sellerEarning = finalPrice - commissionAmount;

    // Update state
    setFormData((prev) => ({
      ...prev,
      finalPrice: Number(finalPrice.toFixed(2)), // Discount ke baad customer price
      gstAmount: Number(gstAmount.toFixed(2)), // Info ke liye GST part
      commissionRate, // Slab wise rate
      commissionAmount: Number(commissionAmount.toFixed(2)),
      sellerEarning: Number(sellerEarning.toFixed(2)), // Seller ke haath me bacha
    }));
  }, [formData.price, formData.discount, formData.gstPercentage]);

  return (
    <div className="admin-products">
      <div className="admin-header">
        <div>
          <h1>Add New Product</h1>
          <p className="admin-subtitle">Create a new product listing</p>
        </div>
      </div>
      <div className="products-container">
        <div className="form-wrapper">
          <form
            onSubmit={handleSubmit}
            className="add-product-form enhanced-form"
          >
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="Enter product name"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {subcategories.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="subcategory">Subcategory</label>
                    <select
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select a subcategory</option>
                      {subcategories.map((subcat) => (
                        <option key={subcat._id} value={subcat._id}>
                          {subcat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {brands.length > 0 && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="brand">Brand</label>
                    <select
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="hsnCode">HSN/SAC Code</label>
                <div
                  className="hsn-search-container"
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    id="hsnCode"
                    name="hsnCode"
                    value={hsnSearch}
                    onChange={handleHsnSearch}
                    onFocus={() => setShowHsnDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowHsnDropdown(false), 200)
                    }
                    placeholder="Search HSN/SAC code or description"
                    className="form-input hsn-search-input"
                  />
                  {showHsnDropdown && hsnCodes.length > 0 && (
                    <div
                      className="hsn-dropdown"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 1000,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      {hsnCodes.map((hsn) => (
                        <div
                          key={hsn._id}
                          onClick={() => selectHsnCode(hsn)}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee",
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = "#f5f5f5")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = "white")
                          }
                        >
                          <strong>{hsn.HSN_CD}</strong> - {hsn.HSN_Description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Pricing & Inventory</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price (INR) *</label>
                  <Input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter product price in INR"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="discount">Discount (%)</label>
                  <Input
                    type="number"
                    id="discount"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Enter discount percentage (optional)"
                    className="form-input"
                  />
                </div>
                {/* GST Percentage Field */}
                <div className="form-group">
                  <label htmlFor="gstPercentage">GST (%) *</label>
                  <Input
                    type="number"
                    id="gstPercentage"
                    name="gstPercentage"
                    value={formData.gstPercentage}
                    onChange={handleChange}
                    min="0"
                    max="28"
                    step="0.01"
                    placeholder="Enter GST percentage"
                    className="form-input"
                    required
                    disabled={!gstVerified}
                  />
                  {!gstVerified && (
                    <small
                      className="form-help-text"
                      style={{ color: "#e74c3c" }}
                    >
                      Complete GST verification to enable this field
                    </small>
                  )}
                </div>

                {/* Final Price Preview */}
                {/* <div className="form-group">
            <label>Final Price (calculated)</label>
            <Input type="text" value={formData.finalPrice} readOnly />
          </div> */}

                {/* Summary Section */}
                <div className="summary-card">
                  <h3>Price Summary</h3>

                  <div className="summary-item">
                    <span>Final Price (after discount)</span>
                    <span className="value">{formData.finalPrice}</span>
                  </div>

                  <div className="summary-item">
                    <span>GST Amount</span>
                    <span className="value">₹{formData.gstAmount}</span>
                  </div>

                  <div className="summary-item">
                    <span>Commission Rate</span>
                    <span className="value">{formData.commissionRate}%</span>
                  </div>

                  <div className="summary-item">
                    <span>Commission Amount</span>
                    <span className="value">{formData.commissionAmount}</span>
                  </div>

                  <div className="summary-item highlight">
                    <span>Seller Earning</span>
                    <span>{formData.sellerEarning}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Stock Quantity *</label>
                  <Input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    required
                    placeholder="0"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Product Details</h3>
              <div className="form-row">
                {/* <div className="form-group">
                  <label htmlFor="stock">Stock Quantity *</label>
                  <Input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    required
                    placeholder="0"
                  />
                </div> */}

                {/* Technical Details Section */}
                <div className="form-group">
                  <label>Technical Details</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <Input
                      type="text"
                      readOnly
                      value={
                        technicalDetails
                          ? // ? `${technicalDetails.title} (${technicalDetails.id})`
                            `${technicalDetails.title}`
                          : "No Technical Details Linked"
                      }
                    />
                    <Button
                      type="button"
                      onClick={() => setShowTechModal(true)}
                    >
                      + Add Technical Details
                    </Button>
                  </div>
                </div>

                {/* Technical Details Modal */}
                {showTechModal && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <h2>Add Technical Details</h2>
                      {/* {console.log("techForm values: ", techForm)} */}
                      {techAttributes.map((attr) => (
                        <div className="form-group" key={attr.key}>
                          <label>
                            {attr.label} {attr.required ? "*" : ""}
                          </label>
                          {attr.type === "object" ? (
                            <div style={{ display: "flex", gap: "5px" }}>
                              {["length", "width", "height"].map((dim) => (
                                <Input
                                  key={dim}
                                  type="number"
                                  name={`${attr.key}.${dim}`}
                                  placeholder={dim}
                                  value={techForm[attr.key]?.[dim] || ""}
                                  onChange={handleTechChange}
                                />
                              ))}
                              <Input
                                type="text"
                                name={`${attr.key}.unit`}
                                placeholder="Unit"
                                value={techForm[attr.key]?.unit || ""}
                                onChange={handleTechChange}
                              />
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

                      {/* Optional fields */}
                      <div className="form-group">
                        <label>Processor</label>
                        <Input
                          type="text"
                          name="processor"
                          value={techForm.processor}
                          onChange={handleTechChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>RAM</label>
                        <Input
                          type="text"
                          name="ram"
                          value={techForm.ram}
                          onChange={handleTechChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Storage</label>
                        <Input
                          type="text"
                          name="storage"
                          value={techForm.storage}
                          onChange={handleTechChange}
                        />
                      </div>

                      <div className="modal-actions">
                        <Button type="button" onClick={saveTechnicalDetails}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowTechModal(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    required
                    maxLength={500}
                    placeholder="Enter product description"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image">Product Images *</label>
                  <Input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                    multiple
                    required
                    ref={imageInputRef}
                  />
                  {imagePreview.length > 0 && (
                    <div className="image-preview-group">
                      {imagePreview.map((src, index) => (
                        <img key={index} src={src} alt={`Preview ${index}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Product Variants</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Variants (optional)</label>
                  <Button type="button" onClick={addVariant}>
                    + Add Variant
                  </Button>
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="variant-row">
                      <Input
                        type="text"
                        placeholder="Color"
                        value={variant.color}
                        onChange={(e) =>
                          updateVariant(index, "color", e.target.value)
                        }
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Size"
                        value={variant.size}
                        onChange={(e) =>
                          updateVariant(index, "size", e.target.value)
                        }
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(index, "price", e.target.value)
                        }
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Stock"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(index, "stock", e.target.value)
                        }
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Adding..." : "Add Product"}
              </Button>
              <Button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
