/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { showSuccessToast, showErrorToast } from "../../utils/errorHandler";
import { SafeImage } from "../../utils/imageUtils.jsx";
import {
  Star,
  ShoppingCart,
  Filter,
  Grid,
  List,
  Search,
  ChevronDown,
  Heart,
  Eye,
  Truck,
  Shield,
  Award,
  Zap,
  Tag,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Sample product data for the modern grid layout
const sampleProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    category: "Electronics",
    price: 299.99,
    originalPrice: 399.99,
    rating: 4.8,
    reviews: 2847,
    image: "https://via.placeholder.com/400x400/ff9900/ffffff?text=Headphones",
    badge: "Best Seller",
    inStock: true,
    freeShipping: true,
    description: "High-quality wireless headphones with noise cancellation and premium sound quality."
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    category: "Wearables",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.6,
    reviews: 1523,
    image: "https://via.placeholder.com/400x400/232f3e/ffffff?text=Smart+Watch",
    badge: "New",
    inStock: true,
    freeShipping: true,
    description: "Advanced fitness tracking with heart rate monitoring and GPS functionality."
  },
  {
    id: 3,
    name: "Organic Coffee Beans",
    category: "Food & Beverages",
    price: 24.99,
    originalPrice: 29.99,
    rating: 4.9,
    reviews: 892,
    image: "https://via.placeholder.com/400x400/67748e/ffffff?text=Sneakers",
    badge: "Organic",
    inStock: true,
    freeShipping: false,
    description: "Premium organic coffee beans sourced from sustainable farms worldwide."
  },
  {
    id: 4,
    name: "Minimalist Desk Lamp",
    category: "Home & Garden",
    price: 89.99,
    originalPrice: 119.99,
    rating: 4.7,
    reviews: 634,
    image: "https://via.placeholder.com/400x400/28a745/ffffff?text=Organic+Skincare",
    badge: "Sale",
    inStock: true,
    freeShipping: true,
    description: "Modern LED desk lamp with adjustable brightness and sleek design."
  },
  {
    id: 5,
    name: "Yoga Mat Pro",
    category: "Sports & Fitness",
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.5,
    reviews: 1247,
    image: "https://via.placeholder.com/400x400/6610f2/ffffff?text=Handbag",
    badge: "Eco-Friendly",
    inStock: true,
    freeShipping: true,
    description: "Professional-grade yoga mat with superior grip and comfort."
  },
  {
    id: 6,
    name: "Wireless Charging Pad",
    category: "Electronics",
    price: 39.99,
    originalPrice: 59.99,
    rating: 4.4,
    reviews: 756,
    image: "https://via.placeholder.com/400x400/fd7e14/ffffff?text=Coffee+Maker",
    badge: "Fast Charge",
    inStock: true,
    freeShipping: true,
    description: "Fast wireless charging pad compatible with all Qi-enabled devices."
  },
  {
    id: 7,
    name: "Ceramic Plant Pot Set",
    category: "Home & Garden",
    price: 34.99,
    originalPrice: 44.99,
    rating: 4.6,
    reviews: 423,
    image: "https://via.placeholder.com/400x400/dc3545/ffffff?text=Gaming+Chair",
    badge: "Handmade",
    inStock: true,
    freeShipping: false,
    description: "Beautiful ceramic plant pots perfect for indoor gardening."
  },
  {
    id: 8,
    name: "Bluetooth Speaker",
    category: "Electronics",
    price: 79.99,
    originalPrice: 99.99,
    rating: 4.7,
    reviews: 1834,
    image: "https://via.placeholder.com/400x400/20c997/ffffff?text=Yoga+Mat",
    badge: "Waterproof",
    inStock: true,
    freeShipping: true,
    description: "Portable Bluetooth speaker with 360-degree sound and waterproof design."
  }
];

const categories = ["All Products", "Electronics", "Wearables", "Food & Beverages", "Home & Garden", "Sports & Fitness"];

export default function Products() {
  const [products, setProducts] = useState(sampleProducts);
  const [filteredProducts, setFilteredProducts] = useState(sampleProducts);
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [wishlist, setWishlist] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const productsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  // Filter and search functionality
  useEffect(() => {
    let filtered = products;

    // Category filter
    if (selectedCategory !== "All Products") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        filtered.sort((a, b) => b.id - a.id);
        break;
      default:
        // Featured - keep original order
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy, priceRange, products]);

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
    showSuccessToast(`${product.name} added to cart!`);
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const ProductCard = ({ product }) => {
    const isWishlisted = wishlist.includes(product.id);
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    return (
      <div className={`product-card ${viewMode === 'list' ? 'list-view' : ''}`}>
        <div className="product-image-container">
          <SafeImage 
            src={product.image} 
            alt={product.name} 
            className="product-image"
            category={product.category}
          />
          {product.badge && (
            <span className={`product-badge ${product.badge.toLowerCase().replace(' ', '-')}`}>
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="discount-badge">-{discount}%</span>
          )}
          <div className="product-overlay">
            <button 
              className="overlay-btn wishlist-btn"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
            <button 
              className="overlay-btn view-btn"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <Eye size={18} />
            </button>
          </div>
        </div>
        
        <div className="product-info">
          <div className="product-category">{product.category}</div>
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          
          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={14} 
                  fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                  className="star"
                />
              ))}
            </div>
            <span className="rating-text">{product.rating}</span>
            <span className="reviews-count">({product.reviews})</span>
          </div>
          
          <div className="product-pricing">
            <span className="current-price">₹{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="original-price">₹{product.originalPrice}</span>
            )}
          </div>
          
          <div className="product-features">
            {product.freeShipping && (
              <span className="feature-badge">
                <Truck size={12} />
                Free Shipping
              </span>
            )}
            {product.inStock && (
              <span className="stock-status in-stock">In Stock</span>
            )}
          </div>
          
          <button 
            className="add-to-cart-btn"
            onClick={() => handleAddToCart(product)}
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="products-page">
      {/* Modern Hero Section */}
      <div className="modern-hero">
        <div className="hero-background">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="hero-shape shape-3"></div>
        </div>
        <div className="hero-container">
          <div className="hero-text">
            <div className="hero-badge">
              <Zap size={16} />
              <span>Premium Collection</span>
            </div>
            <h1 className="hero-title">
              Discover Your Perfect
              <span className="gradient-text"> Products</span>
            </h1>
            <p className="hero-description">
              Explore our carefully curated collection of premium products designed to elevate your lifestyle. 
              From cutting-edge electronics to sustainable home goods.
            </p>
            <div className="hero-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <Award size={20} />
                </div>
                <div className="feature-text">
                  <h4>Premium Quality</h4>
                  <p>Hand-picked products</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Truck size={20} />
                </div>
                <div className="feature-text">
                  <h4>Fast Delivery</h4>
                  <p>Express shipping</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Shield size={20} />
                </div>
                <div className="feature-text">
                  <h4>Secure Shopping</h4>
                  <p>Protected payments</p>
                </div>
              </div>
            </div>
            <div className="hero-cta">
              <button className="cta-primary">
                <span>Start Shopping</span>
                <ArrowRight size={18} />
              </button>
              <div className="hero-metrics">
                <div className="metric">
                  <span className="metric-number">10K+</span>
                  <span className="metric-label">Products</span>
                </div>
                <div className="metric">
                  <span className="metric-number">50K+</span>
                  <span className="metric-label">Happy Customers</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="product-showcase">
              <div className="showcase-item item-1">
                <SafeImage 
                  src="/Mall1.png" 
                  alt="Featured Product 1"
                  className="showcase-image"
                />
              </div>
              <div className="showcase-item item-2">
                <SafeImage 
                  src="/Mall1.png" 
                  alt="Featured Product 2"
                  className="showcase-image"
                />
              </div>
              <div className="showcase-item item-3">
                <SafeImage 
                  src="/Mall1.png" 
                  alt="Featured Product 3"
                  className="showcase-image"
                />
              </div>
            </div>
            <div className="floating-elements">
              <div className="floating-badge badge-1">
                <Tag size={16} />
                <span>New Arrivals</span>
              </div>
              <div className="floating-badge badge-2">
                <Star size={16} />
                <span>Top Rated</span>
              </div>
              <div className="floating-badge badge-3">
                <Zap size={16} />
                <span>Best Seller</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            <ChevronDown className={showFilters ? 'rotated' : ''} size={16} />
          </button>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
          </select>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <div className="category-nav">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="products-section">
        <div className="section-header">
          <h2>Products ({filteredProducts.length})</h2>
          <div className="results-info">
            Showing {startIndex + 1}-{Math.min(startIndex + productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : currentProducts.length > 0 ? (
          <div className={`products-grid ${viewMode}`}>
            {currentProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <div className="page-numbers">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .products-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .modern-hero {
          position: relative;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }

        .hero-shape {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
        }

        .shape-1 {
          width: 300px;
          height: 300px;
          top: 10%;
          right: 10%;
        }

        .shape-2 {
          width: 200px;
          height: 200px;
          bottom: 20%;
          left: 5%;
        }

        .shape-3 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 30%;
        }

        .hero-container {
          position: relative;
          z-index: 10;
          max-width: 1400px;
          margin: 0 auto;
          padding: 80px 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .hero-text {
          color: white;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 50px;
          color: #a5b4fc;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
        }

        .hero-title {
          font-size: 4.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
          color: white;
        }

        .gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 1.2rem;
          line-height: 1.7;
          color: #cbd5e1;
          margin-bottom: 40px;
          max-width: 600px;
        }

        .hero-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 40px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .feature-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .feature-text h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }

        .feature-text p {
          font-size: 0.9rem;
          color: #94a3b8;
          margin: 0;
        }

        .hero-cta {
          display: flex;
          align-items: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .cta-primary {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
        }

        .cta-primary:hover {
          box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
          background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
        }

        .hero-metrics {
          display: flex;
          gap: 32px;
        }

        .metric {
          text-align: center;
        }

        .metric-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 0.9rem;
          color: #94a3b8;
        }

        .hero-visual {
          position: relative;
          height: 600px;
        }

        .product-showcase {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .showcase-item {
          position: absolute;
          border-radius: 24px;
          overflow: hidden;
          background: white;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .showcase-item:hover {
          box-shadow: 0 35px 70px rgba(0, 0, 0, 0.4);
        }

        .item-1 {
          width: 280px;
          height: 320px;
          top: 20%;
          left: 10%;
          z-index: 3;
        }

        .item-2 {
          width: 240px;
          height: 280px;
          top: 40%;
          right: 10%;
          z-index: 2;
        }

        .item-3 {
          width: 200px;
          height: 240px;
          bottom: 10%;
          left: 30%;
          z-index: 1;
        }

        .showcase-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .floating-badge {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .badge-1 {
          top: 10%;
          left: 50%;
          background: linear-gradient(135deg, #fef3c7, #fbbf24);
          color: #92400e;
        }

        .badge-2 {
          top: 70%;
          right: 5%;
          background: linear-gradient(135deg, #dbeafe, #3b82f6);
          color: #1e40af;
        }

        .badge-3 {
          bottom: 30%;
          left: 5%;
          background: linear-gradient(135deg, #dcfdf7, #10b981);
          color: #065f46;
        }

        .controls-section {
          max-width: 1200px;
          margin: -30px auto 40px;
          padding: 0 20px;
          display: flex;
          gap: 20px;
          align-items: center;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 20px;
          position: relative;
          z-index: 10;
        }

        .search-bar {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }

        .search-input {
          width: 100%;
          padding: 15px 15px 15px 45px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .filter-toggle:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .rotated {
          transform: rotate(180deg);
        }

        .sort-select {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          font-weight: 500;
          min-width: 180px;
        }

        .view-toggle {
          display: flex;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .view-btn {
          padding: 12px 15px;
          border: none;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .view-btn:hover {
          background: #f8fafc;
        }

        .view-btn.active {
          background: #3b82f6;
          color: white;
        }

        .advanced-filters {
          max-width: 1200px;
          margin: 0 auto 30px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .filter-group {
          margin-bottom: 20px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }

        .price-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .price-inputs input {
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          width: 100px;
        }

        .category-nav {
          max-width: 1200px;
          margin: 0 auto 40px;
          padding: 0 20px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .category-btn {
          padding: 12px 24px;
          border: 2px solid #e2e8f0;
          border-radius: 25px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          white-space: nowrap;
        }

        .category-btn:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .category-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .products-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px 60px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .section-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .results-info {
          color: #6b7280;
          font-size: 14px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        .products-grid.list {
          grid-template-columns: 1fr;
        }

        .product-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
        }

        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .product-card.list-view {
          display: flex;
          align-items: center;
        }

        .product-image-container {
          position: relative;
          overflow: hidden;
          aspect-ratio: 1;
        }

        .product-card.list-view .product-image-container {
          width: 200px;
          flex-shrink: 0;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product-card:hover .product-image {
          transform: scale(1.1);
        }

        .product-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          z-index: 2;
        }

        .product-badge.best-seller {
          background: #ef4444;
        }

        .product-badge.new {
          background: #10b981;
        }

        .product-badge.organic {
          background: #059669;
        }

        .product-badge.sale {
          background: #f59e0b;
        }

        .product-badge.eco-friendly {
          background: #16a34a;
        }

        .product-badge.fast-charge {
          background: #3b82f6;
        }

        .product-badge.handmade {
          background: #8b5cf6;
        }

        .product-badge.waterproof {
          background: #06b6d4;
        }

        .discount-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #dc2626;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .product-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .product-card:hover .product-overlay {
          opacity: 1;
        }

        .overlay-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: white;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .overlay-btn:hover {
          background: #3b82f6;
          color: white;
          transform: scale(1.1);
        }

        .wishlist-btn.active {
          background: #ef4444;
          color: white;
        }

        .product-info {
          padding: 20px;
        }

        .product-category {
          color: #6b7280;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .product-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .product-description {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .stars {
          display: flex;
          gap: 2px;
        }

        .star {
          color: #fbbf24;
        }

        .rating-text {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .reviews-count {
          color: #6b7280;
          font-size: 12px;
        }

        .product-pricing {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .current-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .original-price {
          font-size: 1rem;
          color: #6b7280;
          text-decoration: line-through;
        }

        .product-features {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .feature-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #dcfdf7;
          color: #065f46;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .stock-status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .stock-status.in-stock {
          background: #dcfdf7;
          color: #065f46;
        }

        .add-to-cart-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .add-to-cart-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 10px;
          color: #374151;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 40px;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 5px;
        }

        .page-btn {
          width: 40px;
          height: 40px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-btn:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .page-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        @media (max-width: 768px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 60px 20px;
            text-align: center;
          }

          .hero-title {
            font-size: 3rem;
          }

          .hero-features {
            gap: 16px;
          }

          .hero-cta {
            flex-direction: column;
            gap: 24px;
            align-items: center;
          }

          .hero-metrics {
            gap: 24px;
          }

          .hero-visual {
            height: 400px;
            order: -1;
          }

          .item-1 {
            width: 200px;
            height: 240px;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
          }

          .item-2 {
            width: 160px;
            height: 200px;
            top: 50%;
            right: 20%;
          }

          .item-3 {
            width: 140px;
            height: 180px;
            bottom: 10%;
            left: 20%;
          }

          .controls-section {
            flex-direction: column;
            gap: 15px;
          }

          .filter-controls {
            width: 100%;
            justify-content: space-between;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
          }

          .category-nav {
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 10px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
