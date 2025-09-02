/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaStore,
  FaEdit,
  FaTrash,
  FaBox,
  FaShoppingBag,
  FaChartLine,
} from "react-icons/fa";
import JumpingLoader from "../../Components/JumpingLoader";
import axios from "../../utils/axios";
import { toast } from "react-toastify";

import OptimizedImage from "../../Components/common/OptimizedImage";
import "./Products.css";
import { useNavigate } from "react-router-dom";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // You can make this dynamic if needed
  const [totalPages, setTotalPages] = useState(1);
  const [totals, setTotals] = useState();

  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        navigate("/login");
        return;
      }

      let url = `/api/admin/all-products?page=${page}&limit=${limit}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (selectedSubcategory) url += `&subcategory=${selectedSubcategory}`;
      if (selectedBrand) url += `&brand=${selectedBrand}`;
      if (selectedShop !== "all") url += `&seller=${selectedShop}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts(response.data.products);
      setTotalPages(response.data.pagination.totalPages);
      setTotals(response.data.totals);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.response?.data?.message || "Error fetching products");
    } finally {
      setLoading(false);
    }
  }, [
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    selectedShop,
    searchTerm,
    page,
    limit,
    navigate,
  ]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/category/get-category", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.categories);
      // console.log("Set Categories all", response.data.categories.length);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(error.response?.data?.message || "Error fetching categories");
    }
  };

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/shops", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShops(response.data.shops);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error(error.response?.data?.message || "Error fetching shops");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchProducts(), fetchShops(), fetchCategories()]);
    };
    initializeData();
  }, [fetchProducts]);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.response?.data?.message || "Error deleting product");
    }
  };

  const handleDeleteAllProducts = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL products? This action cannot be undone."
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete("/api/admin/products/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("All products deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting all products:", error);
      toast.error(
        error.response?.data?.message || "Error deleting all products"
      );
    }
  };

  const handleRowClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
    setIsEditMode(false);
    setEditFormData({});
  };

  const handleEditToggle = () => {
    if (!isEditMode) {
      setEditFormData({
        name: selectedProduct.name || '',
        description: selectedProduct.description || '',
        price: selectedProduct.price || '',
        stock: selectedProduct.stock || '',
        status: selectedProduct.status || 'active'
      });
    }
    setIsEditMode(!isEditMode);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !editFormData.name || !editFormData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await axios.put(`/api/admin/products/${selectedProduct._id}`, editFormData);
      
      if (response.data.success) {
        toast.success('Product updated successfully');
        // Update the product in the local state
        setProducts(prev => prev.map(p => 
          p._id === selectedProduct._id 
            ? { ...p, ...editFormData }
            : p
        ));
        setSelectedProduct({ ...selectedProduct, ...editFormData });
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleModalDelete = async () => {
    if (!selectedProduct) return;
    await handleDeleteProduct(selectedProduct._id);
    closeProductModal();
  };

  const filteredProducts = products.filter((product) => {
    const matchesShop =
      selectedShop === "all" ||
      (product.seller && product.seller._id === selectedShop);
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      (product.category && product.category._id === selectedCategory);
    const matchesSubcategory =
      !selectedSubcategory ||
      (product.subcategory && product.subcategory._id === selectedSubcategory);
    const matchesBrand =
      !selectedBrand ||
      (product.brand &&
        product.brand.toLowerCase() === selectedBrand.toLowerCase());

    return (
      matchesShop &&
      matchesSearch &&
      matchesCategory &&
      matchesSubcategory &&
      matchesBrand
    );
  });

  const getProductStats = () => ({
    // totalProducts: products.length,
    activeShops: shops.length,
    categories: categories.length,
    // totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
  });

  const stats = getProductStats();

  if (loading) {
    return (
      <div className="loading">
        <JumpingLoader size="medium" />
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="admin-header">
        <h1>Products Management</h1>
        <p className="admin-subtitle">Manage all products across shops</p>
      </div>

      <div className="products-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="categoryFilter">Filter by Category:</label>
          <select
            id="categoryFilter"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
              setSelectedBrand("");
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory && (
          <div className="filter-group">
            <label htmlFor="subcategoryFilter">Filter by Subcategory:</label>
            <select
              id="subcategoryFilter"
              value={selectedSubcategory}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value);
                setSelectedBrand("");
              }}
            >
              <option value="">All Subcategories</option>
              {categories
                .find((cat) => cat._id === selectedCategory)
                ?.children?.map((subcat) => (
                  <option key={subcat._id} value={subcat._id}>
                    {subcat.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {(selectedCategory || selectedSubcategory) && (
          <div className="filter-group">
            <label htmlFor="brandFilter">Filter by Brand:</label>
            <select
              id="brandFilter"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {selectedCategory &&
                categories
                  .find((cat) => cat._id === selectedCategory)
                  ?.brands?.map((brand, index) => (
                    <option key={index} value={brand}>
                      {brand}
                    </option>
                  ))}
              {selectedSubcategory &&
                categories
                  .find((cat) => cat._id === selectedCategory)
                  ?.children?.find(
                    (subcat) => subcat._id === selectedSubcategory
                  )
                  ?.brands?.map((brand, index) => (
                    <option key={index} value={brand}>
                      {brand}
                    </option>
                  ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label htmlFor="shopFilter">Filter by Shop:</label>
          <select
            id="shopFilter"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
          >
            <option value="all">All Shops</option>
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.shopName}
              </option>
            ))}
          </select>
        </div>
        <button
          className="delete-all-products-btn"
          onClick={handleDeleteAllProducts}
        >
          Delete All Products
        </button>
      </div>

      <div className="products-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-details">
            <h3>Total Products</h3>
            <p>{totals.products}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaStore />
          </div>
          <div className="stat-details">
            <h3>Active Shops</h3>
            <p>{stats.activeShops}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaShoppingBag />
          </div>
          <div className="stat-details">
            <h3>Categories</h3>
            <p>{stats.categories}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-details">
            <h3>Total Stock</h3>
            <p>{totals.totalAvailableStock}</p>
          </div>
        </div>
      </div>

      <div className="products-grid-container">
        <div className="product-cards-container">
          {products.map((product) => {
            return (
              <div key={product._id} className="product-card">
                <div className="product-card-image-container">
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    type="product"
                    className="product-card-image"
                    showRetryButton={false}
                  />
                  <div className="product-overlay">
                    <div className="quick-actions">
                      <button
                        className="quick-action-btn view-btn"
                        onClick={() => handleRowClick(product)}
                        title="View Details"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="quick-action-btn delete-btn"
                        onClick={() => handleDeleteProduct(product._id)}
                        title="Delete Product"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="product-badges">
                    {product.stock === 0 && (
                      <span className="badge out-of-stock">Out of Stock</span>
                    )}
                    {product.stock > 0 && product.stock < 10 && (
                      <span className="badge low-stock">Low Stock</span>
                    )}
                    {product.stock >= 10 && (
                      <span className="badge in-stock">In Stock</span>
                    )}
                  </div>
                </div>
                <div className="product-card-content">
                  <div className="product-header">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-category">
                      {product.category?.name || "Uncategorized"}
                      {product.subcategory?.name &&
                        ` (${product.subcategory.name})`}
                    </div>
                  </div>
                  <div className="product-details">
                    <div className="price-section">
                      <span className="price">₹{product.price?.toFixed(2)}</span>
                      <span className="stock-count">{product.stock} units</span>
                    </div>
                    <div className="shop-info">
                      <FaStore className="shop-icon" />
                      <span className="shop-name">{product.shopName || "Unknown Shop"}</span>
                    </div>
                  </div>
                  <div className="product-actions">
                    <button
                      className="action-btn primary"
                      onClick={() => handleRowClick(product)}
                    >
                      <FaEdit /> View Details
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => handleDeleteProduct(product._id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showProductModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content product-edit-modal">
            <div className="modal-header">
              <h2>{isEditMode ? 'Edit Product' : 'Product Details'}</h2>
              <button className="close-btn" onClick={closeProductModal}>
                ×
              </button>
            </div>
            
            <div className="product-details-view">
              {!isEditMode ? (
                // View Mode
                <>
                  <div className="detail-group">
                    <strong>Product Name:</strong>
                    <span>{selectedProduct.name}</span>
                  </div>
                  <div className="detail-group">
                    <strong>Description:</strong>
                    <span>{selectedProduct.description}</span>
                  </div>
                  <div className="detail-group">
                    <strong>Category:</strong>
                    <span>{selectedProduct.category?.name || "N/A"}</span>
                  </div>
                  <div className="detail-group">
                    <strong>Price:</strong>
                    <span>₹{selectedProduct.price?.toFixed(2)}</span>
                  </div>
                  <div className="detail-group">
                    <strong>Stock:</strong>
                    <span>{selectedProduct.stock}</span>
                  </div>
                  <div className="detail-group">
                    <strong>Status:</strong>
                    <span
                      className={`status ${selectedProduct.status
                        ?.toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {selectedProduct.status}
                    </span>
                  </div>
                  <div className="detail-group">
                    <strong>Shop:</strong>
                    <span>{selectedProduct.seller?.shopName || "N/A"}</span>
                  </div>
                </>
              ) : (
                // Edit Mode
                <div className="edit-form">
                  <div className="form-group">
                    <label htmlFor="name">Product Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditInputChange}
                      placeholder="Enter product description"
                      rows="4"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="price">Price (₹) *</label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={editFormData.price}
                        onChange={handleEditInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="stock">Stock Quantity</label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={editFormData.stock}
                        onChange={handleEditInputChange}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="out of stock">Out of Stock</option>
                    </select>
                  </div>
                  
                  <div className="readonly-info">
                    <div className="detail-group">
                      <strong>Category:</strong>
                      <span>{selectedProduct.category?.name || "N/A"}</span>
                    </div>
                    <div className="detail-group">
                      <strong>Shop:</strong>
                      <span>{selectedProduct.seller?.shopName || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                {!isEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="edit-btn"
                    >
                      <FaEdit /> Edit Product
                    </button>
                    <button
                      type="button"
                      onClick={handleModalDelete}
                      className="delete-btn"
                    >
                      <FaTrash /> Delete Product
                    </button>
                    <button type="button" onClick={closeProductModal} className="cancel-btn">
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdateProduct}
                      className="save-btn"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="cancel-btn"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
