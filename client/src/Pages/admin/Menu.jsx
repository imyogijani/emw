/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";
import "./Menu.css";
import { toast } from "react-toastify";
import AdminOffers from "./AdminOffers";
import { Route } from "react-router-dom";

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]); // Added categories state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    stock: "",
    status: "In Stock",
    image: null,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories(); // Added function to fetch categories
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/menu-items", {
        headers: { Authorization: `Bearer ${token}` },
        params: { populateCategory: "true" },
      });

      if (!response.data.products || response.data.products.length === 0) {
        const sampleProducts = [
          // ... sample products data remains unchanged
        ];
        setProducts(sampleProducts);
      } else {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      toast.error("Error fetching products");
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const productData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          productData.append(key, value);
        }
      });

      if (currentProduct) {
        await axios.put(
          `/api/admin/menu-items/${currentProduct._id}`,
          productData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Product updated successfully!");
      } else {
        await axios.post("/api/admin/menu-items", productData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Product created successfully!");
      }

      fetchProducts();
      setShowModal(false);
      setCurrentProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        subcategory: "",
        stock: "",
        status: "In Stock",
        image: null,
      });
    } catch (error) {
      toast.error("Error saving product.");
      console.error("Error saving product:", error);
    }
  };

  // Filter products based on search term and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="admin-menu">
      <div className="admin-header">
        <h1>Product Management</h1>
        <p className="admin-subtitle">
          Manage your restaurant products and inventory
        </p>
      </div>

      <div className="menu-stats">
        <div className="stat-card">
          <h3>Total Menu Items</h3>
          <p>{products.length}</p>
        </div>
      </div>

      <div className="menu-controls">
        <div className="search-box">
          <FaEye className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="menu-table-container">
        <div className="table-header">
          <h2>Products</h2>
        </div>

        <table className="menu-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Category</th>
              <th>Premium</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => (
              <tr key={item._id}>
                <td>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="menu-item-image"
                    />
                  )}
                </td>
                <td>{item.name}</td>
                <td>{item.description}</td>
                <td>₹{item.price}</td>
                <td>{item.category?.name || item.category}</td>
                <td>{item.isPremium ? "Yes" : "No"}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(item)}>
                    <FaEdit />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(item._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{currentProduct ? "Edit Product" : "Add New Product"}</h3>
            <form onSubmit={handleFormSubmit}>
              {/* Form fields remain unchanged */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this route to render the AdminOffers page
<Route path="/admin/offers" element={<AdminOffers />} />

export default Menu;
