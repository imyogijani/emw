/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./Menu.css";
import "./Offers.css";
import "./theme-override.css";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
import { addToCartAPI } from "../../api/cartApi/cartApi";

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

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get("/api/offers/today");
        const data = res.data;
        if (data && data.offers) {
          const mapped = data.offers.map((offer) => ({
            _id: offer._id,
            title: offer.title,
            description: offer.description,
            product: offer.product,
            dealPrice:
              offer.price || offer.product?.price * (1 - offer.discount / 100),
            originalPrice: offer.product?.price,
            discountPercentage: offer.discount,
            seller: offer.shop,
            badge: "TODAY'S OFFER",
            endDate: "Today only",
            moneySaved:
              offer.product?.price && offer.discount
                ? `₹${Math.round((offer.product.price * offer.discount) / 100)}`
                : "₹0",
          }));
          setOffers(mapped);
        }
      } catch (e) {
        console.error("Error fetching offers:", e);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    const fetchDealsProduct = async () => {
      try {
        const response = await axios.get("/api/deals/active");
        console.log("Fetched deals:", response.data.deals);
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

  const handleAddToCart = async (e, deal) => {
    e.stopPropagation();

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?._id;

      if (!userId) {
        toast.error("Please login to add items to cart");
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
      toast.success("Added to cart!");
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Failed to add to cart.");
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

  const processImageUrl = (image) => {
    const getFullUrl = (img) =>
      img.startsWith("/uploads") ? `http://localhost:8080${img}` : img;

    if (Array.isArray(image) && image.length > 0) {
      return getFullUrl(image[0]);
    } else if (typeof image === "string" && image.length > 0) {
      return getFullUrl(image);
    }

    return "https://images.pexels.com/photos/6214360/pexels-photo-6214360.jpeg";
  };

  const DealCard = ({ deal }) => (
    <div
      className="deal-card-modern"
      onClick={() =>
        navigate(`/product/${deal.product?._id}`, { state: { item: deal } })
      }
    >
      <div className="deal-image-container">
        <img
          src={processImageUrl(deal.product?.image)}
          alt={deal.product?.name || deal.title}
          loading="lazy"
        />

        <div className="deal-badge-container">
          {deal.discountPercentage && (
            <div className="deal-discount-badge">
              -{deal.discountPercentage}%
            </div>
          )}
          {deal.badge && <div className="deal-special-badge">{deal.badge}</div>}
        </div>

        <div className="deal-timer">
          <Clock size={12} />
          <span>{deal.endDate || "Limited time"}</span>
        </div>
      </div>

      <div className="deal-content">
        <div className="deal-header">
          <h3 className="deal-title">{deal.product?.name || deal.title}</h3>
          <p className="deal-description">
            {deal.product?.description || deal.description}
          </p>
        </div>

        <div className="deal-rating-section">
          <div className="deal-stars">
            {renderStars(deal.product?.averageRating || 0)}
          </div>
          <span className="deal-rating-text">
            {deal.product?.averageRating || 0}
          </span>
          <span className="deal-reviews">
            ({deal.product?.totalReviews || 0})
          </span>
        </div>

        <div className="deal-pricing">
          <div className="deal-price-row">
            <span className="deal-current-price">₹{deal.dealPrice || 0}</span>
            {deal.originalPrice && (
              <span className="deal-original-price">₹{deal.originalPrice}</span>
            )}
          </div>
          <div className="deal-savings">
            <span className="savings-text">Save {deal.moneySaved || "₹0"}</span>
            {deal.discountPercentage && (
              <span className="savings-percent">
                ({deal.discountPercentage}% off)
              </span>
            )}
          </div>
        </div>

        <div className="deal-store-info">
          <Tag size={14} />
          <span>
            By {deal.seller?.shopName || deal.seller?.names || "Store"}
          </span>
        </div>

        <button
          className="deal-add-to-cart"
          onClick={(e) => handleAddToCart(e, deal)}
        >
          <ShoppingCart size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  );

  const allDeals = [...dealsProduct, ...offers];
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
          <div className="deal-category-card">
            <Zap size={32} />
            <h3>Flash Sales</h3>
            <p>Lightning deals ending soon</p>
            <span className="category-count">
              {filteredDeals.filter((d) => d.badge?.includes("FLASH")).length}{" "}
              active deals
            </span>
          </div>
          <div className="deal-category-card">
            <TrendingDown size={32} />
            <h3>Mega Discounts</h3>
            <p>Savings up to 70% off</p>
            <span className="category-count">
              {filteredDeals.filter((d) => d.discountPercentage >= 40).length}{" "}
              active deals
            </span>
          </div>
          <div className="deal-category-card">
            <Tag size={32} />
            <h3>Bundle Offers</h3>
            <p>Buy more, save more</p>
            <span className="category-count">
              {filteredDeals.filter((d) => d.badge?.includes("BUNDLE")).length}{" "}
              active deals
            </span>
          </div>
        </div>
      </div>

      {/* Deal Information */}
      <div className="deal-info-section">
        <div className="deal-info-cards">
          <div className="deal-info-card">
            <h3>🎯 Deal Highlights</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Total Active Deals:</span>
                <span className="info-value">{filteredDeals.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Maximum Discount:</span>
                <span className="info-value">Up to 70% OFF</span>
              </div>
              <div className="info-item">
                <span className="info-label">Flash Sales:</span>
                <span className="info-value">Limited Time Only</span>
              </div>
            </div>
          </div>

          <div className="deal-info-card">
            <h3>📋 Terms & Conditions</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Valid For:</span>
                <span className="info-value">All Customers</span>
              </div>
              <div className="info-item">
                <span className="info-label">Delivery:</span>
                <span className="info-value">FREE on eligible orders</span>
              </div>
              <div className="info-item">
                <span className="info-label">Returns:</span>
                <span className="info-value">30-day return policy</span>
              </div>
            </div>
          </div>

          <div className="deal-info-card">
            <h3>🚀 Why Choose Our Deals?</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Authenticity:</span>
                <span className="info-value">100% Genuine Products</span>
              </div>
              <div className="info-item">
                <span className="info-label">Customer Support:</span>
                <span className="info-value">24/7 Available</span>
              </div>
              <div className="info-item">
                <span className="info-label">Satisfaction:</span>
                <span className="info-value">98% Happy Customers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
