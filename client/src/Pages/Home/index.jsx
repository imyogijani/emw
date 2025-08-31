/* eslint-disable no-unused-vars */
// Logic/JavaScript Part
import "./Home.css";
import "./theme-override.css";
import "./products-slider.css";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import {
  processImageUrl,
  processCategoryImageUrl,
} from "../../utils/apiConfig";
import { toast } from "react-toastify";
import BottomCard from "./BottomCard";
import { useCart } from "../../context/CartContext";
import JumpingLoader from "../../Components/JumpingLoader";
import DealsList from "./DealsList";
import {
  Star,
  ShoppingCart,
  Search,
  Filter,
  Truck,
  Shield,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { addToCartAPI } from "../../api/cartApi/cartApi";
import HeroImg from "../../images/hero-img.svg";
import { requestPushPermission } from "../../utils/pushNotification";
import { trackEvent } from "../../analytics/trackEvent";

export default function Home() {
  // State management
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [deals, setDeals] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized filtered products
  const featuredProducts = React.useMemo(() => {
    const featured = products.filter((p) => p.isPremium === true);
    return featured.length > 0 ? featured : products;
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    let filtered = featuredProducts;

    if (activeCategory) {
      filtered = filtered.filter((p) => p.category?.name === activeCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === "low") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === "high") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      filtered = [...filtered].sort(
        (a, b) => (b.rating || 4.5) - (a.rating || 4.5)
      );
    }

    return filtered;
  }, [featuredProducts, activeCategory, sortBy, searchQuery]);

  const fetchDeals = React.useCallback(async () => {
    try {
      const [dealsRes] = await Promise.all([axios.get("/api/deals/active")]);

      const deals = dealsRes?.data?.deals || [];
      setDeals([...deals]);
    } catch (error) {
      console.error("Deals fetch error:", error);
      toast.error("Error fetching deals");
      setDeals([]);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "/api/products?populateCategory=true&populateSubcategory=true"
      );
      setProducts(response.data.products);
    } catch (error) {
      console.error("Product fetch error:", error);
      toast.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "/api/category/get-category-with-shop-count"
      );
      const categoriesData = response.data.categories || [];
      setCategories(categoriesData);

      if (categoriesData.length > 0) {
        setActiveCategory(categoriesData[0].name);
      }

      const subCategoriesMap = {};
      categoriesData.forEach((category) => {
        subCategoriesMap[category._id] = category.children || [];
      });
      setSubcategories(subCategoriesMap);
    } catch (error) {
      console.error("Category fetch error:", error);
      toast.error("Error fetching categories");
      setCategories([]);
      setSubcategories({});
    }
  };

  // Navigation handler
  const handleGetStarted = () => {
    window.location.href = "/menu";
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([fetchCategories(), fetchProducts(), fetchDeals()]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load initial data");
      }
    };

    fetchInitialData();
  }, [fetchDeals]);

  const userId = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (userId?._id) {
      requestPushPermission(userId._id);
    }
  }, [userId, userId?._id]);

  useEffect(() => {
    trackEvent("home_page_view", {
      user_id: userId?._id,
      location: window.location.pathname,
    });
  }, []);

  const calculateDealPrice = (offer) => {
    if (offer.price) return offer.price;
    if (!offer.product?.price || !offer.discount) return undefined;
    return Math.round(offer.product.price * (1 - offer.discount / 100));
  };

  const getShopName = (offer) => {
    return (
      offer.shop?.shopName || offer.shop?.names || offer.shop?.email || "Shop"
    );
  };
  const handleAddToCart = async (e, product, sourcePage = "HomePage") => {
    const user = JSON.parse(localStorage.getItem("user"));
    e.stopPropagation();

    try {
      if (!user?._id) {
        toast.error("Please login to add items to cart");
        return;
      }

      const productData = {
        productId: product._id,
        quantity: 1,
        price: product.price,
        title: product.name,
        discount: product.discount,
      };

      await addToCartAPI(user._id, productData, null);

      await trackEvent("add_to_cart", {
        user_id: userId,
        product_id: product._id,
        name: product.name,
        category: product.category?.name,
        quantity: 1,
        price:
          product.activeDeal?.dealPrice ?? product.finalPrice ?? product.price,
        discount: product.discount,
        source_page: sourcePage,
        location: window.location.pathname,
      });
      toast.success("Added to cart!");
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Failed to add to cart");
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

  // Modern ProductCard component with unified design system
  const ProductCard = ({ product }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const navigate = useNavigate();

    const handleImageLoad = () => {
      setImageLoading(false);
      setImageError(false);
    };

    const handleImageError = () => {
      setImageLoading(false);
      setImageError(true);
    };

    const getImageSrc = () => {
      if (imageError) {
        return "https://images.pexels.com/photos/6214360/pexels-photo-6214360.jpeg";
      }

      const processedImage = processImageUrl(product.image);
      return (
        processedImage ||
        "https://images.pexels.com/photos/6214360/pexels-photo-6214360.jpeg"
      );
    };

    const handleProductClick = async () => {
      await trackEvent("view_product_card_click", {
        product_id: product._id,
        name: product.name,
        category: product.category.name,
        price:
          product.activeDeal && product.activeDeal.dealPrice
            ? product.activeDeal.dealPrice
            : product.finalPrice,
        location: window.location.pathname,
      });

      navigate(`/product/${product._id}`, { state: { product } });
    };

    return (
      <div
        className="card-base card-medium product-card"
        onClick={handleProductClick}
        style={{ cursor: "pointer" }}
      >
        <div
          className={`card-image-container ${imageLoading ? "loading" : ""}`}
          style={{
            height: 200,
            background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <img
            src={getImageSrc()}
            alt={product.name}
            className="card-image"
            loading="lazy"
            style={{
              objectFit: "contain",
              width: "90%",
              height: "90%",
              maxHeight: 160,
              maxWidth: 160,
              display: imageLoading ? "none" : "block",
              background: "white",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          <ProductBadges product={product} />
        </div>
        <div
          className="card-content"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "18px 16px 0 16px",
            gap: 8,
          }}
        >
          <h3
            className="card-title"
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              color: "#1a202c",
              lineHeight: 1.2,
              minHeight: 24,
              letterSpacing: 0.1,
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {product.name}
          </h3>
          <ProductRating product={product} renderStars={renderStars} />
          <p
            className="card-description"
            style={{
              flexGrow: 1,
              fontSize: 14,
              color: "#444",
              margin: "4px 0 0 0",
              minHeight: 32,
              lineHeight: 1.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxHeight: 40,
            }}
          >
            {product.description ||
              "Premium quality product with excellent features and reliable performance."}
          </p>
          <div style={{ flexGrow: 1 }} />
          <div
            className="card-price-container"
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 18,
              fontWeight: 800,
              color: "#067d62",
              justifyContent: "flex-start",
            }}
          >
            <span className="current-price">{product.price}</span>
            {product.originalPrice && (
              <span
                className="original-price"
                style={{
                  fontSize: 14,
                  color: "#888",
                  textDecoration: "line-through",
                  marginLeft: 8,
                }}
              >
                {product.originalPrice}
              </span>
            )}
            {product.discount && (
              <span
                className="discount-percentage"
                style={{
                  fontSize: 14,
                  color: "#d9534f",
                  fontWeight: 700,
                  marginLeft: 8,
                }}
              >
                ({product.discount}% off)
              </span>
            )}
          </div>
          <div
            className="card-actions"
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="card-action"
              style={{
                background: "linear-gradient(135deg,#067d62 0%,#38a169 100%)",
                color: "#fff",
                borderRadius: 16,
                padding: "8px 18px",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                boxShadow: "0 2px 8px rgba(6,125,98,0.08)",
                cursor: "pointer",
                letterSpacing: 0.2,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(e, product);
              }}
              title="Add to Cart"
            >
              <ShoppingCart size={15} style={{ marginRight: 6 }} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="amazon-home-container">
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      {/* <FeaturedCategories categories={categories} /> */}
      <div style={{ height: 80 }} /> {/* Placeholder for spacing where FeaturedCategories was */}
      <TrustBadges />
      <ShopByCategory categories={categories} />
      <FilterSortBar
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <FeaturedProducts
        loading={loading}
        filteredProducts={filteredProducts}
      />
      <DealsSection deals={deals} />
    </div>
  );
}

// --- Modern UI, Dynamic FilterSortBar ---
const FilterSortBar = ({
  categories,
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
}) => (
  <div className="filter-sort-bar-modern">
    <div className="filter-sort-bar-inner">
      <div className="filter-group">
        <label htmlFor="category-select" className="filter-label">Category</label>
        <select
          id="category-select"
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="filter-select-modern"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="sort-select" className="filter-label">Sort by</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select-modern"
        >
          <option value="">Relevance</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="rating">Customer Rating</option>
        </select>
      </div>
    </div>
  </div>
);

// --- Redesigned FeaturedProducts Section ---
const FeaturedProducts = ({ loading, filteredProducts }) => {
  if (loading) {
    return (
      <div className="loader-container">
        <JumpingLoader size="large" />
        <p>Loading featured products...</p>
      </div>
    );
  }
  if (filteredProducts.length === 0) {
    return <EmptyState />;
  }
  return (
    <div className="product-grid-section">
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

// --- Redesigned ProductCard ---
const ProductCard = ({ product }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const navigate = useNavigate();

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => setImageError(true);
  const getImageSrc = () => {
    if (imageError) return "https://images.pexels.com/photos/6214360/pexels-photo-6214360.jpeg";
    return processImageUrl(product.image) || "https://images.pexels.com/photos/6214360/pexels-photo-6214360.jpeg";
  };

  // Make the whole card clickable except for Add to Cart and Wishlist
  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <div
      className="product-card-modern clickable"
      onClick={handleCardClick}
      style={{ cursor: "pointer", maxWidth: 320, width: "100%", minWidth: 0 }}
    >
      <div className="product-image-wrap" style={{ width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 14 }}>
        {product.tag && (
          <span className="product-tag">{product.tag}</span>
        )}
        <img
          src={getImageSrc()}
          alt={product.name}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            display: imageLoading ? "none" : "block",
            width: "96%",
            height: "96%",
            objectFit: "contain",
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 1px 4px rgba(60,72,88,0.04)",
            margin: "0 auto"
          }}
        />
        {/* Heart/Wishlist button removed for cleaner look */}
      </div>
      <div className="product-info" style={{ width: "100%", padding: 0 }}>
        <div className="product-title">{product.name}</div>
        <div className="product-desc">{product.description || "-"}</div>
        <div className="product-rating">
          <span className="stars">★★★★★</span>
          <span className="review-count">({product.totalReviews || 0})</span>
        </div>
        <div className="product-price-row">
          <span className="product-price">₹{product.price}</span>
          {product.originalPrice && (
            <span className="product-old-price">₹{product.originalPrice}</span>
          )}
        </div>
        <button
          className="add-to-cart-btn"
          onClick={e => { e.stopPropagation(); /* Add to cart logic here if needed */ }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

const HeroSection = ({ searchQuery, setSearchQuery }) => (
  <div className="hero-banner">
    <div className="hero-content">
      <div className="hero-text">
        <h1>Welcome to E-Mall World</h1>
        <p>Discover millions of products from thousands of brands</p>
        <div className="hero-search-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for products, brands and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hero-search-input"
            />
            <button className="search-btn">
              <Search />
            </button>
          </div>
        </div>
      </div>
      <div className="hero-image">
        <img src={HeroImg} alt="Shopping Experience" />
      </div>
    </div>
  </div>
);

const TrustBadges = () => (
  <div className="trust-badges">
    {[
      { Icon: Truck, text: "Fast Delivery" },
      { Icon: Shield, text: "Secure Payment" },
      { Icon: RefreshCw, text: "Easy Returns" },
      { Icon: Award, text: "Quality Assured" },
    ].map(({ Icon, text }) => (
      <div key={text} className="trust-badge">
        <Icon size={30} />
        <span>{text}</span>
      </div>
    ))}
  </div>
);

// Horizontally scrollable Shop by Category section (no image, just name and shop count)
const ShopByCategory = ({ categories }) => (
  <section className="categories-section-horizontal">
    <div className="section-header">
      <h2>Shop by Category</h2>
      <p>Browse all categories and discover stores in each.</p>
    </div>
    <div
      className="categories-horizontal-scroll"
      tabIndex={0}
      aria-label="Shop by Category"
    >
      {categories.map((cat, idx) => (
        <div className="category-horizontal-card" key={cat._id || idx}>
          <span className="category-horizontal-name">{cat.name}</span>
          <span className="category-horizontal-count">
            {cat.shopCount || cat.stores || 0} Shops
          </span>
        </div>
      ))}
    </div>
  </section>
);

const EmptyState = () => (
  <div className="under-development">
    <h3>🚧 Products Coming Soon! 🚧</h3>
    <p>We're working hard to bring you amazing products</p>
  </div>
);

const DealsSection = ({ deals }) => (
  <div className="deals-section">
    <div className="section-header">
      <h2
        style={{
          fontWeight: "bold",
          borderBottom: "2px solid #232f3e",
          paddingBottom: "10px",
          display: "block",
          width: "fit-content",
          textAlign: "center",
          margin: "0 auto 30px",
        }}
      >
        Today's Deals
      </h2>
      <p>Limited time offers</p>
    </div>

    <div className="cards-grid cards-grid-large">
      {deals.length === 0 ? (
        <EmptyState />
      ) : (
        deals.map((deal) => <DealCard key={deal._id} deal={deal} />)
      )}
    </div>
  </div>
);

const DealCard = ({ deal }) => (
  <div className="card-base card-large deal-card">
    <div className="card-image-container">
      <img
        src={processImageUrl(deal?.product?.image)}
        onError={(e) => {
          e.target.src =
            "https://images.pexels.com/photos/3119215/pexels-photo-3119215.jpeg";
        }}
        alt={deal?.title || deal?.name || "Deal image"}
        className="card-image"
      />
      <div className="card-badge discount pulse">
        {deal.discountPercentage ? `-${deal.discountPercentage}%` : "DEAL"}
      </div>
      {deal.isOffer && <div className="card-badge featured">TODAY'S OFFER</div>}
    </div>
    <div className="card-content">
      <h4 className="card-title">{deal.title || deal.name}</h4>
      <p className="card-description">{deal.description}</p>
      <div className="card-pricing">
        <div className="price-row">
          <span className="current-price">{deal.dealPrice || deal.price}</span>
          {deal.originalPrice && (
            <span className="original-price">{deal.originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ProductRating = ({ product, renderStars }) => (
  <div className="product-rating" style={{ margin: "6px 0" }}>
    <div className="stars">{renderStars(product.averageRating || 4.5)}</div>
    <span className="rating-count">
      ({product.totalReviews || Math.floor(Math.random() * 500) + 50})
    </span>
  </div>
);

const ProductPrice = ({ product }) => (
  <div className="price-container">
    <span className="current-price">{product.price}</span>
    {product.originalPrice && (
      <span className="original-price">{product.originalPrice}</span>
    )}
    {product.discount && (
      <span className="discount-percentage">({product.discount}% off)</span>
    )}
  </div>
);

const ProductBadges = ({ product }) => (
  <div className="product-badges">
    {product.discount && (
      <div className="discount-badge">SAVE {product.discount}%</div>
    )}
    <div className="delivery-badges">
      <span className="prime-badge">Prime</span>
      <span className="free-delivery">FREE Delivery</span>
    </div>
  </div>
);
