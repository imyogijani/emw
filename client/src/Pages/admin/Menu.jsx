/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import axios from "../../utils/axios";
import {
  FaTrash,
  FaPlus,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./Menu.css";

const PRODUCT_PAGE_SIZE = 10; // exactly 2 rows x 5 cards

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sellers, setSellers] = useState([]);

  // Custom products (server-side) pagination/search
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    filterType: "Category",
    filterValue: "",
    customProducts: [],
    productLimit: "", // keep empty so placeholder shows
    position: "", // keep empty so placeholder shows
    status: "active",
  });

  const token = localStorage.getItem("token");

  // ---------------- FETCH INITIAL DATA ----------------
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchBrands();
    fetchSellers();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await axios.get("/api/menu-items/all");
      setMenuItems(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load menu items");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/category/get-category", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data?.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get("/api/brands");
      setBrands(res.data?.brands || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await axios.get("/api/stores");
      setSellers(res.data?.stores || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- PRODUCTS (SERVER PAGINATION + SEARCH) ----------------
  const fetchProducts = async (page = 1, search = "") => {
    // Only fetch when Custom Products is selected
    if (formData.filterType !== "custom") return;

    try {
      setProductsLoading(true);
      const res = await axios.get("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: PRODUCT_PAGE_SIZE,
          search: search?.trim() || "",
          populateCategory: "false",
        },
      });

      setProducts(res.data?.products || []);
      setProductTotal(res.data?.totalProducts || 0);
      setProductTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
      setProducts([]);
      setProductTotal(0);
      setProductTotalPages(1);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch products whenever:
  // - filterType becomes 'custom'
  // - productPage changes
  useEffect(() => {
    if (formData.filterType === "custom") {
      fetchProducts(productPage, productSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.filterType, productPage]);

  // Debounce search by 400ms
  useEffect(() => {
    if (formData.filterType !== "custom") return;
    const t = setTimeout(() => {
      setProductPage(1); // reset to first page on new search
      fetchProducts(1, productSearch);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSearch, formData.filterType]);

  // ---------------- FORM HANDLERS ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    // if user switches away from custom, clear selection & search
    if (name === "filterType") {
      setProductSearch("");
      setProductPage(1);
      setProducts([]); // clear view; will fetch again if custom
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        customProducts: value === "custom" ? prev.customProducts : [],
        filterValue: value === "custom" ? "" : prev.filterValue,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomProductToggle = (id) => {
    setFormData((prev) => {
      const alreadySelected = prev.customProducts.includes(id);
      return {
        ...prev,
        customProducts: alreadySelected
          ? prev.customProducts.filter((p) => p !== id)
          : [...prev.customProducts, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // prepare payload with proper number types
      const payload = {
        ...formData,
        productLimit:
          formData.productLimit === "" ? 10 : Number(formData.productLimit),
        position: formData.position === "" ? 0 : Number(formData.position),
      };

      if (payload.filterType !== "custom") {
        delete payload.customProducts;
      } else {
        delete payload.filterValue;
      }

      await axios.post("/api/menu-items", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Menu item created");
      resetForm();
      fetchMenuItems();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create menu item");
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      filterType: "Category",
      filterValue: "",
      customProducts: [],
      productLimit: "",
      position: "",
      status: "active",
    });
    setProductSearch("");
    setProductPage(1);
  };

  // ---------------- ACTIONS ----------------
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/menu-items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Menu item deleted");
      fetchMenuItems();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(
        `/api/menu-items/${id}/status`,
        { status: currentStatus === "active" ? "inactive" : "active" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMenuItems();
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  const showingRange = useMemo(() => {
    if (!productTotal) return "0–0";
    const start = (productPage - 1) * PRODUCT_PAGE_SIZE + 1;
    const end = Math.min(productPage * PRODUCT_PAGE_SIZE, productTotal);
    return `${start}–${end}`;
  }, [productPage, productTotal]);

  // ---------------- UI ----------------
  return (
    <div className="admin-menu">
      <div className="admin-header">
        <h1>Product Management </h1>
        <p className="admin-subtitle">
          Manage product menus and display filters
        </p>
      </div>

      {/* Create Form */}
      <div className="menu-card">
        <h2>Add New Menu Item</h2>
        <form onSubmit={handleSubmit} className="menu-form">
          <input
            type="text"
            name="title"
            placeholder="Menu Title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <select
            name="filterType"
            value={formData.filterType}
            onChange={handleChange}
          >
            <option value="Category">Category</option>
            <option value="Brand">Brand</option>
            <option value="Seller">Seller</option>
            <option value="custom">Custom Products</option>
          </select>

          {formData.filterType === "Category" && (
            <select
              name="filterValue"
              value={formData.filterValue}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {formData.filterType === "Brand" && (
            <select
              name="filterValue"
              value={formData.filterValue}
              onChange={handleChange}
            >
              <option value="">Select Brand</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {formData.filterType === "Seller" && (
            <select
              name="filterValue"
              value={formData.filterValue}
              onChange={handleChange}
            >
              <option value="">Select Seller</option>
              {sellers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {formData.filterType === "custom" && (
            <>
              {/* Search + meta row */}
              <div className="product-toolbar">
                <div className="search-wrap">
                  <FaSearch />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                  />
                </div>
                <div className="meta">
                  {productsLoading ? (
                    <span>Loading…</span>
                  ) : (
                    <span>
                      Showing {showingRange} of {productTotal}
                    </span>
                  )}
                </div>
              </div>

              {/* Product cards grid */}
              <div className="product-grid grid-5">
                {productsLoading ? (
                  <div className="skeleton-grid">
                    {Array.from({ length: PRODUCT_PAGE_SIZE }).map((_, i) => (
                      <div className="product-card skeleton" key={i} />
                    ))}
                  </div>
                ) : products.length ? (
                  products.map((p) => {
                    const selected = formData.customProducts.includes(p._id);
                    return (
                      <div
                        key={p._id}
                        className={`product-card ${selected ? "selected" : ""}`}
                        onClick={() => handleCustomProductToggle(p._id)}
                      >
                        {selected && <div className="checkmark">✔</div>}
                        <h4 title={p.name}>{p.name}</h4>
                        <div className="price-box">
                          <span className="finalPrice">₹{p.finalPrice}</span>
                          <span className="oldPrice">₹{p.price}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-products">No products found.</div>
                )}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-medium btn-secondary page-btn"
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage <= 1 || productsLoading}
                >
                  <span className="sparkle">
                    <FaChevronLeft />
                  </span>
                  <span className="text">Prev</span>
                </button>

                <span className="page-info">
                  Page {productPage} of {productTotalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-medium btn-secondary page-btn"
                  onClick={() =>
                    setProductPage((p) => Math.min(productTotalPages, p + 1))
                  }
                  disabled={productPage >= productTotalPages || productsLoading}
                >
                  <span className="text">Next</span>
                  <span className="sparkle">
                    <FaChevronRight />
                  </span>
                </button>
              </div>
            </>
          )}

          <div className="inline-fields">
            <input
              type="number"
              name="productLimit"
              min="1"
              max="50"
              value={formData.productLimit}
              onChange={handleChange}
              placeholder="Enter product limit"
            />

            <input
              type="number"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Enter position"
            />
          </div>

          <button type="submit" className="btn-primary">
            <FaPlus /> Create Menu Item
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="menu-card">
        <h2>Existing Menu Items ({menuItems.length})</h2>
        <table className="menu-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Filter Type</th>
              <th>Filter Value / Products</th>
              <th>Limit</th>
              <th>Position</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(menuItems) && menuItems.length > 0 ? (
              menuItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.filterType}</td>
                  <td>
                    {item.filterType === "custom"
                      ? `${item.customProducts?.length || 0} products`
                      : item.filterValue || "-"}
                  </td>
                  <td>{item.productLimit}</td>
                  <td>{item.position}</td>
                  <td>
                    <button
                      className="btn btn-small btn-secondary toggle-btn"
                      onClick={() => toggleStatus(item._id, item.status)}
                    >
                      <span className="sparkle">
                        {item.status === "active" ? (
                          <FaToggleOn color="green" size={20} />
                        ) : (
                          <FaToggleOff color="gray" size={20} />
                        )}
                      </span>
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-small btn-danger action-btn delete"
                      onClick={() => handleDelete(item._id)}
                    >
                      <span className="sparkle">
                        <FaTrash />
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  🚫 No menu items found. Create one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Menu;
