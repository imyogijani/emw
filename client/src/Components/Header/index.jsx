import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Heart, Menu, X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import "./Header.css";

import AdminHeader from "./AdminHeader";
import SellerHeader from "./SellerHeader";

export { AdminHeader, SellerHeader };

export default function Header() {
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const cartItemsCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * (item.quantity || 0)), 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navigationItems = [
    { name: "Shop", href: "/shops", hasDropdown: true },
    { name: "Men", href: "/category/men" },
    { name: "Women", href: "/category/women" },
    { name: "Kids", href: "/category/kids" },
    { name: "Sale", href: "/sale" },
    { name: "Contact", href: "/contact" }
  ];

  return (
    <header className="modern-header">
      {/* Top Bar */}
      <div className="header-top">
        <div className="container">
          <div className="top-content">
            <div className="top-left">
              <span>Free shipping over $99</span>
            </div>
            <div className="top-right">
              <Link to="/track-order">Track Order</Link>
              <Link to="/help">Help</Link>
              <select className="language-selector">
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="fr">FR</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="header-main">
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <Link to="/" className="logo">
              <span className="logo-text">Modaz.</span>
            </Link>

            {/* Navigation */}
            <nav className={`main-nav ${isMenuOpen ? 'nav-open' : ''}`}>
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Header Actions */}
            <div className="header-actions">
              {/* Search */}
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">
                  <Search size={20} />
                </button>
              </form>

              {/* User Account */}
              <Link to={user ? "/account" : "/login"} className="header-icon">
                <User size={20} />
              </Link>

              {/* Wishlist */}
              <Link to="/wishlist" className="header-icon">
                <Heart size={20} />
              </Link>

              {/* Cart */}
              <Link to="/cart" className="header-icon cart-icon">
                <div className="cart-content">
                  <ShoppingCart size={20} />
                  <div className="cart-info">
                    {cartItemsCount > 0 && (
                      <>
                        <span className="cart-count">{cartItemsCount}</span>
                        <span className="cart-total">₹{cartTotal.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>

              {/* Mobile Menu Toggle */}
              <button 
                className="mobile-menu-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="mobile-nav" onClick={(e) => e.stopPropagation()}>
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile Cart Link */}
            <Link
              to="/cart"
              className="mobile-nav-link cart-mobile-link"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="mobile-cart-content">
                <ShoppingCart size={18} />
                <span>Cart</span>
                {cartItemsCount > 0 && (
                  <span className="mobile-cart-badge">{cartItemsCount}</span>
                )}
              </div>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
