/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaShoppingCart,
  FaHeart,
  FaEye,
} from "react-icons/fa";
import {
  fetchCategories,
  fetchProducts,
} from "../../api/api";

import "./Home.css";

// Mock Data for sections not yet connected to the backend
const mockData = {
  hero: {
    title: "Sale Up to 50% Off Mobile Devices",
    subtitle:
      "Discover the latest in mobile technology. Unbeatable prices, unmatched quality.",
    cta: "Shop Now",
    image: "https://picsum.photos/seed/hero/1200/400",
  },
  promoBanners: [
    {
      title: "Xbox Series S",
      subtitle: "Next-gen performance in the smallest Xbox ever.",
      cta: "Learn More",
      image: "https://picsum.photos/seed/xbox/600/300",
    },
    {
      title: "Metaverse Ready",
      subtitle: "Explore virtual worlds with our latest VR gear.",
      cta: "Discover",
      image: "https://picsum.photos/seed/vr/600/300",
    },
  ],
  news: [
    {
      title: "The Future of VR Gaming",
      excerpt: "Exploring the next wave of immersive virtual reality experiences.",
      image: "https://picsum.photos/seed/news1/400/250",
    },
    {
      title: "Sustainable Tech Innovations",
      excerpt: "How the tech industry is moving towards a greener future.",
      image: "https://picsum.photos/seed/news2/400/250",
    },
    {
      title: "AI in Everyday Life",
      excerpt: "A look at how artificial intelligence is shaping our daily routines.",
      image: "https://picsum.photos/seed/news3/400/250",
    },
  ],
};

const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++)
    stars.push(<FaStar key={`full-${i}`} />);
  if (halfStar) stars.push(<FaStarHalfAlt key="half" />);
  for (let i = 0; i < emptyStars; i++)
    stars.push(<FaRegStar key={`empty-${i}`} />);

  return <div className="star-rating">{stars}</div>;
};

const HeroSection = ({ data }) => (
  <section className="hero-section">
    <div className="hero-content">
      <h1>{data.title}</h1>
      <p>{data.subtitle}</p>
      <button className="hero-cta">{data.cta}</button>
    </div>
    <div className="hero-image-container">
      <img src={data.image} alt="Hero Banner" className="hero-image" />
    </div>
  </section>
);

const FeaturedCategories = ({ categories }) => (
  <section className="section-container">
    <div className="section-header">
      <h4>Featured Categories</h4>
      <p>Explore our wide range of product categories.</p>
    </div>
    <div className="featured-categories-grid">
      {categories.map((category, index) => (
        <div key={index} className="category-card">
          <div className="category-icon">
            <i className={`fa ${category.icon}`}></i>
          </div>
          <h3>{category.name}</h3>
        </div>
      ))}
    </div>
  </section>
);

const ProductCard = ({ product }) => (
  <div className="product-card">
    <div className="product-image-container">
      <img
        src={product.image}
        alt={product.name}
        className="product-image"
      />
    </div>
    <div className="product-content">
      <h3 className="product-title">{product.name}</h3>
      <div className="product-rating">
        <StarRating rating={product.rating} />
        <span>({product.reviewCount} reviews)</span>
      </div>
      <div className="product-price">
        ${product.price}
        {product.originalPrice && (
          <span className="original-price">${product.originalPrice}</span>
        )}
      </div>
      <button className="add-to-cart-btn">Add to Cart</button>
    </div>
  </div>
);

const ProductSection = ({ title, description, products }) => (
  <section className="section-container">
    <div className="section-header">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);

const PromotionalBanners = ({ banners }) => (
  <section className="section-container">
    <div className="promo-banners">
      {banners.map((banner, index) => (
        <div key={index} className="promo-banner">
          <img src={banner.image} alt={banner.title} />
          <div className="promo-content">
            <h3>{banner.title}</h3>
            <p>{banner.subtitle}</p>
            <a href="#" className="promo-cta">
              {banner.cta}
            </a>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const NewsAndEvents = ({ news }) => (
  <section className="section-container">
    <div className="section-header">
      <h2>Latest News & Events</h2>
      <p>Stay updated with the latest trends and announcements.</p>
    </div>
    <div className="news-grid">
      {news.map((item, index) => (
        <div key={index} className="news-card">
          <img src={item.image} alt={item.title} className="news-image" />
          <div className="news-content">
            <h3 className="news-title">{item.title}</h3>
            <p className="news-excerpt">{item.excerpt}</p>
            <a href="#" className="read-more-link">
              Read More
            </a>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const SubscriptionSection = () => (
  <section className="section-container subscription-section">
    <div className="section-header">
      <h2>Subscribe & Get 10% Discount</h2>
      <p>Join our newsletter to receive updates on new products and offers.</p>
    </div>
    <form className="subscription-form">
      <input
        type="email"
        placeholder="Enter your email"
        className="subscription-input"
      />
      <button type="submit" className="subscription-button">
        Subscribe
      </button>
    </form>
  </section>
);

const Home = () => {
  const [pageData, setPageData] = useState({
    hero: mockData.hero,
    categories: [],
    products: [],
    promoBanners: mockData.promoBanners,
    news: mockData.news,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
        ]);
        setPageData((prevData) => ({
          ...prevData,
          categories: categoriesRes.data.categories,
          products: productsRes.data.products,
        }));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="home-page-container">
      <HeroSection data={pageData.hero} />
      <FeaturedCategories categories={pageData.categories} />
      <ProductSection
        title="Best Sellers"
        description="Check out our most popular products."
        products={pageData.products}
      />
      <PromotionalBanners banners={pageData.promoBanners} />
      <ProductSection
        title="Trending This Week"
        description="Discover what's hot right now."
        products={pageData.products.slice().reverse()} // Example variation
      />
      <NewsAndEvents news={pageData.news} />
      <SubscriptionSection />
    </div>
  );
};

export default Home;
