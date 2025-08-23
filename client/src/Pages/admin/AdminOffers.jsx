/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./AdminDeals.css"; // keep your style
import { FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    type: "CART", // CART, CATEGORY, BRAND, PRODUCT
    discountType: "PERCENTAGE", // PERCENTAGE, FLAT
    discountValue: 0,
    maxDiscountAmount: 0,
    minCartValue: 0,
    categories: [],
    brands: [],
    products: [],
    usageLimit: 0,
    perUserLimit: 0,
    startDate: "",
    endDate: "",
  });

  // ✅ Fetch initial data
  useEffect(() => {
    fetchOffers();
    fetchCategories();
    fetchBrands();
    fetchProducts(page);
    fetchShops();
  }, [page]);

  // ---------------- API Calls ----------------

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/offers/all", {
        params: { page, limit: 10 },
      });
      console.log("Offers fetched:", res.data);
      setOffers(res.data.offers || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching offers:", err);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/category/get-category");
      console.log("Categories fetched:", res.data.categories);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get("/api/brands");
      console.log("Brands fetched:", res.data.brands);
      setBrands(res.data.brands || []);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setBrands([]);
    }
  };

  const fetchProducts = async (pg) => {
    try {
      const res = await axios.get("/api/products", {
        params: { page: pg, limit: 10, populateCategory: true },
      });
      console.log("Products fetched:", res.data);
      setProducts(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    }
  };

  const fetchShops = async () => {
    try {
      const res = await axios.get("/api/stores");
      console.log("Shops fetched:", res.data.stores);
      setShops(res.data.stores || []);
    } catch (err) {
      console.error("Error fetching shops:", err);
      setShops([]);
    }
  };

  // ---------------- Handlers ----------------

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e) => {
    const { name, options } = e.target;
    const values = Array.from(options)
      .filter((o) => o.selected)
      .map((o) => o.value);
    setFormData((prev) => ({ ...prev, [name]: values }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    const payload = {
      ...formData,
      discountValue: Number(formData.discountValue),
      maxDiscountAmount: Number(formData.maxDiscountAmount),
      minCartValue: Number(formData.minCartValue),
      usageLimit: Number(formData.usageLimit),
      perUserLimit: Number(formData.perUserLimit),
    };

    try {
      await axios.post("/api/offers/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Offer created successfully!");
      resetForm();
      fetchOffers();
    } catch (err) {
      console.error("Error creating offer:", err);
      toast.error("Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      code: "",
      type: "CART",
      discountType: "PERCENTAGE",
      discountValue: 0,
      maxDiscountAmount: 0,
      minCartValue: 0,
      categories: [],
      brands: [],
      products: [],
      usageLimit: 0,
      perUserLimit: 0,
      startDate: "",
      endDate: "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this offer?")) return;
    try {
      await axios.delete(`/api/offers/delete/${id}`);
      toast.success("Offer deleted");
      fetchOffers();
    } catch (err) {
      console.error("Error deleting offer:", err);
      toast.error("Failed to delete offer");
    }
  };

  const handleToggle = async (id) => {
    try {
      await axios.patch(`/api/offers/toggle/${id}`);
      toast.success("Offer status toggled");
      fetchOffers();
    } catch (err) {
      console.error("Error toggling offer:", err);
      toast.error("Failed to toggle offer");
    }
  };

  // ---------------- JSX ----------------
  return (
    <div className="admin-deals admin-offers-page">
      <div className="admin-header">
        <h1>Manage Offers</h1>
        <p className="admin-subtitle">Create and manage discount offers</p>
      </div>

      {/* Offer Form */}
      <form className="admin-deal-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Offer Title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="code"
          placeholder="Code (e.g. SAVE10)"
          value={formData.code}
          onChange={handleInputChange}
          required
        />

        {/* Type Dropdown */}
        <select name="type" value={formData.type} onChange={handleInputChange}>
          <option value="CART">Cart</option>
          <option value="CATEGORY">Category</option>
          <option value="BRAND">Brand</option>
          <option value="PRODUCT">Product</option>
        </select>

        {/* Dynamic Dropdowns */}
        {formData.type === "CATEGORY" && (
          <select
            name="categories"
            multiple
            value={formData.categories}
            onChange={handleSelectChange}
          >
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {formData.type === "BRAND" && (
          <select
            name="brands"
            multiple
            value={formData.brands}
            onChange={handleSelectChange}
          >
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {formData.type === "PRODUCT" && (
          <select
            name="products"
            multiple
            value={formData.products}
            onChange={handleSelectChange}
          >
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} - ₹{p.finalPrice || p.price}
              </option>
            ))}
          </select>
        )}

        {/* Discount Inputs */}
        <select
          name="discountType"
          value={formData.discountType}
          onChange={handleInputChange}
        >
          <option value="PERCENTAGE">Percentage</option>
          <option value="FLAT">Flat</option>
        </select>
        <input
          type="number"
          name="discountValue"
          placeholder="Discount Value"
          value={formData.discountValue}
          onChange={handleInputChange}
          required
        />
        <input
          type="number"
          name="maxDiscountAmount"
          placeholder="Max Discount Amount"
          value={formData.maxDiscountAmount}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="minCartValue"
          placeholder="Min Cart Value"
          value={formData.minCartValue}
          onChange={handleInputChange}
        />

        {/* Dates */}
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleInputChange}
          required
        />
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleInputChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Offer"}
        </button>
      </form>

      {/* Offer List */}
      <div className="admin-deals-list">
        <h3>Offer History</h3>
        {offers.length === 0 ? (
          <p>No offers yet.</p>
        ) : (
          <table className="menu-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Valid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id}>
                  <td>{offer.title}</td>
                  <td>{offer.code}</td>
                  <td>{offer.type}</td>
                  <td>
                    {offer.discountValue} {offer.discountType}
                  </td>
                  <td>{offer.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    {new Date(offer.startDate).toLocaleDateString()} -{" "}
                    {new Date(offer.endDate).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(offer._id)}
                    >
                      <FaTrash />
                    </button>
                    <button
                      className="toggle-btn"
                      onClick={() => handleToggle(offer._id)}
                    >
                      {offer.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
