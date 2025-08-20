import React from 'react';
import './About.css';
import { Users, Target, Award, Heart, Globe, Truck, Shield, Clock } from 'lucide-react';

const About = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1>About E-Mall World</h1>
          <p className="hero-subtitle">
            Your trusted destination for quality products, exceptional service, and unbeatable value.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-content">
              <h2>Our Mission</h2>
              <p>
                At E-Mall World, we're committed to revolutionizing the online shopping experience 
                by connecting customers with quality products from trusted sellers worldwide. We believe 
                in making shopping convenient, secure, and enjoyable for everyone.
              </p>
            </div>
            <div className="mission-stats">
              <div className="stat-item">
                <Users size={40} />
                <h3>10M+</h3>
                <p>Happy Customers</p>
              </div>
              <div className="stat-item">
                <Globe size={40} />
                <h3>50K+</h3>
                <p>Products</p>
              </div>
              <div className="stat-item">
                <Award size={40} />
                <h3>5K+</h3>
                <p>Trusted Sellers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <Heart className="value-icon" />
              <h3>Customer First</h3>
              <p>Every decision we make is centered around providing the best experience for our customers.</p>
            </div>
            <div className="value-card">
              <Shield className="value-icon" />
              <h3>Trust & Security</h3>
              <p>We ensure secure transactions and protect your personal information with advanced security measures.</p>
            </div>
            <div className="value-card">
              <Target className="value-icon" />
              <h3>Quality Assurance</h3>
              <p>We work only with verified sellers who meet our strict quality and service standards.</p>
            </div>
            <div className="value-card">
              <Clock className="value-icon" />
              <h3>Fast Delivery</h3>
              <p>Quick and reliable delivery service to get your orders to you as fast as possible.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="container">
          <div className="story-content">
            <h2>Our Story</h2>
            <p>
              Founded in 2020, E-Mall World started with a simple vision: to create a marketplace 
              where quality meets convenience. What began as a small team's dream has grown into a 
              thriving platform that serves millions of customers worldwide.
            </p>
            <p>
              Today, we continue to innovate and expand our services, always keeping our customers' 
              needs at the heart of everything we do. From electronics to fashion, home goods to 
              specialty items, we're your one-stop destination for all your shopping needs.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Why Choose E-Mall World?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <Truck size={50} />
              <h3>Free Shipping</h3>
              <p>Free delivery on orders over $50</p>
            </div>
            <div className="feature-item">
              <Shield size={50} />
              <h3>Secure Payment</h3>
              <p>100% secure payment processing</p>
            </div>
            <div className="feature-item">
              <Clock size={50} />
              <h3>24/7 Support</h3>
              <p>Round-the-clock customer service</p>
            </div>
            <div className="feature-item">
              <Award size={50} />
              <h3>Quality Guarantee</h3>
              <p>30-day money-back guarantee</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;