/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import "./Categories.css"; // Assuming you'll create this CSS file
import axiosInstance from "../../utils/axios";

const Categories = () => {
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [brandName, setBrandName] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
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
      // Debug: log the file
      console.log("Uploading category image:", categoryImage);
      // Use your custom axios instance
      const { data } = await axiosInstance.post("/api/category", formData);
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
      await axiosInstance.post(`/api/category/subcategory`, {
        name: subCategoryName.trim(),
        parent: selectedCategory,
      });
      setSubCategoryName("");
      setSelectedCategory("");
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
    setEditCategoryImage(e.target.files[0]);
  };

  const handleSaveCategoryUpdate = async () => {
    if (!editingCategory?._id || !newCategoryName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("name", newCategoryName.trim());
      if (editCategoryImage) formData.append("image", editCategoryImage);
      selectedBrands.forEach((brand) => formData.append("brands[]", brand));
      await axiosInstance.post(
        `/api/category/update-category/${editingCategory._id}`,
        formData
      ); // Removed manual Content-Type
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
      await axiosInstance.put(
        `/api/category/update-category/${editingSubCategory._id}`,
        {
          name: newSubCategoryName.trim(),
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

  const handleAddBrand = () => {
    if (brandName.trim() && !selectedBrands.includes(brandName.trim())) {
      setSelectedBrands([...selectedBrands, brandName.trim()]);
      setBrandName("");
    }
  };

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
    setShowEditCategoryModal(false);
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
          <div className="brand-input-container">
            <input
              className="form-input"
              type="text"
              placeholder="Brand Name (e.g., Nike, Adidas)"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            <button type="button" onClick={handleAddBrand} className="btn btn-secondary">
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
          </div>
          <button type="submit" className="btn btn-primary">Add Category</button>
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
        <div className="category-list enhanced-category-list">
          {categories.map((cat) => (
            <div key={cat._id} className="category-item enhanced-category-card">
              <div className="category-image-wrapper">
                <img
                  src={
                    cat.image
                      ? `http://localhost:8080${cat.image}`
                      : "/vite.svg"
                  }
                  alt={cat.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/vite.svg";
                  }}
                  className="category-image"
                />
              </div>
              <div className="category-info">
                <span className="category-title">{cat.name}</span>
                <div className="category-actions">
                  <button
                    className="btn btn-edit"
                    onClick={() => handleUpdateCategory(cat)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    <FaTrashAlt />
                  </button>
                </div>
                {cat.children?.length > 0 && (
                  <div className="subcategory-list">
                    {cat.children.map((subCat) => (
                      <div key={subCat._id} className="subcategory-item">
                        <span>{subCat.name}</span>
                        <div className="subcategory-actions">
                          <button
                            className="btn btn-edit"
                            onClick={() => handleUpdateSubCategory(subCat)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-delete"
                            onClick={() => handleDeleteSubCategory(subCat)}
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
            <div className="brand-input-container">
              <input
                type="text"
                placeholder="Brand Name (e.g., Nike, Adidas)"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
              <button type="button" onClick={handleAddBrand}>
                Add Brand
              </button>
            </div>
            <div className="selected-brands-list">
              {selectedBrands.map((brand, index) => (
                <span key={index} className="brand-tag">
                  {brand}
                  <button
                    type="button"
                    onClick={() => handleRemoveBrand(brand)}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={
                  editingCategory
                    ? handleSaveCategoryUpdate
                    : handleSaveSubCategoryUpdate
                }
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
    </div>
  );
};

export default Categories;
