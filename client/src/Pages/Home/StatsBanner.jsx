import React from "react";
import "./StatsBanner.css";
import {
  Users,
  Store,
  ShoppingBag,
  Award,
  TrendingUp,
  Heart,
  Zap,
  Globe,
} from "lucide-react";

const StatsBanner = () => {
  const stats = [
    {
      icon: <Users size={32} />,
      value: "50M+",
      label: "Happy Customers",
      color: "#4f46e5",
    },
    {
      icon: <Store size={32} />,
      value: "100K+",
      label: "Partner Stores",
      color: "#059669",
    },
    {
      icon: <ShoppingBag size={32} />,
      value: "10M+",
      label: "Products",
      color: "#dc2626",
    },
    {
      icon: <Award size={32} />,
      value: "4.8★",
      label: "Average Rating",
      color: "#f59e0b",
    },
    {
      icon: <TrendingUp size={32} />,
      value: "98%",
      label: "Customer Satisfaction",
      color: "#8b5cf6",
    },
    {
      icon: <Globe size={32} />,
      value: "200+",
      label: "Cities Served",
      color: "#06b6d4",
    },
  ];

  const features = [
    {
      icon: <Zap size={24} />,
      title: "Lightning Fast Delivery",
      description: "Same-day delivery in major cities",
    },
    {
      icon: <Heart size={24} />,
      title: "Loved by Millions",
      description: "Trusted by customers worldwide",
    },
    {
      icon: <Award size={24} />,
      title: "Quality Guaranteed",
      description: "100% authentic products only",
    },
  ];

  return (
    <div className="modern-stats-banner">
      {/* Main Stats Section */}
      <div className="stats-container">
        <div className="stats-header">
          <h2>Why Choose E-Mall World?</h2>
          <p>Leading the future of online shopping with innovation and trust</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="stat-card"
              style={{ "--accent-color": stat.color }}
            >
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="features-container">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="trust-indicators">
        <div className="trust-item">
          <span className="trust-badge">🔒</span>
          <span>Secure Payment</span>
        </div>
        <div className="trust-item">
          <span className="trust-badge">📦</span>
          <span>Free Returns</span>
        </div>
        <div className="trust-item">
          <span className="trust-badge">⚡</span>
          <span>Fast Shipping</span>
        </div>
        <div className="trust-item">
          <span className="trust-badge">🏆</span>
          <span>Best Quality</span>
        </div>
      </div>
    </div>
  );
};

export default StatsBanner;
