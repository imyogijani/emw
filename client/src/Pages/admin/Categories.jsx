/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaChevronRight,
  FaEye,
  FaPlus,
  FaTimes,
  FaLayerGroup,
  FaList,
  FaPercent,
  FaClock,
  FaTag,
  FaTags,
  FaInfoCircle,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";

import "./Categories.css"; // Assuming you'll create this CSS file
import axiosInstance from "../../utils/axios";
import { processImageUrlUnified } from "../../utils/apiConfig";
import OptimizedImage from "../../Components/common/OptimizedImage";

const Categories = () => {
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [brandName, setBrandName] = useState("");
  // const [selectedBrands, setSelectedBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState(null);
  const [categoryImage, setCategoryImage] = useState(null);
  const [editCategoryImage, setEditCategoryImage] = useState(null);
  const [gstPercentage, setGstPercentage] = useState();
  // HSN code state variables removed for categories - now only used for subcategories
  const [subSuggestedHsnCodes, setSubSuggestedHsnCodes] = useState("");
  const [subDefaultHsnCode, setSubDefaultHsnCode] = useState("");
  const [editSubSuggestedHsnCodes, setEditSubSuggestedHsnCodes] = useState("");
  const [editSubDefaultHsnCode, setEditSubDefaultHsnCode] = useState("");

  const [brands, setBrands] = useState([]);
  // const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandLogo, setBrandLogo] = useState(null);

  const [selectedBrands, setSelectedBrands] = useState([]); // selected brands

  const [editSubGstPercentage, setEditSubGstPercentage] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] = useState("");

  const [editingBrand, setEditingBrand] = useState(null);
  const [editBrandName, setEditBrandName] = useState("");
  const [editBrandDescription, setEditBrandDescription] = useState("");
  const [editBrandLogo, setEditBrandLogo] = useState(null);
  const [selectedSubBrands, setSelectedSubBrands] = useState([]);
  const [selectedSubBrandDetails, setSelectedSubBrandDetails] = useState([]);
  const [newBrandName, setNewBrandName] = useState("");

  // View modal states
  const [showViewCategoryModal, setShowViewCategoryModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [showViewSubcategoryModal, setShowViewSubcategoryModal] =
    useState(false);
  const [viewingSubcategory, setViewingSubcategory] = useState(null);
  const [subcategoryBrands, setSubcategoryBrands] = useState([]);

  // const [loading, setLoading] = useState(false);

  const initialLoad = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/category/get-category");
      if (response.data && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      } else {
        setCategories([]);
        console.warn("Invalid API response format:", response.data);
      }
    } catch (err) {
      setError(err);
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name cannot be empty.");
      return;
    }
    if (!categoryImage) {
      toast.error("Please select an image for the category.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", categoryName.trim());
      formData.append("image", categoryImage);
      selectedBrands.forEach((brand) => formData.append("brands[]", brand));

      // HSN codes are now handled only at subcategory level
      // Debug: log the file
      console.log("Uploading category image:", categoryImage);
      // Use your custom axios instance

      const { data } = await axiosInstance.post("/api/category", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setCategoryName("");
      setCategoryImage(null);
      setSelectedBrands([]); // Clear selected brands after adding category
      toast.success(`Category '${categoryName}' added.`);
      await initialLoad();
    } catch (err) {
      toast.error("Failed to add category.");
      console.error(err);
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!subCategoryName.trim() || !selectedCategory) {
      toast.error("Subcategory name and category selection are required.");
      return;
    }
    try {
      const subcategoryData = {
        name: subCategoryName.trim(),
        parent: selectedCategory,
        gstPercentage: gstPercentage || null,
        // defaultHsnCode: subDefaultHsnCode.trim() || "",
        brands: selectedSubBrands,
      };

      // Add HSN code fields if provided
      /* if (subSuggestedHsnCodes.trim()) {
        const hsnArray = subSuggestedHsnCodes
          .split(",")
          .map((code) => code.trim())
          .filter((code) => code);
        subcategoryData.suggestedHsnCodes = hsnArray;
      }
      if (subDefaultHsnCode.trim()) {
        subcategoryData.defaultHsnCode = subDefaultHsnCode.trim();
      } */

      await axiosInstance.post(`/api/category/subcategory`, subcategoryData);
      setSubCategoryName("");
      setSelectedCategory("");
      // setSubSuggestedHsnCodes("");
      // setSubDefaultHsnCode("");
      // setSubDefaultHsnCode("");
      setGstPercentage("");
      setSelectedSubBrands([]);
      setSelectedSubBrandDetails([]);
      toast.success(`Subcategory added successfully.`);
      await initialLoad();
    } catch (err) {
      toast.error("Failed to add subcategory.");
      console.error(err);
    }
  };

  const handleDeleteCategory = (category) => {
    setItemToDelete(category);
    setItemTypeToDelete("category");
    setShowConfirmDeleteModal(true);
  };

  const handleUpdateCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedBrands(category.brands || []); // Populate brands when editing

    // HSN codes are now handled only at subcategory level

    setShowEditCategoryModal(true);
  };

  const handleDeleteSubCategory = (subcategory) => {
    setItemToDelete(subcategory);
    setItemTypeToDelete("subcategory");
    setShowConfirmDeleteModal(true);
  };

  const handleUpdateSubCategory = (subcategory) => {
    setEditingSubCategory(subcategory);
    setNewSubCategoryName(subcategory.name);

    // Populate HSN code fields for subcategory editing
    /* setEditSubSuggestedHsnCodes(
      subcategory.suggestedHsnCodes
        ? subcategory.suggestedHsnCodes.join(", ")
        : ""
    );
    setEditSubDefaultHsnCode(subcategory.defaultHsnCode || ""); */

    setShowEditCategoryModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete?._id) return;

    try {
      await axiosInstance.delete(
        `/api/category/delete-category/${itemToDelete._id}`
      );
      toast.success(`${itemTypeToDelete} deleted successfully.`);
      await initialLoad();
    } catch (err) {
      toast.error(`Failed to delete ${itemTypeToDelete}.`);
      console.error(err);
    } finally {
      setShowConfirmDeleteModal(false);
      setItemToDelete(null);
      setItemTypeToDelete(null);
    }
  };

  const handleCategoryImageChange = (e) => {
    setCategoryImage(e.target.files[0]);
  };

  const handleEditCategoryImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditCategoryImage(e.target.files[0]);
    }
  };

  const handleSaveCategoryUpdate = async () => {
    if (!editingCategory?._id || !newCategoryName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("name", newCategoryName.trim());
      if (editCategoryImage) {
        formData.append("image", editCategoryImage, editCategoryImage.name);
      }

      // Debug: log formData
      for (let [key, value] of formData.entries()) {
        console.log("FormData:", key, value);
      }

      await axiosInstance.patch(
        `/api/category/update-category/${editingCategory._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Category updated successfully.");
      await initialLoad();
      resetEditState();
    } catch (err) {
      toast.error("Failed to update category.");
      console.error(err);
    }
  };

  const handleSaveSubCategoryUpdate = async () => {
    if (!editingSubCategory?._id || !newSubCategoryName.trim()) return;

    try {
      const formData = new FormData();
      formData.append("name", newSubCategoryName.trim());

      // Parent (from dropdown)
      if (selectedParentCategory) {
        formData.append("parent", selectedParentCategory);
      }

      // GST %
      if (editSubGstPercentage) {
        formData.append("gstPercentage", editSubGstPercentage);
      }

      // Brands
      if (selectedSubBrands.length > 0) {
        selectedSubBrands.forEach((brandId) =>
          formData.append("brands[]", brandId)
        );
      }

      // Suggested HSN

      // Default HSN
      /* if (editSubDefaultHsnCode.trim()) {
        formData.append("defaultHsnCode", editSubDefaultHsnCode.trim());
      } */

      // Image (if changed)
      if (editCategoryImage) {
        formData.append("image", editCategoryImage);
      }

      await axiosInstance.patch(
        `/api/category/subcategory/${editingSubCategory._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Subcategory updated successfully.");
      await initialLoad();
      resetEditState();
    } catch (err) {
      toast.error("Failed to update subcategory.");
      console.error(err);
    }
  };

  // const handleAddBrand = () => {
  //   if (brandName.trim() && !selectedBrands.includes(brandName.trim())) {
  //     setSelectedBrands([...selectedBrands, brandName.trim()]);
  //     setBrandName("");
  //   }
  // };

  const handleRemoveBrand = (brandToRemove) => {
    setSelectedBrands(
      selectedBrands.filter((brand) => brand !== brandToRemove)
    );
  };

  const resetEditState = () => {
    setEditingCategory(null);
    setEditingSubCategory(null);
    setNewCategoryName("");
    setNewSubCategoryName("");
    setEditCategoryImage(null);
    setSelectedBrands([]); // Clear selected brands on reset
    // setEditSubSuggestedHsnCodes("");
    // setEditSubDefaultHsnCode("");
    setShowEditCategoryModal(false);
    setEditingBrand(null);
    setEditBrandName("");
    setEditBrandDescription("");
    setEditBrandLogo(null);
  };

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/api/brands");
      setBrands(data.brands || []);
    } catch (error) {
      toast.error("Failed to load brands");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // remove selected brand
  const handleRemoveSelectedBrand = (brandId) => {
    setSelectedSubBrands(selectedSubBrands.filter((id) => id !== brandId));
    setSelectedSubBrandDetails(
      selectedSubBrandDetails.filter((b) => b._id !== brandId)
    );
  };

  const handleBrandSelectForSubcategory = (e) => {
    const brandId = e.target.value;
    const brand = brands.find((b) => b._id === brandId);

    if (!brandId || selectedSubBrands.includes(brandId)) return;

    setSelectedSubBrands([...selectedSubBrands, brandId]);
    setSelectedSubBrandDetails([...selectedSubBrandDetails, brand]);
  };

  // Add brand
  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", brandName.trim());
      formData.append("description", brandDescription.trim());
      if (brandLogo) formData.append("logo", brandLogo);

      await axiosInstance.post("/api/brands/create", formData);
      toast.success("Brand added successfully");
      setBrandName("");
      setBrandDescription("");
      setBrandLogo(null);
      fetchBrands();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add brand");
      console.error(error);
    }
  };

  const handleAddNewBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error("Brand name required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", newBrandName.trim());
      const { data } = await axiosInstance.post("/api/brands/create", formData);

      toast.success("Brand added successfully");
      setBrands([...brands, data.brand]); //  add new brand to dropdown immediately
      setNewBrandName("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add brand");
    }
  };

  // Update brand
  const handleUpdateBrand = async (e) => {
    e.preventDefault();
    if (!editBrandName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", editBrandName.trim());
      formData.append("description", editBrandDescription.trim());
      if (editBrandLogo) formData.append("logo", editBrandLogo);

      await axiosInstance.put(`/api/brands/${editingBrand._id}`, formData);
      toast.success("Brand updated successfully");
      resetEditState();
      fetchBrands();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update brand");
      console.error(error);
    }
  };

  // Delete brand
  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    try {
      await axiosInstance.delete(`/api/brand/${brandId}`);
      toast.success("Brand deleted successfully");
      fetchBrands();
    } catch (error) {
      toast.error("Failed to delete brand");
      console.error(error);
    }
  };

  // View handlers
  const handleViewCategory = (category) => {
    setViewingCategory(category);
    setShowViewCategoryModal(true);
  };

  const handleViewSubcategory = async (subcategory) => {
    setViewingSubcategory(subcategory);
    // Fetch brands for this subcategory
    try {
      const response = await axiosInstance.get(
        `/api/category/${subcategory._id}/brands`
      );
      setSubcategoryBrands(response.data.subcategory?.brands || []);
    } catch (error) {
      console.error("Error fetching subcategory brands:", error);
      setSubcategoryBrands([]);
    }
    setShowViewSubcategoryModal(true);
  };

  const closeViewModals = () => {
    setShowViewCategoryModal(false);
    setShowViewSubcategoryModal(false);
    setViewingCategory(null);
    setViewingSubcategory(null);
    setSubcategoryBrands([]);
  };

  // Set edit mode
  const startEdit = (brand) => {
    setEditingBrand(brand);
    setEditBrandName(brand.name);
    setEditBrandDescription(brand.description || "");
    setEditBrandLogo(null);
  };

  const processCategoryImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "/vite.svg"; // Default image
    }
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }
    return `http://localhost:8080/${imageUrl.replace(/\\/g, "/")}`;
  };

  return (
    <div className="categories-container">
      <div className="admin-header">
        <h1>Categories Management</h1>
        <p className="admin-subtitle">
          Manage product categories and subcategories
        </p>
      </div>

      <div className="category-section">
        <h2>Add New Category</h2>
        <form
          onSubmit={handleAddCategory}
          className="category-form"
          encType="multipart/form-data"
        >
          <input
            className="form-input"
            type="text"
            placeholder="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleCategoryImageChange}
            required
          />
          {/* <div className="brand-input-container">
            <input
              className="form-input"
              type="text"
              placeholder="Brand Name (e.g., Nike, Adidas)"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddBrand}
              className="btn btn-secondary"
            >
              Add Brand
            </button>
          </div>
          <div className="selected-brands-list">
            {selectedBrands.map((brand, index) => (
              <span key={index} className="brand-tag">
                {brand}
                <button type="button" onClick={() => handleRemoveBrand(brand)}>
                  x
                </button>
              </span>
            ))}
          </div> */}

          {/* HSN codes are now handled only at subcategory level */}
          <button type="submit" className="btn btn-primary">
            Add Category
          </button>
        </form>
      </div>

      <div className="subcategory-section">
        <h2>Add New Subcategory</h2>
        <form onSubmit={handleAddSubCategory} className="subcategory-form">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input"
          >
            <option value="">Select a Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Subcategory Name"
            value={subCategoryName}
            onChange={(e) => setSubCategoryName(e.target.value)}
            className="form-input"
          />

          <input
            type="text"
            placeholder="Gst Percentage(e.g., 18)"
            value={gstPercentage}
            onChange={(e) => setGstPercentage(e.target.value)}
            className="form-input"
          />
          {/* <div className="hsn-input-section">
            <input
              className="form-input"
              type="text"
              placeholder="Default HSN Code (e.g., 6403)"
              value={subDefaultHsnCode}
              onChange={(e) => setSubDefaultHsnCode(e.target.value)}
            />
          </div> */}

          {/* <div className="brand-input-container">
            <input
              className="form-input"
              type="text"
              placeholder="Brand Name (e.g., Nike, Adidas)"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddBrand}
              className="btn btn-secondary"
            >
              Add Brand
            </button>
          </div>

          <div className="selected-brands-list">
            {selectedBrands.map((brand, index) => (
              <span key={index} className="brand-tag">
                {brand}
                <button type="button" onClick={() => handleRemoveBrand(brand)}>
                  x
                </button>
              </span>
            ))}
          </div> */}

          <label>Select Brand:</label>
          <select
            onChange={handleBrandSelectForSubcategory}
            className="form-input"
            value="" // reset after select
          >
            <option value="">-- Select Brand --</option>
            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>

          {/* Show selected brands as tags */}
          <div className="selected-brands-list">
            {selectedSubBrandDetails.map((brand) => (
              <span key={brand._id} className="brand-tag">
                {brand.name}
                <button
                  type="button"
                  onClick={() => handleRemoveSelectedBrand(brand._id)}
                >
                  x
                </button>
              </span>
            ))}
          </div>

          {/* Add new brand box */}
          <div className="brand-input-container">
            <input
              type="text"
              placeholder="New Brand Name (e.g. Nike, Adidas)"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="form-input"
            />
            <button
              type="button"
              onClick={handleAddNewBrand}
              className="btn btn-secondary"
            >
              Add Brand
            </button>
          </div>

          <button type="submit" className="btn btn-primary">
            Add Subcategory
          </button>
        </form>
      </div>

      {/* Existing Categories Section Redesigned as Card */}
      <div className="current-categories-section">
        <h2>Existing Categories</h2>
        {loading && <p>Loading categories...</p>}
        {error && <p className="error-message">Error: {error.message}</p>}
        {!loading && categories.length === 0 && <p>No categories found.</p>}
        <div className="category-list">
          {categories.map((cat) => (
            <div key={cat._id} className="enhanced-category-card">
              <div className="category-image-wrapper">
                <img
                  src={processCategoryImageUrl(cat.image)}
                  alt={cat.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/vite.svg";
                  }}
                  className="category-image"
                />
              </div>
              <div className="category-info">
                <h3 className="category-title">{cat.name}</h3>
                <div className="category-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleViewCategory(cat)}
                    title="View Category"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="btn btn-edit"
                    onClick={() => handleUpdateCategory(cat)}
                    title="Edit Category"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDeleteCategory(cat)}
                    title="Delete Category"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showEditCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingCategory ? "Edit Category" : "Edit Subcategory"}</h2>

            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />

            <input
              type="file"
              accept="image/*"
              onChange={handleEditCategoryImageChange}
            />

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveCategoryUpdate}
              >
                Save
              </button>
              <button className="btn btn-secondary" onClick={resetEditState}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Subcategory</h2>

            {/* Parent Category Dropdown */}
            <div className="form-group">
              <label>Parent Category</label>
              <select
                value={selectedParentCategory || editingSubCategory.parent}
                onChange={(e) => setSelectedParentCategory(e.target.value)}
                className="form-input"
              >
                <option value="">-- Select Parent Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Name */}
            <div className="form-group">
              <label>Subcategory Name</label>
              <input
                type="text"
                value={newSubCategoryName}
                onChange={(e) => setNewSubCategoryName(e.target.value)}
                className="form-input"
              />
            </div>

            {/* GST % */}
            <div className="form-group">
              <label>GST Percentage</label>
              <input
                type="number"
                value={editSubGstPercentage}
                onChange={(e) => setEditSubGstPercentage(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Subcategory Image */}
            <div className="form-group">
              <label>Subcategory Image</label>
              {editCategoryImage ? (
                <img
                  src={URL.createObjectURL(editCategoryImage)}
                  alt="Preview"
                  className="image-preview"
                />
              ) : (
                editingSubCategory.image && (
                  <img
                    src={processCategoryImageUrl(editingSubCategory.image)}
                    alt="Subcategory"
                    className="image-preview"
                  />
                )
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditCategoryImage(e.target.files[0])}
              />
            </div>

            {/* HSN Codes Section */}
            {/* <div className="form-group">
              <label>Default HSN Code</label>
              <input
                type="text"
                value={editSubDefaultHsnCode}
                onChange={(e) => setEditSubDefaultHsnCode(e.target.value)}
                placeholder="6403"
                className="form-input"
              />
            </div> */}

            {/* Selected Brands */}
            <div className="form-group">
              <label>Selected Brands</label>
              <div className="selected-brands-list">
                {selectedSubBrandDetails.map((brand) => (
                  <span key={brand._id} className="brand-tag">
                    {brand.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedBrand(brand._id)}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add Brand */}
            <div className="form-group">
              <label>Add Brand</label>
              <select
                onChange={handleBrandSelectForSubcategory}
                className="form-input"
                value=""
              >
                <option value="">-- Select Brand --</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveSubCategoryUpdate}
              >
                Save
              </button>
              <button className="btn btn-secondary" onClick={resetEditState}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content confirm-delete">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete "{itemToDelete?.name}"? This
              action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Category Modal - Redesigned */}
      {showViewCategoryModal && viewingCategory && (
        <div className="modal-overlay">
          <div className="modal-content view-category-modal">
            {/* Enhanced Header with Category Image */}
            <div className="view-modal-header">
              <div className="category-header-content">
                <div className="category-image-container">
                  <img
                    src={processCategoryImageUrl(viewingCategory.image)}
                    alt={viewingCategory.name}
                    className="category-header-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/vite.svg";
                    }}
                  />
                </div>
                <div className="category-header-info">
                  <h2 className="category-title">{viewingCategory.name}</h2>
                  <div className="category-stats">
                    <span className="stat-item">
                      <FaLayerGroup className="stat-icon" />
                      {viewingCategory.children?.length || 0} Subcategories
                    </span>
                  </div>
                </div>
              </div>
              <button className="close-button" onClick={closeViewModals}>
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="view-modal-body">
              <div className="subcategories-container">
                <div className="section-title">
                  <h3>
                    <FaList className="section-icon" />
                    Subcategories Management
                  </h3>
                  <span className="subcategory-count">
                    {viewingCategory.children?.length || 0} items
                  </span>
                </div>

                {viewingCategory.children?.length > 0 ? (
                  <div className="enhanced-subcategory-grid">
                    {viewingCategory.children.map((subCat) => (
                      <div key={subCat._id} className="enhanced-subcategory-card">
                        <div className="subcategory-card-content">
                          <div className="subcategory-main-info">
                            <h4 className="subcategory-name">{subCat.name}</h4>
                            <div className="subcategory-badges">
                              {subCat.gstPercentage && (
                                <span className="enhanced-gst-badge">
                                  <FaPercent className="badge-icon" />
                                  GST {subCat.gstPercentage}%
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="subcategory-actions">
                            <button
                              className="action-btn view-btn"
                              onClick={() => handleViewSubcategory(subCat)}
                              title="View Brands"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="action-btn edit-btn"
                              onClick={() => {
                                closeViewModals();
                                handleUpdateSubCategory(subCat);
                              }}
                              title="Edit Subcategory"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => {
                                closeViewModals();
                                handleDeleteSubCategory(subCat);
                              }}
                              title="Delete Subcategory"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaLayerGroup />
                    </div>
                    <h4>No Subcategories Found</h4>
                    <p>This category doesn't have any subcategories yet.</p>
                    <button 
                      className="btn btn-primary add-subcategory-btn"
                      onClick={() => {
                        closeViewModals();
                        // Add logic to create new subcategory
                      }}
                    >
                      <FaPlus /> Add First Subcategory
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="view-modal-footer">
              <div className="footer-info">
                <span className="last-updated">
                  <FaClock className="info-icon" />
                  Category created
                </span>
              </div>
              <div className="footer-actions">
                <button className="btn btn-outline" onClick={closeViewModals}>
                  Close
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    closeViewModals();
                    handleUpdateCategory(viewingCategory);
                  }}
                >
                  <FaEdit /> Edit Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Subcategory Modal - Redesigned */}
      {showViewSubcategoryModal && viewingSubcategory && (
        <div className="modal-overlay">
          <div className="modal-content view-subcategory-modal">
            {/* Enhanced Header */}
            <div className="view-modal-header subcategory-header">
              <div className="subcategory-header-content">
                <div className="subcategory-icon-container">
                  <FaLayerGroup className="subcategory-icon" />
                </div>
                <div className="subcategory-header-info">
                  <h2 className="subcategory-title">{viewingSubcategory.name}</h2>
                  <div className="subcategory-stats">
                    <span className="stat-item">
                      <FaTag className="stat-icon" />
                      {subcategoryBrands.length} Brands
                    </span>
                    {viewingSubcategory.gstPercentage && (
                      <span className="stat-item">
                        <FaPercent className="stat-icon" />
                        GST {viewingSubcategory.gstPercentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="close-button" onClick={closeViewModals}>
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="view-modal-body">
              {/* Subcategory Information Section */}
              <div className="subcategory-info-container">
                <div className="section-title">
                  <h3>
                    <FaInfoCircle className="section-icon" />
                    Subcategory Information
                  </h3>
                  <button
                    className="edit-subcategory-btn"
                    onClick={() => {
                      closeViewModals();
                      handleUpdateSubCategory(viewingSubcategory);
                    }}
                    title="Edit Subcategory"
                  >
                    <FaEdit /> Edit Details
                  </button>
                </div>
                
                <div className="info-cards-grid">
                  {viewingSubcategory.gstPercentage && (
                    <div className="info-card">
                      <div className="info-card-header">
                        <FaPercent className="info-card-icon" />
                        <span className="info-card-title">GST Rate</span>
                      </div>
                      <div className="info-card-value">
                        {viewingSubcategory.gstPercentage}%
                      </div>
                    </div>
                  )}
                  
                  <div className="info-card">
                    <div className="info-card-header">
                      <FaTag className="info-card-icon" />
                      <span className="info-card-title">Total Brands</span>
                    </div>
                    <div className="info-card-value">
                      {subcategoryBrands.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Brands Management Section */}
              <div className="brands-container">
                <div className="section-title">
                  <h3>
                    <FaTags className="section-icon" />
                    Brand Management
                  </h3>
                  <button
                    className="add-brand-btn"
                    onClick={() => {
                      closeViewModals();
                      handleUpdateSubCategory(viewingSubcategory);
                    }}
                  >
                    <FaPlus /> Add New Brand
                  </button>
                </div>

                {subcategoryBrands.length > 0 ? (
                  <div className="enhanced-brands-grid">
                    {subcategoryBrands.map((brand) => (
                      <div key={brand._id} className="enhanced-brand-card">
                        <div className="brand-card-content">
                          <div className="brand-main-info">
                            <h4 className="brand-name">{brand.name}</h4>
                            {brand.description && (
                              <p className="brand-description">
                                {brand.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="brand-actions-enhanced">
                            <button
                              className="enhanced-action-btn edit-brand-btn"
                              onClick={() => startEdit(brand)}
                              title="Edit Brand"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="enhanced-action-btn delete-brand-btn"
                              onClick={() => handleDeleteBrand(brand._id)}
                              title="Delete Brand"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaTags />
                    </div>
                    <h4>No Brands Found</h4>
                    <p>This subcategory doesn't have any brands associated yet.</p>
                    <button
                      className="btn btn-primary add-first-brand-btn"
                      onClick={() => {
                        closeViewModals();
                        handleUpdateSubCategory(viewingSubcategory);
                      }}
                    >
                      <FaPlus /> Add First Brand
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="view-modal-footer">
              <div className="footer-info">
                <span className="last-updated">
                  <FaClock className="info-icon" />
                  Subcategory details
                </span>
              </div>
              <div className="footer-actions">
                <button className="btn btn-outline" onClick={closeViewModals}>
                  Close
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    closeViewModals();
                    // Navigate back to parent category view
                    const parentCategory = categories.find(cat => 
                      cat.children?.some(child => child._id === viewingSubcategory._id)
                    );
                    if (parentCategory) {
                      setViewingCategory(parentCategory);
                      setShowViewCategoryModal(true);
                    }
                  }}
                >
                  <FaArrowLeft /> Back to Category
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    closeViewModals();
                    handleUpdateSubCategory(viewingSubcategory);
                  }}
                >
                  <FaEdit /> Edit Subcategory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
