/* eslint-disable no-unused-vars */
import "./Home.css";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import {
  processImageUrl,
  processCategoryImageUrl,
} from "../../utils/apiConfig";
import { showErrorToast, showSuccessToast } from "../../utils/muiAlertHandler.jsx";
import { useCart } from "../../context/CartContext";
import { SafeImage } from "../../utils/imageUtils.jsx";
import JumpingLoader from "../../Components/JumpingLoader";
import {
  Star,
  ShoppingCart,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { addToCartAPI } from "../../api/cartApi/cartApi";
import { trackEvent } from "../../analytics/trackEvent";

export default function Home() {
  // State management
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

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

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "/api/products?populateCategory=true&populateSubcategory=true"
      );
      setProducts(response.data.products);
    } catch (error) {
      console.error("Product fetch error:", error);
      showErrorToast("Error fetching products", "Home - Fetch Products");
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
    } catch (error) {
      console.error("Category fetch error:", error);
      showErrorToast("Error fetching categories", "Home - Fetch Categories");
      setCategories([]);
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
        await Promise.all([fetchCategories(), fetchProducts()]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        showErrorToast("Failed to load initial data", "Home - Initial Load");
      }
    };

    fetchInitialData();
  }, []);

  const userId = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    trackEvent("home_page_view", {
      user_id: userId?._id,
      location: window.location.pathname,
    });
  }, [userId?._id]);

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
        showErrorToast("Please login to add items to cart", "Home - Add to Cart");
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
      addToCart({ ...product, quantity: 1 });

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
      showSuccessToast("Added to cart!", "Home - Add to Cart");
    } catch (err) {
      console.error("Add to cart error:", err);
      showErrorToast("Failed to add to cart", "Home - Add to Cart");
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

  // Hero Carousel Component
  const HeroCarousel = () => {
    const heroSlides = [
      {
        id: 1,
        title: "SALE",
        subtitle: "Summer Fashion",
        description: "UP TO 30% OFF",
        // image: "/Mall1.png",
        buttonText: "SHOP",
        buttonAction: () => navigate("/shops"),
        textPosition: "right"
      },
      {
        id: 2,
        title: "NEW ARRIVALS", 
        subtitle: "Electronics Collection",
        description: "Latest Tech Gadgets",
        // image: "/Mall1.png",
        buttonText: "EXPLORE",
        buttonAction: () => setActiveCategory("Electronics"),
        textPosition: "left"
      },
      {
        id: 3,
        title: "FASHION FORWARD",
        subtitle: "Style Collection", 
        description: "Trending Now",
        // image: "/Mall1.png",
        buttonText: "DISCOVER",
        buttonAction: () => setActiveCategory("Fashion"),
        textPosition: "center"
      },
    ];

    const nextSlide = () => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    };

    const prevSlide = () => {
      setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    };

    // Auto-play functionality
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }, 5000);
      return () => clearInterval(interval);
    }, [heroSlides.length]);

    return (
      <div className="modern-hero-carousel">
        <div className="hero-container">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${slide.image})`,
              }}
            >
              <div className="hero-overlay"></div>
              <div className={`hero-content hero-content-${slide.textPosition} ${index === currentSlide ? 'fade-in' : 'fade-out'}`}>
                <div className={`hero-text ${index === currentSlide ? 'slide-up' : ''}`}>
                  <h2 className={`hero-subtitle ${index === currentSlide ? 'fade-delay-1' : ''}`}>{slide.subtitle}</h2>
                  <h1 className={`hero-title ${index === currentSlide ? 'fade-delay-2' : ''}`}>{slide.title}</h1>
                  <p className={`hero-description ${index === currentSlide ? 'fade-delay-3' : ''}`}>{slide.description}</p>
                  <button 
                    className={`hero-button ${index === currentSlide ? 'fade-delay-4' : ''}`}
                    onClick={slide.buttonAction}
                  >
                    {slide.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation Arrows */}
          <button className="hero-nav hero-prev" onClick={prevSlide}>
            <ChevronLeft size={24} />
          </button>
          <button className="hero-nav hero-next" onClick={nextSlide}>
            <ChevronRight size={24} />
          </button>
          
          {/* Dots Indicator - Hidden */}
          {/* 
          <div className="hero-dots">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
          */}
        </div>
      </div>
    );
  };

  // Clean Product Card Component
  const ProductCard = ({ product, onAddToCart, onClick }) => {
    const imageUrl = processImageUrl(product.images?.[0]);
    const price = product.finalPrice || product.price;
    const originalPrice = product.discount > 0 ? product.price : null;

    return (
      <div className="product-card" onClick={onClick}>
        <div className="product-image-container">
          {product.discount > 0 && (
            <div className="product-badge">-{product.discount}%</div>
          )}
          <SafeImage 
            src={imageUrl} 
            alt={product.name}
            className="product-image"
            category={product.category?.name || 'default'}
            loading="lazy"
          />
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          
          {product.averageRating > 0 && (
            <div className="product-rating">
              <div className="rating-stars">
                {"★".repeat(Math.round(product.averageRating))}
                {"☆".repeat(5 - Math.round(product.averageRating))}
              </div>
              <span className="rating-count">({product.ratingCount || 0})</span>
            </div>
          )}
          
          <div className="product-price-section">
            <span className="product-price">₹{price}</span>
            {originalPrice && (
              <span className="product-original-price">₹{originalPrice}</span>
            )}
          </div>
          
          <button 
            className="add-to-cart-button"
            onClick={(e) => onAddToCart(e, product)}
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      {/* Modern Hero Carousel Section */}
      <HeroCarousel />

      {/* Main Content */}
      <div className="home-main">
        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select 
              className="filter-select"
              value={activeCategory} 
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <select 
              className="filter-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Default</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <input
              type="text"
              className="filter-select"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Products Section */}
        <div className="products-section">
          <h2 className="section-title">Featured Products</h2>
          {loading ? (
            <div className="loading-container">
              <JumpingLoader />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onClick={() => navigate(`/product/${product._id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="categories-section">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <div
                key={category._id}
                className="category-card"
                onClick={() => setActiveCategory(category.name)}
              >
                <div className="category-name">{category.name}</div>
                <div className="category-count">
                  {products.filter(p => p.category?.name === category.name).length} items
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Latest Products Section */}
        <div className="latest-section">
          <h2 className="section-title">New Latest</h2>
          <div className="latest-grid">
            {filteredProducts.slice(0, 3).map((product) => (
              <div key={product._id} className="latest-card">
                <SafeImage 
                  src={processImageUrl(product.images?.[0])} 
                  alt={product.name}
                  className="latest-image"
                  category={product.category?.name || 'default'}
                />
                <div className="latest-overlay">
                  <h3>{product.name}</h3>
                  <button 
                    onClick={() => navigate(`/product/${product._id}`)}
                    className="latest-button"
                  >
                    VIEW DETAILS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

