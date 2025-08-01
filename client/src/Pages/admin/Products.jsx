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
  FaSpinner,
} from "react-icons/fa";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
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
        <FaSpinner className="spinner" />
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
            let imageUrl = "";
            if (typeof product.image === "string" && product.image) {
              if (product.image.startsWith("/uploads/")) {
                imageUrl = `http://localhost:8080${product.image}`;
              } else {
                imageUrl = `http://localhost:8080/uploads/products/${product.image}`;
              }
            }
            return (
              <div key={product._id} className="product-card">
                <div className="product-card-header">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="product-card-image"
                    />
                  )}
                  <h3 className="product-card-name">{product.name}</h3>
                </div>
                <div className="product-card-body">
                  <p className="product-card-detail">
                    <strong>Category:</strong> {product.category?.name}
                    {product.subcategory?.name &&
                      ` (${product.subcategory.name})`}
                  </p>
                  <p className="product-card-detail">
                    <strong>Price:</strong> ₹{product.price?.toFixed(2)}
                  </p>
                  <p className="product-card-detail">
                    <strong>Stock:</strong> {product.stock}
                  </p>
                  <p className="product-card-detail">
                    <strong>Status:</strong>
                    <span className={`status ${product.status?.toLowerCase()}`}>
                      {product.status}
                    </span>
                  </p>
                  <div className="product-card-detail">
                    <strong>Shop:</strong>
                    <div className="shop-info">
                      <FaStore className="shop-icon" />
                      <span>{product.shopName}</span>
                    </div>
                  </div>
                </div>
                <div className="product-card-actions">
                  <button
                    className="view-product-btn"
                    onClick={() => handleRowClick(product)}
                  >
                    <FaEdit /> View Details
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteProduct(product._id)}
                    style={{ marginLeft: "10px" }}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showProductModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Product Details</h2>
            <div className="product-details-view">
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
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleModalDelete}
                  className="delete-btn"
                >
                  <FaTrash /> Delete Product
                </button>
                <button type="button" onClick={closeProductModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
