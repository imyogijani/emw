/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./Menu.css";
import "./theme-override.css";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Star,
  ShoppingCart,
  Filter,
  Grid,
  List,
  Search,
  ChevronDown,
  Truck,
  Shield,
} from "lucide-react";
import axios from "../../utils/axios";
import { addToCartAPI } from "../../api/cartApi/cartApi";
import { trackEvent } from "../../analytics/trackEvent";


// Mall info configuration
const mallInfo = {
  name: "E-Mall World",
  description: "Your trusted online shopping destination",
  rating: 4.6,
  reviews: 125000,
  minOrder: "₹0",
  deliveryTime: "Same Day Delivery",
  phone: "+91-960-190-0290",
  website: "https://emallworld.com",
  address: "Serving Worldwide",
};

export default function Menu() {
  const [activeTab, setActiveTab] = useState("Electronics");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 9000000000]);
  const [allProducts, setAllProducts] = useState([]); // holds original unfiltered list
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [order, setOrder] = useState("asc");
  const [totalPages, setTotalPages] = useState(1);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchFilteredProducts({
          page: currentPage,
          limit: 5,
          categoryId: activeTab,
          search: searchQuery,
          sortBy,
          order,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
        });

        setProducts(response.products);
        setTotalPages(response.totalPages || 1);
      } catch (err) {
        console.error("Error fetching paginated products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, activeTab, searchQuery, sortBy, priceRange, order]);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();

    // const user = JSON.parse(localStorage.getItem("user"));
    // console.log("User 1211431243", user);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?._id;

      if (!userId) {
        toast.error("User not logged in");
        return;
      }

      const productData = {
        productId: product._id,
        quantity: 1,
        price: product.price,
        title: product.name,
        // image: product.image,
        discount: product.discount,
      };

      const response = await addToCartAPI(userId, productData);

      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Failed to add to cart.");
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="star-filled" size={14} fill="currentColor" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="star-half" size={14} fill="currentColor" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="star-empty" size={14} />);
    }

    return stars;
  };

  const handleSortChange = (e) => {
    const value = e.target.value;

    if (value === "price-low") {
      setSortBy("price");
      setOrder("asc");
    } else if (value === "price-high") {
      setSortBy("price");
      setOrder("desc");
    } else if (value === "rating") {
      setSortBy("rating");
      setOrder("desc");
    } else if (value === "reviews") {
      setSortBy("reviews");
      setOrder("desc");
    } else {
      setSortBy("createdAt");
      setOrder("desc");
    }
  };

  const processImageUrl = (image) => {
    const getFullUrl = (img) =>
      img.startsWith("/uploads") ? `http://localhost:8080${img}` : img;

    if (Array.isArray(image) && image.length > 0) {
      return getFullUrl(image[0]);
    } else if (typeof image === "string" && image.length > 0) {
      return getFullUrl(image);
    }

    return "/images/offer1.png";
  };
  const ProductCard = ({ item, isListView = false }) => {
    const navigate = useNavigate();

    const handleProductClick = async () => {
      // Track the click event
      await trackEvent("view_product_card_click", {
        product_id: item._id,
        name: item.name,
        category: item.category.name,
        price:
          item.activeDeal && item.activeDeal.dealPrice
            ? item.activeDeal.dealPrice
            : item.finalPrice,

        location: window.location.pathname,
      });

      // Then navigate to product detail page
      navigate(`/product/${item._id}`, { state: { item } });
    };

    return (
      <div
        className={`modern-product-card ${isListView ? "list-view" : ""}`}
        onClick={handleProductClick}
      >
        <div className="product-image-wrapper">
          <img
            src={processImageUrl(item.image)}
            alt={item.title}
            loading="lazy"
          />
          {item.discount && (
            <div className="discount-label">-{item.discount}%</div>
          )}
          {item.prime && <div className="prime-badge">Prime</div>}
        </div>

        <div className="product-details">
          <h3 className="product-name">{item.name}</h3>
          <p className="product-description">{item.description}</p>

          <div className="product-rating-row">
            <div className="rating-stars">
              {renderStars(item.averageRating || 0)}
            </div>
            <span className="rating-value">{item.averageRating || 0}</span>
            <span className="review-count">({item.totalReviews || 0})</span>
          </div>

          <div className="pricing-section">
            <span className="current-price">{item.price}</span>
            {item.originalPrice && (
              <span className="original-price">{item.originalPrice}</span>
            )}
            {item.discount && (
              <span className="discount-percent">({item.discount}% off)</span>
            )}
          </div>

          <div className="delivery-info">
            {item.freeDelivery && (
              <span className="free-delivery">
                <Truck size={14} />
                FREE Delivery
              </span>
            )}
            <span className="delivery-date">Get it by tomorrow</span>
          </div>

          <button
            className="add-cart-button"
            onClick={(e) => handleAddToCart(e, item)}
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-text"></div>
            </div>
          ))}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="under-development">
          <h3>🚧 No Products Found</h3>
          <p>Try adjusting your filters or search</p>
        </div>
      );
    }

    return (
      <div className={`products-container ${viewMode}`}>
        {products.map((item) => (
          <ProductCard
            key={item._id}
            item={item}
            isListView={viewMode === "list"}
          />
        ))}
      </div>
    );
  };

  const fetchFilteredProducts = async ({
    page = 1,
    limit = 12,
    search = "",
    sortBy = "price",
    order = "asc",
    minPrice = 0,
    maxPrice = 200000,
  }) => {
    try {
      const queryParams = new URLSearchParams();

      queryParams.set("page", page);
      queryParams.set("limit", limit);
      if (search && search.trim() !== "") queryParams.set("search", search);
      if (sortBy) queryParams.set("sortBy", sortBy);
      if (order) queryParams.set("order", order);
      if (minPrice !== undefined) queryParams.set("minPrice", minPrice);
      if (maxPrice !== undefined) queryParams.set("maxPrice", maxPrice);

      // Optional: backend ke liye extra populate flags
      queryParams.set("populateCategory", "true");
      queryParams.set("populateSubcategory", "true");

      const response = await axios.get(
        `/api/products?${queryParams.toString()}`
      );

      {/* const finalURL = `/api/products?${queryParams.toString()}`;
      console.log("🟢 Final API URL called:", finalURL); */}

      {
        /* console.log(`/api/products?${queryParams.toString()}`) */
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching filtered products:", error);
      throw error;
    }
  };

  const handleFilterSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await fetchFilteredProducts({
        page: currentPage,
        search: searchQuery,
        sortBy,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
      });

      setProducts(response.products);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modern-menu-page">
      <div className="menu-header-section">
        <div className="mall-info">
          <h1>Browse Products</h1>
          <div className="mall-meta">
            <div className="rating-badge">
              <Star className="star-icon" size={16} fill="currentColor" />
              <span>{mallInfo?.rating}</span>
              <span>({mallInfo?.reviews?.toLocaleString()} reviews)</span>
            </div>
            <div className="delivery-badge">
              <Truck size={16} />
              <span>{mallInfo?.deliveryTime}</span>
            </div>
            <div className="security-badge">
              <Shield size={16} />
              <span>Secure Shopping</span>
            </div>
          </div>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-controls">
          <button
            className="filter-toggle"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={filterOpen ? "rotated" : ""} />
          </button>
          <select onChange={handleSortChange} className="sort-dropdown">
            <option value="relevance">Sort by Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
            <option value="reviews">Most Reviewed</option>
          </select>

          <div className="view-toggle-switch">
            <div className="switch-toggle-group">
              <button
                className={`switch-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                style={{ marginRight: "10px" }}
              >
                <Grid size={26} />
              </button>
              <button
                className={`switch-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <List size={26} />
              </button>
              <span
                className={`switch-slider ${
                  viewMode === "list" ? "slide-right" : ""
                }`}
              ></span>
            </div>
          </div>
        </div>
      </div>

      {filterOpen && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-range">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([+e.target.value, priceRange[1]])
                }
                placeholder="Min"
              />
              <span>to</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], +e.target.value])
                }
                placeholder="Max"
              />
            </div>
          </div>
        </div>
      )}

      <div className="category-navigation">
        <div className="category-tabs">
          {[].map((cat) => (
            <button
              key={cat}
              className={`category-tab ${activeTab === cat ? "active" : ""}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="products-section">{renderContent()}</div>
      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            ⬅ Prev
          </button>

          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`pagination-btn ${
                currentPage === index + 1 ? "active" : ""
              }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
          >
            Next ➡
          </button>
        </div>
      )}

      <div className="info-cards-section">
        <div className="info-cards-grid">
          <div className="info-card">
            <h3>📋 Catalog Info</h3>
            <div className="info-item">
              <span className="label">Categories:</span>
              <span className="value">0</span>
            </div>
            <div className="info-item">
              <span className="label">Total Products:</span>
              <span className="value">0</span>
            </div>
            <div className="info-item">
              <span className="label">Prime Products:</span>
              <span className="value">0</span>
            </div>
          </div>

          <div className="info-card">
            <h3>⭐ Quality Assurance</h3>
            <div className="info-item">
              <span className="label">Average Rating:</span>
              <span className="value">4.6/5</span>
            </div>
            <div className="info-item">
              <span className="label">Verified Reviews:</span>
              <span className="value">
                {mallInfo?.reviews?.toLocaleString()}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Return Policy:</span>
              <span className="value">30 Days</span>
            </div>
          </div>

          <div className="info-card">
            <h3>🚚 Delivery & Support</h3>
            <div className="info-item">
              <span className="label">Delivery Time:</span>
              <span className="value">{mallInfo?.deliveryTime}</span>
            </div>
            <div className="info-item">
              <span className="label">Support:</span>
              <span className="value">24/7 Available</span>
            </div>
            <div className="info-item">
              <span className="label">Locations:</span>
              <span className="value">Pan India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
