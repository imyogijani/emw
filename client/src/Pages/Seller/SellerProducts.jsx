import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlus, FaEdit } from "react-icons/fa";
import axios from "../../utils/axios";
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
        setProducts(response.data.products);
      }
    } catch (error) {
      toast.error("Error fetching products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(`/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          toast.success("Product deleted successfully");
          fetchProducts();
        }
      } catch (error) {
        toast.error("Error deleting product");
        console.error(error);
      }
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setEditCategory(product.category?._id || "");
    setEditStatus(product.status || "");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditProduct(null);
    setEditCategory("");
    setEditStatus("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/products/${editProduct._id}`,
        {
          category: editCategory,
          status: editStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Product updated successfully");
      closeEditModal();
      fetchProducts();
    } catch (error) {
      toast.error("Error updating product");
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
    return <div>Loading...</div>;
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

      <div className="category-filter">
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

      <div className="products-container">
        <div className="products-grid-container">
          <div className="product-cards-container">
            {filteredProducts.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-card-header">
                  <img
                    src={product.images && product.images.length > 0 ? product.images[0] : "https://via.placeholder.com/150"}
                    alt={product.name}
                    className="product-card-image"
                  />
                  <h3 className="product-card-name">{product.name}</h3>
                </div>
                <div className="product-card-body">
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
                    <strong>Status:</strong>
                    <span
                      className={`status ${product.status
                        ?.toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {product.status}
                    </span>
                  </p>
                </div>
                <div className="product-card-actions">
                  <button
                    className="edit-product-btn"
                    onClick={() => handleEdit(product)}
                  >
                    <FaEdit /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showEditModal && editProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Product</h2>
            <form onSubmit={handleSaveEdit}>
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
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
