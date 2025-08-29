import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../utils/errorHandler";
import axios from "../../utils/axios";
import "../../App.css";
import "./SellerProducts.css";
import { Button, Input } from "../../Components/Reusable";
import { toast } from "react-toastify";

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
  });

  // Technical Details States
  const [showTechModal, setShowTechModal] = useState(false);
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
    } else if (name === "price" || name === "stock" || name === "discount") {
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
    return true;
  };
  // assuming you save email on login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user.email === "demo@seller.com") {
      toast.info("This is a demo account. You cannot add products.");
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

      const response = await axios.post("/api/products/add", productData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
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
    if (name.startsWith("dimensions.")) {
      const dimKey = name.split(".")[1];
      setTechForm((prev) => ({
        ...prev,
        dimensions: { ...prev.dimensions, [dimKey]: value },
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
    } else {
      setBrands([]);
      setFormData((prev) => ({ ...prev, brand: "" }));
    }
  }, [formData.subcategory]);

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

  return (
    <div className="admin-products">
      <div className="admin-header">
        <div>
          <h1>Add New Product</h1>
          <p className="admin-subtitle">Create a new product listing</p>
        </div>
      </div>
      <div className="products-container">
        <form
          onSubmit={handleSubmit}
          className="add-product-form"
          style={{ width: "100%" }}
        >
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
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

          {/* Brand Dropdown */}

          {brands.length > 0 && (
            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="form-control"
                disabled={!brands.length} // disable if no brands
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
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
                onBlur={() => setTimeout(() => setShowHsnDropdown(false), 200)}
                placeholder="Search HSN/SAC code or description"
                className="hsn-search-input"
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
            />
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
            />
          </div>

          {/* Technical Details Section */}
          <div className="form-group">
            <label>Technical Details</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Input
                type="text"
                readOnly
                value={
                  technicalDetails
                    ? `${technicalDetails.title} (${technicalDetails.id})`
                    : "No Technical Details Linked"
                }
              />
              <Button type="button" onClick={() => setShowTechModal(true)}>
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
                <div className="form-group">
                  <label>Title *</label>
                  <Input
                    type="text"
                    name="title"
                    value={techForm.title}
                    onChange={handleTechChange}
                  />
                </div>
                <div className="form-group">
                  <label>Model Number</label>
                  <Input
                    type="text"
                    name="modelNumber"
                    value={techForm.modelNumber}
                    onChange={handleTechChange}
                  />
                </div>
                <div className="form-group">
                  <label>Weight (grams) *</label>
                  <Input
                    type="number"
                    name="weight"
                    value={techForm.weight}
                    onChange={handleTechChange}
                  />
                </div>
                <div className="form-group">
                  <label>Dimensions *</label>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <Input
                      type="number"
                      name="dimensions.length"
                      placeholder="Length"
                      value={techForm.dimensions.length}
                      onChange={handleTechChange}
                    />
                    <Input
                      type="number"
                      name="dimensions.width"
                      placeholder="Width"
                      value={techForm.dimensions.width}
                      onChange={handleTechChange}
                    />
                    <Input
                      type="number"
                      name="dimensions.height"
                      placeholder="Height"
                      value={techForm.dimensions.height}
                      onChange={handleTechChange}
                    />
                    <Input
                      type="text"
                      name="dimensions.unit"
                      placeholder="Unit"
                      value={techForm.dimensions.unit}
                      onChange={handleTechChange}
                    />
                  </div>
                </div>

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
                  <Button type="button" onClick={() => setShowTechModal(false)}>
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
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
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
  );
};

export default AddProduct;
