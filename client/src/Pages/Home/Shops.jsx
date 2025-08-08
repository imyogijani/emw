/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./Menu.css";
import "./shops-modern.css";
import "./theme-override.css";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Star,
  ShoppingCart,
  Search,
  Filter,
  Store,
  Users,
  Package,
  Award,
  MapPin,
  Phone,
  Globe,
  Clock,
} from "lucide-react";
import axios from "../../utils/axios";
import { fetchStores } from "../../api/storeApi";
import { addToCartAPI } from "../../api/cartApi/cartApi";
import { trackEvent } from "../../analytics/trackEvent";

const mallInfo = {
  name: "E-Mall World",
  description: "Your comprehensive shopping destination",
  totalStores: 2500,
  totalProducts: 50000,
  customerSatisfaction: 98,
};

// Enhanced store data
const featuredStores = [
  {
    id: "store-1",
    name: "TechZone Electronics",
    description: "Latest gadgets and electronics",
    image: "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg",
    category: "Electronics",
    rating: 4.8,
    reviews: 15420,
    products: 2500,
    established: "2015",
    location: "Mumbai, India",
    verified: true,
    badges: ["Top Seller", "Fast Delivery"],
    specialties: ["Smartphones", "Laptops", "Gaming"],
  },
  {
    id: "store-2",
    name: "Fashion Forward",
    description: "Trendy clothing and accessories",
    image: "https://images.pexels.com/photos/3119215/pexels-photo-3119215.jpeg",
    category: "Fashion",
    rating: 4.6,
    reviews: 8930,
    products: 1800,
    established: "2018",
    location: "Delhi, India",
    verified: true,
    badges: ["Premium Quality", "Designer Brands"],
    specialties: ["Women's Wear", "Men's Fashion", "Accessories"],
  },
  {
    id: "store-3",
    name: "Home Essentials Plus",
    description: "Complete home and kitchen solutions",
    image:
      "https://images.pexels.com/photos/13968342/pexels-photo-13968342.jpeg",
    category: "Home & Kitchen",
    rating: 4.5,
    reviews: 6750,
    products: 3200,
    established: "2016",
    location: "Bangalore, India",
    verified: true,
    badges: ["Quality Assured", "Wide Range"],
    specialties: ["Kitchen Appliances", "Home Decor", "Storage"],
  },
  {
    id: "store-4",
    name: "BookMart Central",
    description: "Books, stationery and educational materials",
    image: "https://images.pexels.com/photos/46274/pexels-photo-46274.jpeg",
    category: "Books & Stationery",
    rating: 4.7,
    reviews: 4230,
    products: 5000,
    established: "2012",
    location: "Pune, India",
    verified: true,
    badges: ["Academic Excellence", "Rare Books"],
    specialties: ["Academic Books", "Fiction", "Children's Books"],
  },
  {
    id: "store-5",
    name: "FitLife Sports",
    description: "Sports equipment and fitness gear",
    image: "https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg",
    category: "Sports & Fitness",
    rating: 4.4,
    reviews: 3560,
    products: 1200,
    established: "2019",
    location: "Chennai, India",
    verified: true,
    badges: ["Authentic Gear", "Professional Quality"],
    specialties: ["Gym Equipment", "Outdoor Sports", "Fitness Wear"],
  },
  {
    id: "store-6",
    name: "Beauty Paradise",
    description: "Cosmetics and personal care products",
    image: "https://images.pexels.com/photos/3119215/pexels-photo-3119215.jpeg",
    category: "Beauty & Health",
    rating: 4.6,
    reviews: 7890,
    products: 2100,
    established: "2017",
    location: "Hyderabad, India",
    verified: true,
    badges: ["Natural Products", "Cruelty Free"],
    specialties: ["Skincare", "Makeup", "Hair Care"],
  },
];

const storeCategories = [
  { name: "All Stores", count: 2500, icon: Store },
  { name: "Electronics", count: 450, icon: Package },
  { name: "Fashion", count: 680, icon: Star },
  { name: "Home & Kitchen", count: 320, icon: Store },
  { name: "Books & Stationery", count: 200, icon: Package },
  { name: "Sports & Fitness", count: 180, icon: Star },
  { name: "Beauty & Health", count: 290, icon: Store },
  { name: "Toys & Games", count: 150, icon: Package },
];

export default function Shops() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Stores");
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState(null);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProductsAndCategories();
    loadStores();
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    trackEvent("stores_page_view", {
      user_id: user?._id,
      location: window.location.pathname,
    });
  }, []);

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get("/api/category/get-category-with-shop-count"),
        axios.get(
          "/api/products?populateCategory=true&populateSubcategory=true"
        ),
      ]);
      setCategories(catRes.data.categories || []);
      setProducts(prodRes.data.products || []);
      // console.log("Shop Page --", prodRes.data.products);
      // console.log("Shop Page 111 --", catRes.data.categories);
    } catch (err) {
      console.error("Error fetching data:", err);
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchStores({
        page: 1,
        limit: 10,
        sort: "createdAt",
        order: "desc",
        search: "",
        status: "", // optional: 'active' or 'inactive'
      });

      setStores(response?.stores || []);

      // console.log("Store Image", response.stores[1].shopImage);
      // console.log("Store List Fetched:", response.stores);
    } catch (err) {
      console.error("Error loading stores:", err);
      setError(err.message || "Something went wrong");
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStores = (stores) => {
    let filtered = stores;

    if (searchQuery) {
      filtered = filtered.filter(
        (store) =>
          store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "All Stores") {
      filtered = filtered.filter(
        (store) => store.category === selectedCategory
      );
    }

    if (sortBy === "rating") {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "reviews") {
      filtered = [...filtered].sort((a, b) => b.reviews - a.reviews);
    } else if (sortBy === "products") {
      filtered = [...filtered].sort((a, b) => b.products - a.products);
    }

    return filtered;
  };

  const handleVisitStore = (store) => {
    const user = JSON.parse(localStorage.getItem("user"));
    trackEvent("store_click", {
      user_id: user?._id,
      store_id: store._id,
      store_name: store.shopName,
      location: window.location.pathname,
    });

    navigate(`/store/${store._id}`, { state: { store } });
  };

  // const handleAddToCart = (e, product) => {
  //   e.stopPropagation();
  //   addToCart({
  //     ...product,
  //     quantity: 1,
  //     addedAt: new Date().toISOString(),
  //   });
  //   toast.success(`${product.name} added to cart! 🛒`);
  // };

  const handleAddToCart = async (e, product, sourcePage = "AllStoresPage") => {
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

  const StoreCard = ({ store }) => (
    <div className="store-card" onClick={() => handleVisitStore(store)}>
      <div className="store-image-container">
        {/* <img src={store.shopImage} alt={store.shopName} loading="lazy" /> */}
        <img
          src={processImageUrlSingle(store.shopImage)}
          alt={store.shopName}
          loading="lazy"
        />
        {store.verified && (
          <div className="store-verified-badge">
            <Award size={14} />
            <span>Verified</span>
          </div>
        )}
      </div>

      <div className="store-content">
        <div className="store-header">
          <h3 className="store-name">{store.shopName}</h3>
          <p className="store-description">{store.description}</p>
        </div>

        <div className="store-rating-section">
          <div className="store-stars">{renderStars(store.averageRating)}</div>
          {/* <div className="store-stars">{renderStars(4)}</div> */}
          <span className="store-rating-text">{store.averageRating}</span>
          {/* <span className="store-rating-text">{4}</span> */}
          <span className="store-reviews">
            ({store.totalReviews.toLocaleString()} reviews)
          </span>

          {/* <span className="store-reviews">(1234 reviews)</span> */}
        </div>
        {/* 
        <div className="store-badges">
          {store.badges.map((badge, index) => (
            <span key={index} className="store-badge">
              {badge}
            </span>
          ))}
        </div> */}

        <div className="store-stats">
          <div className="store-stat">
            <Package size={14} />
            <span>{store.totalProducts.toLocaleString()} products</span>
            {/* <span>{234} products</span> */}
          </div>
          <div className="store-stat">
            <MapPin size={14} />
            <span>{store.location || "Mumbai"}</span>
          </div>
          <div className="store-stat">
            <Clock size={14} />
            {/* <span>Since {store.established}</span> */}
            <span>Since {store.createdAt}</span>
            createdAt
          </div>
        </div>

        <div className="store-specialties">
          <strong>Specialties:</strong>
          <div className="specialty-tags">
            {store.specialist.map((specialty, index) => (
              <span key={index} className="specialty-tag">
                {specialty}
              </span>
            ))}
          </div>
        </div>

        <button className="visit-store-btn">
          <Store size={16} />
          Visit Store
        </button>
      </div>
    </div>
  );

  const ProductCard = ({ product }) => {
    const navigate = useNavigate();

    const handleProductClick = async () => {
      // Track the click event
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

      // Then navigate to product detail page
      navigate(`/product/${product._id}`, { state: { product } });
    };
    return (
      <div className="product-card-compact" onClick={handleProductClick}>
        <div className="product-image-wrapper">
          <img
            src={processImageUrl(product.image)}
            alt={product.name}
            loading="lazy"
          />
        </div>
        <div className="product-details-compact">
          <h4>{product.name}</h4>
          {/* <p className="product-price">₹{product.price}</p> */}
          <p className="product-price">
            ₹{calculateDiscountedPriceFinal(product.price, product.discount)}
          </p>
          <button
            className="add-to-cart-compact"
            onClick={(e) => handleAddToCart(e, product)}
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    );
  };

  const filteredStores = filterStores(featuredStores);

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

  const processImageUrlSingle = (image) => {
    if (image && image.startsWith("/uploads")) {
      return `http://localhost:8080${image}`;
    }
    return image || "/images/offer1.png";
  };

  const calculateDiscountedPriceFinal = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return price - (price * discount) / 100;
  };

  return (
    <div className="shops-page">
      {/* Hero Section */}
      <div className="shops-hero">
        <div className="shops-hero-content">
          <div className="shops-hero-text">
            <h1>Discover Amazing Stores</h1>
            <p>
              Shop from {mallInfo.totalStores.toLocaleString()}+ verified stores
              across India
            </p>
            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <Store size={24} />
                <span>{mallInfo.totalStores.toLocaleString()}+ Stores</span>
              </div>
              <div className="hero-stat-item">
                <Package size={24} />
                <span>{mallInfo.totalProducts.toLocaleString()}+ Products</span>
              </div>
              <div className="hero-stat-item">
                <Users size={24} />
                <span>{mallInfo.customerSatisfaction}% Satisfaction</span>
              </div>
            </div>
          </div>
          <div className="shops-hero-image">
            <img
              src="https://images.pexels.com/photos/11077404/pexels-photo-11077404.jpeg"
              alt="Shopping Stores"
            />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="shops-controls">
        <div className="shops-search">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search stores by name, category, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shops-search-input"
          />
        </div>

        <div className="shops-filters">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="shops-sort-select"
          >
            <option value="">Sort by</option>
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviewed</option>
            <option value="products">Most Products</option>
          </select>
        </div>
      </div>

      {/* Store Categories */}
      <div className="store-categories">
        <h2>Browse by Category</h2>
        <div className="category-filters">
          {storeCategories.map((category) => (
            <button
              key={category.name}
              className={`category-filter-btn ${
                selectedCategory === category.name ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              <category.icon size={18} />
              <span>{category.name}</span>
              <span className="category-count">({category.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Stores */}
      <div className="stores-main-content">
        <div className="stores-header">
          <h2>🏪 Featured Stores ({stores.length} stores)</h2>
          <p>Handpicked stores with the best products and service</p>
        </div>

        <div className="stores-grid">
          {loading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Loading stores...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="no-stores-found">
              <h3>No stores found</h3>
              <p>Try adjusting your search or category filter</p>
            </div>
          ) : (
            stores.map((store) => <StoreCard key={store._id} store={store} />)
          )}
        </div>
      </div>

      {/* Latest Products */}
      <div className="latest-products-section">
        <div className="section-header">
          <h2>🆕 Latest Products</h2>
          <p>Fresh arrivals from our partner stores</p>
        </div>

        <div className="products-grid-compact">
          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <div className="under-development">
              <h3>🚧 Products coming soon! 🚧</h3>
              <p>Our partner stores are adding new products daily</p>
            </div>
          ) : (
            products
              .slice(0, 8)
              .map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
          )}
        </div>
      </div>

      {/* Store Information */}
      <div className="store-info-section">
        <div className="store-info-cards">
          <div className="store-info-card">
            <h3>🏪 Store Directory</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Total Stores:</span>
                <span className="info-value">
                  {mallInfo.totalStores.toLocaleString()}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Verified Stores:</span>
                <span className="info-value">2,250+</span>
              </div>
              <div className="info-item">
                <span className="info-label">New This Month:</span>
                <span className="info-value">45 stores</span>
              </div>
            </div>
          </div>

          <div className="store-info-card">
            <h3>🎯 Quality Assurance</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Verification Process:</span>
                <span className="info-value">Strict Quality Checks</span>
              </div>
              <div className="info-item">
                <span className="info-label">Customer Support:</span>
                <span className="info-value">24/7 Available</span>
              </div>
              <div className="info-item">
                <span className="info-label">Return Policy:</span>
                <span className="info-value">Store-specific</span>
              </div>
            </div>
          </div>

          <div className="store-info-card">
            <h3>📈 Why Shop With Us?</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Wide Selection:</span>
                <span className="info-value">50,000+ Products</span>
              </div>
              <div className="info-item">
                <span className="info-label">Competitive Prices:</span>
                <span className="info-value">Best Market Rates</span>
              </div>
              <div className="info-item">
                <span className="info-label">Satisfaction Rate:</span>
                <span className="info-value">98% Happy Customers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
