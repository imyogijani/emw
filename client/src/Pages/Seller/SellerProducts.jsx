import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import axios from "../../utils/axios";
import { processImageUrl } from "../../utils/apiConfig";
import JumpingLoader from "../../Components/JumpingLoader";
import "../../App.css";
import "./SellerProducts.css";

const SellerProducts = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
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
      toast.error("Error fetching categories");
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "/api/products/seller-products?populateCategory=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        console.log("Seller products data:", response.data.products);
        setProducts(response.data.products);
      }
    } catch (error) {
      toast.error("Error fetching products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };



  const handleEdit = (product) => {
    setEditProduct(product);
    setEditCategory(product.category?._id || "");
    setEditStatus(product.status || "");
    setEditPrice(product.price || "");
    setEditStock(product.stock || "");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditProduct(null);
    setEditCategory("");
    setEditStatus("");
    setEditPrice("");
    setEditStock("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    try {
      const token = localStorage.getItem("token");

      //  Create payload dynamically
      const updatePayload = {
        category: editCategory,
        status: editStatus,
        price: editPrice,
        stock: editStock,
      };

      await axios.patch(`/api/products/${editProduct._id}`, updatePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Product updated successfully");
      closeEditModal();
      fetchProducts();
    } catch (error) {
      toast.error("Error updating product");
      console.error(error);
    }
  };

  const handleDelete = (product) => {
    setDeleteProduct(product);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteProduct(null);
  };

  const confirmDelete = async () => {
    if (!deleteProduct) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/products/${deleteProduct._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Product deleted successfully");
      closeDeleteModal();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting product");
      console.error(error);
    }
  };

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (product) => product.category?.name === selectedCategory
        );

  if (loading) {
    return (
      <div
        className="loading-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <JumpingLoader size="medium" />
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="admin-header">
        <div>
          <h1>Products</h1>
          <p className="admin-subtitle">Manage your products and inventory</p>
        </div>
        <Link to="/seller/products/add" className="add-product-btn">
          <FaPlus style={{ marginRight: "0.5rem" }} />
          Add New Product
        </Link>
      </div>

      <div className="category-filter-container">
        <div className="category-filter-slider">
          <button
            key="All"
            className={`category-btn ${
              selectedCategory === "All" ? "active" : ""
            }`}
            onClick={() => setSelectedCategory("All")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              className={`category-btn ${
                selectedCategory === category.name ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="products-container">
        <div className="products-grid-container">
          <div className="product-cards-container seller-horizontal-grid">
            {filteredProducts.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-card-header">
                  <img
                    src={(() => {
                      const imageUrl = processImageUrl(product.image);
                      console.log(`Product ${product.name} - Images:`, product.image, "Processed URL:", imageUrl);
                      return imageUrl;
                    })()}
                    alt={product.name}
                    className="product-card-image"
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "contain",
                      background: "#fff",
                      borderRadius: 8,
                      border: "1.5px solid #f0f0f0",
                    }}
                  />
                  <h3
                    className="product-card-name"
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                      margin: "12px 0 0 0",
                      color: "#1a237e",
                      textAlign: "left",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {product.name}
                  </h3>
                </div>
                <div className="product-card-body" style={{ padding: 18 }}>
                  <p className="product-card-detail">
                    <strong>Category:</strong> {product.category?.name}
                  </p>
                  <p className="product-card-detail">
                    <strong>Price:</strong> ₹{product.price?.toFixed(2)}
                  </p>
                  <p className="product-card-detail">
                    <strong>Stock:</strong> {product.stock}
                  </p>
                  <p className="product-card-detail">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`status-badge ${product.status
                        ?.toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {product.status}
                    </span>
                  </p>
                </div>
                <div className="product-card-actions">
                  <button
                    className="btn btn-small btn-primary edit-product-btn"
                    onClick={() => handleEdit(product)}
                  >
                    <span className="sparkle">
                      <FaEdit />
                    </span>
                    <span className="text">Edit</span>
                  </button>
                  <button
                    className="btn btn-small btn-danger delete-product-btn"
                    onClick={() => handleDelete(product)}
                    style={{ marginLeft: '8px' }}
                  >
                    <span className="sparkle">
                      <FaTrash />
                    </span>
                    <span className="text">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showEditModal && editProduct && (
        <div className="modal-overlay">
          <div className="modal-content modern-edit-modal">
            <h2>Edit Product</h2>
            <form onSubmit={handleSaveEdit} className="modern-edit-form">
              <div className="form-group">
                <label htmlFor="editCategory">Category</label>
                <select
                  id="editCategory"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="editPrice">Price</label>
                <input
                  id="editPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  className="modern-input"
                  placeholder="Enter price"
                />
              </div>
              <div className="form-group">
                <label htmlFor="editStock">Stock</label>
                <input
                  id="editStock"
                  type="number"
                  min="0"
                  step="1"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  required
                  className="modern-input"
                  placeholder="Enter stock quantity"
                />
              </div>
              <div className="form-group">
                <label htmlFor="editStatus">Status</label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select status
                  </option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-medium btn-primary save-btn"
                >
                  <span className="text">Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn btn-medium btn-secondary cancel-btn"
                >
                  <span className="text">Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete "{deleteProduct?.name}"? This
                action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={confirmDelete}
                className="btn btn-medium btn-danger delete-btn"
              >
                <span className="text">Delete</span>
              </button>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="btn btn-medium btn-secondary cancel-btn"
              >
                <span className="text">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
