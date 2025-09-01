/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./Menu.css";
import "./Offers.css";
import "./theme-override.css";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../utils/muiAlertHandler.jsx";
import {
  Star,
  ShoppingCart,
  Filter,
  Clock,
  TrendingDown,
  Zap,
  Tag,
  Search,
} from "lucide-react";
import axios from "../../utils/axios";
import { processImageUrl } from "../../utils/apiConfig";
import { addToCartAPI } from "../../api/cartApi/cartApi";
import { trackEvent } from "../../analytics/trackEvent";

const mallInfo = {
  name: "E-Mall World",
  description: "Your trusted shopping destination",
  rating: 4.6,
  reviews: 125000,
};

export default function Offers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dealsProduct, setDealsProduct] = useState([]);

  // useEffect(() => {
  //   const fetchOffers = async () => {
  //     try {
  //       const res = await axios.get("/api/offers/today");
  //       const data = res.data;
  //       if (data && data.offers) {
  //         const mapped = data.offers.map((offer) => ({
  //           _id: offer._id,
  //           title: offer.title,
  //           description: offer.description,
  //           product: offer.product,
  //           dealPrice:
  //             offer.price || offer.product?.price * (1 - offer.discount / 100),
  //           originalPrice: offer.product?.price,
  //           discountPercentage: offer.discount,
  //           seller: offer.shop,
  //           badge: "TODAY'S OFFER",
  //           endDate: "Today only",
  //           moneySaved:
  //             offer.product?.price && offer.discount
  //               ? `₹${Math.round((offer.product.price * offer.discount) / 100)}`
  //               : "₹0",
  //         }));
  //         setOffers(mapped);
  //       }
  //     } catch (e) {
  //       console.error("Error fetching offers:", e);
  //       setOffers([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchOffers();
  // }, []);

  useEffect(() => {
    const fetchDealsProduct = async () => {
      try {
        const response = await axios.get("/api/deals/active");
        // console.log("Fetched deals:", response.data.deals);
        setDealsProduct(response.data.deals || []);
      } catch (error) {
        console.error("Error fetching active deals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealsProduct();
  }, []);

  const filterDeals = (deals) => {
    let filtered = [...deals];

    // Search filter
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(
        (deal) =>
          deal.product?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          deal.product?.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          deal.seller?.shopName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          deal.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "flash":
          filtered = filtered.filter((deal) => deal.badge?.includes("FLASH"));
          break;
        case "high-discount":
          filtered = filtered.filter(
            (deal) => (deal.discountPercentage || 0) >= 40
          );
          break;
        case "ending-soon":
          filtered = filtered.filter((deal) => {
            if (!deal.endDate) return false;
            const end = new Date(deal.endDate).getTime();
            const now = new Date().getTime();
            const diff = end - now;
            const hoursLeft = diff / (1000 * 60 * 60);
            return hoursLeft <= 6;
          });
          break;
        default:
          break;
      }
    }

    // Sort
    if (sortBy === "discount-high") {
      filtered = [...filtered].sort(
        (a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0)
      );
    } else if (sortBy === "price-low") {
      filtered = [...filtered].sort(
        (a, b) => (a.dealPrice || 0) - (b.dealPrice || 0)
      );
    } else if (sortBy === "rating") {
      filtered = [...filtered].sort(
        (a, b) =>
          (b.product?.averageRating || 0) - (a.product?.averageRating || 0)
      );
    }
    return filtered;
  };

  const handleAddToCart = async (e, deal, sourcePage = "DealPage") => {
    e.stopPropagation();

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?._id;

      if (!userId) {
        showErrorToast("Please login to add items to cart", "Offers - Add to Cart");
        return;
      }

      const productData = {
        productId: deal.product?._id,
        quantity: 1,
        price: deal.dealPrice,
        title: deal.product?.name || deal.title,
        discount: deal.discountPercentage,
      };

      await addToCartAPI(userId, productData);

      await trackEvent("add_to_cart", {
        user_id: userId,
        product_id: deal.product?._id,
        name: deal.product.name,
        category: deal.product.category?.name,
        quantity: 1,
        price: deal.dealPrice,

        discount: deal.discountPercentage,
        source_page: sourcePage,
        location: window.location.pathname,
      });
      showSuccessToast("Added to cart!", "Offers - Add to Cart");
    } catch (err) {
      console.error("Add to cart error:", err);
      showErrorToast("Failed to add to cart.", "Offers - Add to Cart");
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;

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

    const emptyStars = 5 - Math.ceil(numRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="star-empty" size={14} />);
    }

    return stars;
  };

  // processImageUrl is now imported from utils

  const DealCard = ({ deal }) => {
    const navigate = useNavigate();

    const handleProductClick = async () => {
      // Track the click event
      await trackEvent("view_product_card_click", {
        product_id: deal.product._id,
        name: deal.product.name,
        category: deal.product.category.name,
        price: deal.dealPrice,
        location: window.location.pathname,
      });

      // Then navigate to product detail page
      navigate(`/product/${deal.product?._id}`, { state: { item: deal } });
    };

    return (
      <div
        className="card-base card-large deal-card"
        onClick={handleProductClick}
      >
        <div className="card-image-container">
          <img
            src={processImageUrl(deal.product?.image)}
            alt={deal.product?.name || deal.title}
            className="card-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = "https://images.pexels.com/photos/3119215/pexels-photo-3119215.jpeg";
            }}
          />

          {deal.discountPercentage && (
            <div className="card-badge discount pulse">
              -{deal.discountPercentage}%
            </div>
          )}
          {deal.badge && (
            <div className="card-badge featured">{deal.badge}</div>
          )}
          {deal.endDate && (
            <div className="card-timer">
              <Clock size={12} />
              <span>{deal.endDate || "Limited time"}</span>
            </div>
          )}
        </div>

        <div className="card-content">
          <h3 className="card-title">{deal.product?.name || deal.title}</h3>
          <p className="card-description">
            {deal.product?.description || deal.description}
          </p>

          <div className="card-rating">
            <div className="rating-stars">
              {renderStars(deal.product?.averageRating || 0)}
            </div>
            <span className="rating-value">
              {deal.product?.averageRating || 0}
            </span>
            <span className="rating-count">
              ({deal.product?.totalReviews || 0})
            </span>
          </div>

          <div className="card-pricing">
            <div className="price-row">
              <span className="current-price">₹{deal.dealPrice || 0}</span>
              {deal.originalPrice && (
                <span className="original-price">
                  ₹{deal.originalPrice}
                </span>
              )}
            </div>
            <div className="savings-info">
              <span className="savings-text">
                Save {deal.moneySaved || "₹0"}
              </span>
              {deal.discountPercentage && (
                <span className="savings-percent">
                  ({deal.discountPercentage}% off)
                </span>
              )}
            </div>
          </div>

          <div className="card-store-info">
            <Tag size={14} />
            <span>
              By {deal.seller?.shopName || deal.seller?.names || "Store"}
            </span>
          </div>

          <div className="card-actions">
            <button
              className="card-action primary"
              onClick={(e) => handleAddToCart(e, deal)}
            >
              <ShoppingCart size={16} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    );
  };
  const allDeals = [...dealsProduct];
  const filteredDeals = filterDeals(allDeals);

  return (
    <div className="offers-page">
      {/* Hero Section */}
      <div className="offers-hero">
        <div className="offers-hero-content">
          <div className="offers-hero-text">
            <h1>Today's Best Deals</h1>
            <p>Limited time offers you don't want to miss</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <TrendingDown size={24} />
                <span>Up to 70% OFF</span>
              </div>
              <div className="hero-stat">
                <Zap size={24} />
                <span>Flash Sales</span>
              </div>
              <div className="hero-stat">
                <Clock size={24} />
                <span>Limited Time</span>
              </div>
            </div>
          </div>
          <div className="offers-hero-image">
            <img
              src="https://images.pexels.com/photos/6214360/pexels-photo-6214360.jpeg"
              alt="Great Deals"
            />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="offers-controls">
        <div className="offers-search">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="offers-search-input"
            />
          </div>
        </div>

        <div className="offers-filters">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="offers-filter-select"
          >
            <option value="all">All Deals</option>
            <option value="flash">Flash Sales</option>
            <option value="high-discount">High Discount (40%+)</option>
            <option value="ending-soon">Ending Soon</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="offers-sort-select"
          >
            <option value="">Sort by</option>
            <option value="discount-high">Highest Discount</option>
            <option value="price-low">Lowest Price</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="offers-main-content">
        <div className="offers-header">
          <h2>🔥 Hot Deals ({filteredDeals.length} items)</h2>
          <p>Grab these amazing offers before they're gone!</p>
        </div>
        <div className="deals-grid-container">
          {loading ? (
            <div className="loading-deals">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="deal-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="no-deals-found">
              <h3>No deals found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredDeals.map((deal) => <DealCard key={deal._id} deal={deal} />)
          )}
        </div>
      </div>

      {/* Deal Categories */}
      <div className="deal-categories-section">
        <h2>Shop by Deal Category</h2>
        <div className="deal-categories-grid">
          <div className="card-base card-medium category-card">
            <div className="card-content">
              <div className="card-icon">
                <Zap size={32} />
              </div>
              <h3 className="card-title">Flash Sales</h3>
              <p className="card-description">Lightning deals ending soon</p>
              <span className="card-badge primary">
                {filteredDeals.filter((d) => d.badge?.includes("FLASH")).length}{" "}
                active deals
              </span>
            </div>
          </div>
          <div className="card-base card-medium category-card">
            <div className="card-content">
              <div className="card-icon">
                <TrendingDown size={32} />
              </div>
              <h3 className="card-title">Mega Discounts</h3>
              <p className="card-description">Savings up to 70% off</p>
              <span className="card-badge success">
                {filteredDeals.filter((d) => d.discountPercentage >= 40).length}{" "}
                active deals
              </span>
            </div>
          </div>
          <div className="card-base card-medium category-card">
            <div className="card-content">
              <div className="card-icon">
                <Tag size={32} />
              </div>
              <h3 className="card-title">Bundle Offers</h3>
              <p className="card-description">Buy more, save more</p>
              <span className="card-badge warning">
                {filteredDeals.filter((d) => d.badge?.includes("BUNDLE")).length}{" "}
                active deals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Information */}
      <div className="deal-info-section">
        <div className="cards-grid cards-grid-medium">
          <div className="card-base card-medium info-card">
            <div className="card-content">
              <h3 className="card-title">🎯 Deal Highlights</h3>
              <div className="card-info-list">
                <div className="card-info-item">
                  <span className="info-label">Total Active Deals:</span>
                  <span className="info-value">{filteredDeals.length}</span>
                </div>
                <div className="card-info-item">
                  <span className="info-label">Maximum Discount:</span>
                  <span className="info-value">Up to 70% OFF</span>
                </div>
                <div className="card-info-item">
                  <span className="info-label">Flash Sales:</span>
                  <span className="info-value">Limited Time Only</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-base card-medium info-card">
            <div className="card-content">
              <h3 className="card-title">📋 Terms & Conditions</h3>
              <div className="card-info-list">
                <div className="card-info-item">
                  <span className="info-label">Valid For:</span>
                  <span className="info-value">All Customers</span>
                </div>
                <div className="card-info-item">
                  <span className="info-label">Delivery:</span>
                  <span className="info-value">FREE on eligible orders</span>
                </div>
                <div className="card-info-item">
                  <span className="info-label">Returns:</span>
                  <span className="info-value">30-day return policy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-base card-medium info-card">
            <div className="card-content">
              <h3 className="card-title">🚀 Why Choose Our Deals?</h3>
              <div className="card-info-list">
                <div className="card-info-item">
                  <span className="info-label">Authenticity:</span>
                  <span className="info-value">100% Genuine Products</span>
                </div>
                <div className="card-info-item">
                  <span className="info-label">Customer Support:</span>
                  <span className="info-value">24/7 Available</span>
                </div>
                <div className="card-info-item">
                  <span className="info-label">Satisfaction:</span>
                  <span className="info-value">98% Happy Customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
