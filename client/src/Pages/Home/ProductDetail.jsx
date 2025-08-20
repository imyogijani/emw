/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import {
  Star,
  ShoppingCart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  Award,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Eye,
  ChevronDown,
  Info,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import "./ProductDetail.css";
import axios from "../../utils/axios";
import { processImageUrl } from "../../utils/apiConfig";
import {
  getProductReviews,
  toggleHelpful,
  getReviewSummary,
} from "../../api/reviewApi";
import { getTechnicalDetailsById } from "../../api/technicalDetailsApi";
import { addToCartAPI } from "../../api/cartApi/cartApi";
import { trackEvent } from "../../analytics/trackEvent";

// Import product categories data
// const mallItemsByCategory = {
//   Electronics: [
//     {
//       id: "el-1",
//       title: "iPhone 15 Pro Max",
//       desc: "Latest flagship with A17 Pro chip",
//       image: "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg",
//       price: "₹159999",
//       originalPrice: "₹169999",
//       rating: 4.8,
//       reviews: 2341,
//       category: "Electronics",
//     },
//     {
//       id: "el-2",
//       title: "Sony WH-1000XM5",
//       desc: "Premium noise-cancelling headphones",
//       image: "https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg",
//       price: "₹29999",
//       originalPrice: "₹34999",
//       rating: 4.6,
//       reviews: 1567,
//       category: "Electronics",
//     },
//     {
//       id: "el-3",
//       title: "MacBook Pro M3",
//       desc: "Professional laptop for creators",
//       image: "https://images.pexels.com/photos/18105/pexels-photo.jpg",
//       price: "₹199999",
//       rating: 4.9,
//       reviews: 876,
//       category: "Electronics",
//     },
//     {
//       id: "el-4",
//       title: "Apple Watch Series 9",
//       desc: "Advanced health and fitness tracking",
//       image: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg",
//       price: "₹41999",
//       originalPrice: "₹45999",
//       rating: 4.7,
//       reviews: 1234,
//       category: "Electronics",
//     },
//     {
//       id: "el-5",
//       title: "Samsung Galaxy Tab S9",
//       desc: "Premium tablet for work and entertainment",
//       image:
//         "https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg",
//       price: "₹54999",
//       rating: 4.5,
//       reviews: 892,
//       category: "Electronics",
//     },
//     {
//       id: "el-6",
//       title: "Wireless Earbuds Pro",
//       desc: "Crystal clear sound with noise cancellation",
//       image:
//         "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg",
//       price: "₹12999",
//       originalPrice: "₹16999",
//       rating: 4.4,
//       reviews: 567,
//       category: "Electronics",
//     },
//   ],
//   Fashion: [
//     {
//       id: "fa-1",
//       title: "Premium Cotton T-Shirt",
//       desc: "Comfortable everyday wear",
//       image:
//         "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg",
//       price: "₹799",
//       originalPrice: "₹1299",
//       rating: 4.3,
//       reviews: 567,
//       category: "Fashion",
//     },
//     {
//       id: "fa-2",
//       title: "Designer Evening Dress",
//       desc: "Elegant party wear collection",
//       image:
//         "https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg",
//       price: "₹4999",
//       originalPrice: "��7999",
//       rating: 4.6,
//       reviews: 234,
//       category: "Fashion",
//     },
//     {
//       id: "fa-3",
//       title: "Nike Air Max Sneakers",
//       desc: "Premium athletic footwear",
//       image:
//         "https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg",
//       price: "₹8999",
//       originalPrice: "₹12999",
//       rating: 4.7,
//       reviews: 1456,
//       category: "Fashion",
//     },
//     {
//       id: "fa-4",
//       title: "Denim Jacket Classic",
//       desc: "Classic denim for all seasons",
//       image:
//         "https://images.pexels.com/photos/1081685/pexels-photo-1081685.jpeg",
//       price: "₹3999",
//       originalPrice: "₹5999",
//       rating: 4.4,
//       reviews: 678,
//       category: "Fashion",
//     },
//     {
//       id: "fa-5",
//       title: "Winter Puffer Jacket",
//       desc: "Warm and stylish winter protection",
//       image: "https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg",
//       price: "₹6999",
//       originalPrice: "₹9999",
//       rating: 4.5,
//       reviews: 345,
//       category: "Fashion",
//     },
//     {
//       id: "fa-6",
//       title: "Business Formal Suit",
//       desc: "Professional attire for success",
//       image:
//         "https://images.pexels.com/photos/3251530/pexels-photo-3251530.jpeg",
//       price: "₹14999",
//       originalPrice: "₹19999",
//       rating: 4.8,
//       reviews: 123,
//       category: "Fashion",
//     },
//   ],
//   "Home & Kitchen": [
//     {
//       id: "hk-1",
//       title: "Vitamix Professional Blender",
//       desc: "High-performance kitchen blender",
//       image:
//         "https://images.pexels.com/photos/3768169/pexels-photo-3768169.jpeg",
//       price: "₹24999",
//       originalPrice: "₹29999",
//       rating: 4.7,
//       reviews: 456,
//       category: "Home & Kitchen",
//     },
//     {
//       id: "hk-2",
//       title: "Nespresso Coffee Machine",
//       desc: "Premium coffee brewing system",
//       image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
//       price: "₹18999",
//       originalPrice: "₹22999",
//       rating: 4.6,
//       reviews: 789,
//       category: "Home & Kitchen",
//     },
//     {
//       id: "hk-3",
//       title: "Smart Air Fryer",
//       desc: "Healthy cooking with smart controls",
//       image:
//         "https://images.pexels.com/photos/4109489/pexels-photo-4109489.jpeg",
//       price: "₹8999",
//       originalPrice: "₹12999",
//       rating: 4.5,
//       reviews: 234,
//       category: "Home & Kitchen",
//     },
//     {
//       id: "hk-4",
//       title: "Robot Vacuum Cleaner",
//       desc: "Smart cleaning for modern homes",
//       image:
//         "https://images.pexels.com/photos/3251531/pexels-photo-3251531.jpeg",
//       price: "₹25999",
//       originalPrice: "₹32999",
//       rating: 4.4,
//       reviews: 167,
//       category: "Home & Kitchen",
//     },
//   ],
// };

export default function ProductDetail() {
  // const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useCart();
  // const item = location.state?.item;
  // const [itemData, setItemData] = useState(item);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(!item);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({});
  const [selectedImage, setSelectedImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [technicalDetails, setTechnicalDetails] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedVariant, setSelectedVariant] = useState(null);
  // const [showZoom, setShowZoom] = useState(false);

  // Mock additional images for gallery
  // const productImages = item?.image
  //   ? [
  //       item.image,
  //       item.image, // Repeat for demo - in real app would have multiple angles
  //       item.image,
  //       item.image,
  //     ]
  //   : [];

  // // Mock product variants
  // const productVariants = [
  //   {
  //     id: 1,
  //     name: "Default",
  //     price: item?.price,
  //     inStock: true,
  //   },
  //   {
  //     id: 2,
  //     name: "Premium",
  //     price: item?.price ? `₹${parseInt(item.price) + 500}` : "₹1500",
  //     inStock: true,
  //   },
  //   {
  //     id: 3,
  //     name: "Deluxe",
  //     price: item?.price ? `₹${parseInt(item.price) + 1000}` : "₹2000",
  //     inStock: false,
  //   },
  // ];

  // Mock reviews data
  // const reviews = [
  //   {
  //     id: 1,
  //     name: "Rajesh Kumar",
  //     rating: 5,
  //     date: "12 Dec 2024",
  //     title: "Excellent quality!",
  //     review:
  //       "Amazing product with great quality. Delivery was fast and packaging was perfect. Highly recommended!",
  //     helpful: 15,
  //     verified: true,
  //   },
  //   {
  //     id: 2,
  //     name: "Priya Sharma",
  //     rating: 4,
  //     date: "8 Dec 2024",
  //     title: "Good value for money",
  //     review:
  //       "Good product overall. Some minor issues but customer service was very helpful.",
  //     helpful: 8,
  //     verified: true,
  //   },
  //   {
  //     id: 3,
  //     name: "Amit Singh",
  //     rating: 5,
  //     date: "5 Dec 2024",
  //     title: "Perfect!",
  //     review:
  //       "Exactly what I was looking for. Great build quality and works as described.",
  //     helpful: 12,
  //     verified: true,
  //   },
  // ];

  // Get related products from the same category
  // const getRelatedProducts = () => {
  //   // Determine the category of current item (default to Electronics if not specified)
  //   const currentCategory = item?.category.name || "Food";
  //   console.log("Categories related ", currentCategory);

  //   // Get products from the same category
  //   const categoryProducts =
  //     mallItemsByCategory[currentCategory] ||
  //     mallItemsByCategory["Electronics"];

  //   // Filter out the current product and return up to 6 related products
  //   return categoryProducts
  //     .filter((product) => product.id !== item?.id)
  //     .slice(0, 6);
  // };

  // const relatedProducts = getRelatedProducts();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setItem(response.data.product);

        const user = JSON.parse(localStorage.getItem("user"));

        trackEvent("product_detail_view", {
          user_id: user?._id,
          product_id: response.data.product._id,
          name: response.data.product.name,
          category: response.data.product.category?.name,
          location: window.location.pathname,
        });
        console.log("Product details", response.data.product);
        if (response.data.product.technicalDetails) {
          const techDetails = await getTechnicalDetailsById(
            response.data.product.technicalDetails
          );
          setTechnicalDetails(techDetails);
          console.log("technicalDetails", techDetails);
        } else {
          setTechnicalDetails(null);
        }
      } catch (err) {
        console.error("Product not found", err);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct(); // Always fetch from server
  }, [id]);
  // console.log("Data of details product", itemData);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getProductReviews(id); // calling your function
        setProductReviews(data.reviews); // make sure your API returns reviews key
        // console.log("Fetched reviews:", data.reviews);
      } catch (error) {
        console.error("Error fetching reviews:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getReviewSummary(id);
        setReviewSummary(data.ratings || {});
      } catch (error) {
        console.error("Error fetching summary:", error.message);
      }
    };

    fetchSummary();
  }, [id]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const res = await axios.get(`/api/products/related/${id}?limit=10`);
        setRelatedProducts(res.data.products);
        console.log("Realted product", res.data.products);
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    };

    fetchRelatedProducts();
  }, [id]);

  const currentUserId = JSON.parse(localStorage.getItem("user"))?._id;
  const handleHelpfulClick = async (reviewId) => {
    try {
      const res = await toggleHelpful(reviewId); // API response

      const updatedReviews = productReviews.map((review) => {
        if (review._id === reviewId) {
          let updatedHelpfulBy = [...(review.helpfulBy || [])];

          if (res.isHelpful) {
            // User added helpful
            if (!updatedHelpfulBy.includes(currentUserId)) {
              updatedHelpfulBy.push(currentUserId);
            }
          } else {
            // User removed helpful
            updatedHelpfulBy = updatedHelpfulBy.filter(
              (userId) => userId !== currentUserId
            );
          }

          return {
            ...review,
            helpfulBy: updatedHelpfulBy, // live update helpfulBy array
          };
        }
        return review;
      });

      setProductReviews(updatedReviews);
      toast.success(res.message);
    } catch (error) {
      toast.error(error.message || "Could not update helpful status");
    }
  };

  if (!item) {
    return (
      <div className="product-not-found">
        <div className="not-found-content">
          <h2>Product Not Found</h2>
          <p>Sorry, we couldn't find the product you're looking for.</p>
          <button onClick={() => navigate(-1)} className="back-button">
            <ChevronLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // const handleAddToCart = () => {
  //   const productToAdd = {
  //     ...item,
  //     quantity: quantity,
  //     variant: selectedVariant,
  //     addedAt: new Date().toISOString(),
  //   };
  //   addToCart(productToAdd);
  //   toast.success(`${item.title} added to cart! 🛒`);
  // };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
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

  // const calculateDiscountedPrice = () => {
  //   if (!item.originalPrice) return item.price;
  //   return item.price;
  // };

  // const calculateSavings = () => {
  //   if (!item.originalPrice) return null;
  //   const original = parseInt(item.originalPrice);
  //   const current = parseInt(item.price);
  //   return original - current;
  // };
  // const processImageUrl = (image) => {
  //   if (image && image.startsWith("/uploads")) {
  //     return `http://localhost:8080${image}`;
  //   }
  //   return image || "/images/offer1.png";
  // };

  // processImageUrl is now imported from utils

  const calculateDiscountedPriceFinal = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return price - (price * discount) / 100;
  };

  const calculateSavingsFinal = (price, discount) => {
    if (!price || !discount || discount <= 0) return 0;
    return Math.round((price * discount) / 100);
  };
  // const token = JSON.parse(localStorage.getItem("token"));
  // console.log(token);

  const handleAddToCart = async (e, sourcePage = "ProductDetailsPage") => {
    e.stopPropagation();
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?._id;

      if (!userId) {
        toast.error("User not logged in");
        return;
      }

      const cartData = {
        productId: id, // Or selectedVariant._id if using variants
        quantity: quantity,
        // productId: deal.product._id,
        // quantity: 1,
        price: selectedVariant?.price || item.finalPrice,
        title: item.name,
        discount: item.discount,
        // selectedVariantId: selectedVariant?._id, // Optional if variants used
      };

      // const response = await axios.post("/api/cart/add", {
      //   userId,
      //   product: cartData,
      // });

      const response = await addToCartAPI(userId, cartData, null);

      await trackEvent("add_to_cart", {
        user_id: userId,
        product_id: id,
        name: item.name,
        category: item.category?.name,
        quantity: quantity,
        price: item.activeDeal?.dealPrice ?? item.finalPrice ?? item.price,
        discount: item.discount,
        source_page: sourcePage,
        location: window.location.pathname,
      });

      toast.success("Added to cart!");

      // if (response.data.success) {
      //   toast.success("Item added to cart");
      // } else {
      //   toast.error("Failed to add to cart");
      // }
    } catch (err) {
      console.error("Error adding to cart:", JSON.stringify(err));
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="amazon-product-detail">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span onClick={() => navigate("/")} className="breadcrumb-link">
          Home
        </span>
        <ChevronRight size={14} />
        <span onClick={() => navigate("/menu")} className="breadcrumb-link">
          Products
        </span>
        <ChevronRight size={14} />
        <span className="breadcrumb-current">{item.name}</span>
      </div>

      <div className="product-main-container">
        {/* Image Gallery Section */}
        <div className="image-gallery-section">
          <div className="thumbnail-column">
            {item.image.map((img, index) => (
              <div
                key={index}
                className={`thumbnail ${
                  selectedImage === index ? "active" : ""
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={processImageUrl(img)}
                  alt={`Product view ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="main-image-container">
            <img
              // src={productImages[selectedImage] || processImageUrl(item.image)}
              src={processImageUrl(item.image[selectedImage])}
              alt={item.name}
              className="main-product-image"
              onClick={() => setShowZoom(true)}
            />
            <button className="zoom-button" onClick={() => setShowZoom(true)}>
              <Eye size={20} />
              Zoom
            </button>
            {item.discount && (
              <div className="discount-badge">-{item.discount}% OFF</div>
            )}

            {showZoom && (
              <div className="zoom-modal" onClick={() => setShowZoom(false)}>
                <div
                  className="zoom-content"
                  onClick={(e) => e.stopPropagation()} // prevent close when clicking on image
                >
                  <img
                    src={processImageUrl(item.image[selectedImage])}
                    alt="Zoomed view"
                    className="zoomed-image"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Standalone Pricing Section for Mobile Reordering */}
        <div className="standalone-pricing-section">
          <div className="pricing-section">
            <div className="price-row">
              <span className="current-price">
                {/* ₹{calculateDiscountedPriceFinal(item.price, item.discount)} */}
                ₹{item.finalPrice}
              </span>
              {/* {item.originalPrice && (
                <span className="original-price">
                  M.R.P: <span className="strike">{item.originalPrice}</span>
                </span>
              )} */}

              {item.price && (
                <span className="original-price">
                  M.R.P: <span className="strike">₹{item.price}</span>
                </span>
              )}
            </div>
            {/* {calculateSavings() && (
              <div className="savings-info">
                You save: ₹{calculateSavings().toLocaleString()} (
                {item.discount}%)
              </div>
            )} */}
            <div className="savings-info">
              You save: ₹{calculateSavingsFinal(item.price, item.discount)} (
              {item.discount}%)
            </div>

            <div className="price-details">
              <span className="inclusive-text">Inclusive of all taxes</span>
              <span className="emi-text">
                EMI starts at ₹{Math.floor(parseInt(item.price) / 12)}
                /month
              </span>
            </div>
          </div>
        </div>

        {/* Product Info Section */}
        <div className="product-info-section">
          <div className="product-title-area">
            <h1 className="product-title">{item.name}</h1>
            <div className="product-actions">
              <button className="share-button">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <div className="rating-section">
            <div className="stars-container">
              {renderStars(item.averageRating ?? 4.5)}
            </div>
            {/* <span className="rating-value">{item.averageRating || 4.5}</span> */}
            <span className="rating-value">{item.averageRating ?? 4.5}</span>
            <span className="review-count">
              ({item.totalReviews ?? 100} reviews)
            </span>
            <span className="answered-questions">| 89 answered questions</span>
          </div>

          {/* Desktop Pricing - Hidden on Mobile */}
          <div className="desktop-pricing-section">
            <div className="pricing-section">
              <div className="price-row">
                <span className="current-price">
                  {/* ₹{calculateDiscountedPriceFinal(item.price, item.discount)} */}
                  ₹{item.finalPrice}
                </span>
                {/* {item.originalPrice && (
                  <span className="original-price">
                    M.R.P: <span className="strike">{item.originalPrice}</span>
                  </span>
                )} */}

                {item.price && (
                  <span className="original-price">
                    M.R.P: <span className="strike">₹{item.price}</span>
                  </span>
                )}
              </div>
              {/* {calculateSavings() && (
                <div className="savings-info">
                  You save: ₹{calculateSavings().toLocaleString()} (
                  {item.discount}%)
                </div>
              )} */}

              <div className="savings-info">
                You save: ₹{calculateSavingsFinal(item.price, item.discount)} (
                {item.discount}%)
              </div>
              <div className="price-details">
                <span className="inclusive-text">Inclusive of all taxes</span>
                <span className="emi-text">
                  EMI starts at ₹{Math.floor(parseInt(item.price) / 12)}
                  /month
                </span>
              </div>
            </div>
          </div>

          {/* Variants Selection */}
          {item.variants && (
            <div className="variants-section">
              <h4>Choose a variant:</h4>
              <div className="variants-grid">
                {item.variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`variant-option ${
                      selectedVariant?.id === variant.id ? "selected" : ""
                    } ${!variant.inStock ? "out-of-stock" : ""}`}
                    onClick={() =>
                      variant.inStock && setSelectedVariant(variant)
                    }
                    disabled={!variant.inStock}
                  >
                    <span className="variant-name">{variant.name}</span>
                    <span className="variant-price">{variant.price}</span>
                    {!variant.inStock && (
                      <span className="out-of-stock-text">Out of Stock</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Key Features */}
          <div className="features-section">
            <h4>Key Features:</h4>
            <ul className="features-list">
              <li>
                <Shield size={16} /> Premium Quality Guaranteed
              </li>
              <li>
                <Award size={16} /> Brand Warranty Included
              </li>
              <li>
                <Truck size={16} /> Fast & Free Delivery
              </li>
              <li>
                <RotateCcw size={16} /> 30-Day Return Policy
              </li>
            </ul>
          </div>

          {/* Delivery Info */}
          <div className="delivery-section">
            <h4>
              <MapPin size={18} /> Delivery Information
            </h4>
            <div className="delivery-options">
              <div className="delivery-option">
                <Truck size={16} />
                <div>
                  <span className="delivery-type">FREE Delivery</span>
                  <span className="delivery-date">Tomorrow, 25 December</span>
                </div>
              </div>
              <div className="delivery-option">
                <Clock size={16} />
                <div>
                  <span className="delivery-type">Same Day Delivery</span>
                  <span className="delivery-date">
                    ₹99 - Order within 2 hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="description-preview">
            <h4>About this item</h4>
            <p className="description-text">
              {showFullDescription
                ? item.description
                : `${item.description?.substring(0, 150)}...`}
              <button
                className="read-more-btn"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? "Read less" : "Read more"}
              </button>
            </p>
          </div>

          {/* Mobile Purchase Integration */}
          <div className="mobile-purchase-integration">
            <div className="mobile-price-summary">
              <span className="card-price">
                ₹{selectedVariant?.price || item.finalPrice}
              </span>
              {item.originalPrice && (
                <span className="card-original-price">
                  M.R.P: <span className="strike">₹{item.price}</span>
                </span>
              )}
            </div>

            <div className="mobile-stock-quantity">
              <span className="in-stock">✓ In Stock</span>
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="quantity-btn"
                >
                  <Minus size={14} />
                </button>
                <span className="quantity-display">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="quantity-btn"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                <ShoppingCart size={18} />
                Add to Cart
              </button>
              <button className="buy-now-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="purchase-section">
          <div className="purchase-card">
            <div className="price-summary">
              <span className="card-price">
                ₹{selectedVariant?.price || item.finalPrice}
              </span>
              {item.price && (
                <span className="card-original-price">
                  M.R.P: <span className="strike">₹{item.price}</span>
                </span>
              )}
            </div>
            <div className="delivery-info-card">
              <div className="delivery-row">
                <Truck size={16} />
                <span>
                  FREE delivery <strong>{"Tomorrow"}</strong>
                </span>
              </div>
              <div className="delivery-row">
                <MapPin size={16} />
                <span>Deliver to Mumbai 400001</span>
              </div>
            </div>

            <div className="stock-info">
              {/* <span className="in-stock">✓ In Stock</span> */}
              <span className="in-stock">{item.status}</span>
            </div>

            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="quantity-btn"
                >
                  <Minus size={14} />
                </button>
                <span className="quantity-display">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="quantity-btn"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                <ShoppingCart size={18} />
                Add to Cart
              </button>
              <button className="buy-now-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>

            <div className="security-info">
              <div className="security-item">
                <Shield size={16} />
                <span>Secure transaction</span>
              </div>
              <div className="security-item">
                <Award size={16} />
                <span>Ships from Amazon</span>
              </div>
              <div className="security-item">
                <RotateCcw size={16} />
                <span>Return policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="product-details-tabs">
        <div className="tab-navigation">
          <button
            className={`tab-button ${
              activeTab === "description" ? "active" : ""
            }`}
            onClick={() => setActiveTab("description")}
          >
            Product Details
          </button>
          <button
            className={`tab-button ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews ({item.totalReviews})
          </button>
          <button
            className={`tab-button ${activeTab === "qa" ? "active" : ""}`}
            onClick={() => setActiveTab("qa")}
          >
            Q&A (89)
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "description" && (
            <div className="description-tab">
              <h3>Product Description</h3>
              <p>{item.description}</p>

              <h4>Technical Details</h4>
              <table className="product-specs">
                <tbody>
                  <tr>
                    <td>Brand</td>
                    <td>{technicalDetails?.brand || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Category</td>
                    <td>{item?.category?.name || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Weight</td>
                    <td>{technicalDetails?.weight || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Dimensions</td>
                    <td>{technicalDetails?.dimensions || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Warranty</td>
                    <td>
                      {technicalDetails?.warranty
                        ? `${technicalDetails.warranty} Manufacturer Warranty`
                        : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="reviews-tab">
              <div className="reviews-summary">
                <h3>Customer Reviews</h3>
                <div className="review-stats">
                  <div className="overall-rating">
                    <span className="rating-number">
                      {item.averageRating ?? 4.5}
                    </span>
                    <div className="stars-large">
                      {renderStars(item.averageRating ?? 4.5)}
                    </div>
                    <span className="total-reviews">
                      {item.totalReviews ?? 1234} global ratings
                    </span>
                  </div>
                  <div className="rating-breakdown">
                    <div>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewSummary[star] || 0;
                        const percentage =
                          item.totalReviews === 0
                            ? 0
                            : Math.round((count / item.totalReviews) * 100);

                        return (
                          <div key={star} className="rating-bar-row">
                            <span>{star} star</span>
                            <div className="rating-bar">
                              <div
                                className="rating-fill"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span>{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="reviews-list">
                {productReviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <span className="reviewer-name">
                          {review.user.name}
                        </span>
                        {review.verified && (
                          <span className="verified-badge">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="review-date">{review.createdAt}</span>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                      <span className="review-title">{review.title}</span>
                    </div>
                    <p className="review-text">{review.comment}</p>
                    <div className="review-actions">
                      <button
                        className="helpful-btn"
                        onClick={() => handleHelpfulClick(review._id)}
                      >
                        <ThumbsUp size={14} />
                        Helpful ({review.helpfulBy?.length || 0})
                      </button>
                      <button className="report-btn">
                        <Info size={14} />
                        Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "qa" && (
            <div className="qa-tab">
              <h3>Questions & Answers</h3>
              <div className="qa-item">
                <div className="question">
                  <MessageSquare size={16} />
                  <span>
                    Q: Is this product compatible with Android devices?
                  </span>
                </div>
                <div className="answer">
                  <span>
                    A: Yes, this product is fully compatible with Android
                    devices running Android 8.0 and above.
                  </span>
                  <span className="answer-date">Answered on Dec 15, 2024</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div className="related-products-section">
        <h3>Customers who viewed this item also viewed</h3>
        <div className="related-products-grid">
          {relatedProducts.map((product) => (
            <div
              key={product._id}
              className="related-product-card"
              onClick={() => navigate(`/product/${product._id}`)}
            >
              <img src={processImageUrl(product.image)} alt={product.name} />
              <h4>{product.name}</h4>
              <div className="related-rating">
                {renderStars(product.averageRating)}
                <span>({product.averageRating})</span>
              </div>
              <div className="related-price">
                <span className="current">
                  ₹
                  {calculateDiscountedPriceFinal(
                    product.price,
                    product.discount
                  )}
                </span>
                {product.price && (
                  <span className="original">₹{product.price}</span>
                )}
              </div>
              <button
                className="related-add-to-cart"
                onClick={async (e) => {
                  e.stopPropagation();
                  // addToCart({
                  //   ...product,
                  //   quantity: 1,
                  //   addedAt: new Date().toISOString(),
                  // });
                  const response = await addToCartAPI(
                    currentUserId,
                    {
                      productId: product._id, // Or selectedVariant._id if using variants
                      quantity: 1,
                      // productId: deal.product._id,
                      // quantity: 1,
                      price: product.finalPrice,
                      title: product.name,
                      discount: product.discount,
                    },
                    null
                  );
                  toast.success(`${product.name} added to cart! 🛒`);
                }}
              >
                <ShoppingCart size={14} />
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Modal */}
      {showZoom && (
        <div className="zoom-modal" onClick={() => setShowZoom(false)}>
          <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-zoom" onClick={() => setShowZoom(false)}>
              ×
            </button>
            {/* <img
              src={productImages[selectedImage] || item.image}
              alt={item.title}
            /> */}
          </div>
        </div>
      )}
    </div>
  );
}
