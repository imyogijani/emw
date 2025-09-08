/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaStore,
  FaCog,
  FaSignOutAlt,
  FaSignInAlt,
  FaShoppingCart,
  FaUser,
} from "react-icons/fa";
import { showSuccessToast } from "../utils/muiAlertHandler.jsx";
import axios from "../utils/axios";
import "../Components/Navbar.css";
import UserProfile from "./UserProfile/UserProfile";
import MaleUser from "../images/MaleUser.png";
import mallimage from "../images/Mall1.png";
import { useCart } from "../context/CartContext";
import CartModal from "./Cart/CartModal";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Shop", path: "/products" },
  { name: "Today's Deals", path: "/Offer" },
  { name: "All Stores", path: "/shops" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  
  // Cart context
  const { getTotalItems, getTotalPrice } = useCart();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get("/api/auth/current-user");
          setUser(response.data.user);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Only show user menu/profile for client role
  const shouldShowUserMenu = user && user.role === "client";

  // Handle mobile menu and body scroll lock
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showMobileMenu]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileMenu && !event.target.closest(".mobile-menu")) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileMenu]);

  const handleLogout = async () => {
    const { showSuccessToast } = await import("../utils/muiAlertHandler.jsx");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    setShowMobileMenu(false);
    showSuccessToast("Logged out successfully", "Navbar - Logout");
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
    setShowUserMenu(false); // Close user menu when opening mobile menu
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const handleMobileNavClick = (path) => {
    setShowMobileMenu(false);
    navigate(path);
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  const isActiveLink = (path) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="custom-navbar">
        <div className="nav-container">
          <Link
            to="/"
            className="custom-logo"
            style={{ textDecoration: "none" }}
          >
            <img
              src={mallimage}
              alt="E-Mall World"
              style={{ height: "50px" }}
            />
            {/* <FaStore className="logo-icon" /> */}
            <span className="logo-main">E-Mall</span>
            <span className="logo-uk">World</span>
          </Link>

          <div className="nav-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-pill-link ${
                  isActiveLink(link.path) ? "active" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="nav-right">
            {/* Cart Button */}
            <button
              className="cart-button"
              onClick={() => setShowCartModal(true)}
              title="Shopping Cart"
            >
              <div className="cart-icon-container">
                <FaShoppingCart className="cart-icon" />
                {getTotalItems() > 0 && (
                  <span className="cart-badge">{getTotalItems()}</span>
                )}
              </div>
              {getTotalItems() > 0 && (
                <span className="cart-total">₹{getTotalPrice().toFixed(2)}</span>
              )}
            </button>

            {/* User Icon with Conditional Menu */}
            <div className="user-menu-container">
              <button
                className="user-icon-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={user ? "User menu" : "Sign in"}
              >
                <FaUser className="user-icon" />
                {user && <span className="user-indicator"></span>}
              </button>
              
              {showUserMenu && (
                <div className="user-menu animate-dropdown">
                  {user ? (
                    <>
                      {/* Logged in user menu */}
                      <div className="user-info">
                        <img
                          src={
                            avatarError ? MaleUser : user?.avatar || MaleUser
                          }
                          alt={user?.name || "User avatar"}
                          className="menu-avatar"
                          onError={handleAvatarError}
                        />
                        <div className="user-details">
                          <p className="user-name">
                            {user?.names || user?.shopownerName || "User"}
                          </p>
                          <p className="user-email">
                            {user?.email || "No email"}
                          </p>
                        </div>
                      </div>
                      <div className="menu-divider"></div>
                      <button
                        className="btn btn-small btn-secondary menu-item dashboard-dropdown"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowProfile(true);
                        }}
                      >
                        <span className="sparkle">
                          <FaCog />
                        </span>
                        <span className="text">My Profile</span>
                      </button>
                      <button
                        className="btn btn-small btn-secondary menu-item dashboard-dropdown"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/profile-edit");
                        }}
                      >
                        <span className="sparkle">
                          <FaCog />
                        </span>
                        <span className="text">Edit Profile</span>
                      </button>
                      <button
                        className="btn btn-small btn-danger menu-item dashboard-dropdown logout"
                        onClick={handleLogout}
                      >
                        <span className="sparkle">
                          <FaSignOutAlt />
                        </span>
                        <span className="text">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Not logged in menu */}
                      {/* <div className="login-prompt">
                        <div className="login-icon">
                          <FaSignInAlt />
                        </div>
                        <div className="login-content">
                          <h4>Welcome!</h4>
                          <p>Sign in to access your account</p>
                        </div>
                      </div> */}
                      <div className="menu-divider"></div>
                      <Link
                        to="/login"
                        className="menu-item login-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="sparkle">
                          <FaSignInAlt />
                        </span>
                        <span className="text">Sign In</span>
                      </Link>
                      <Link
                        to="/register"
                        className="menu-item register-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="sparkle">
                          <FaUser />
                        </span>
                        <span className="text">Create Account</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              className="btn btn-small btn-secondary mobile-menu-toggle"
              onClick={toggleMobileMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${showMobileMenu ? "active" : ""}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${showMobileMenu ? "active" : ""}`}>
        <div className="mobile-menu-header">
          <Link
            to="/"
            className="custom-logo"
            style={{ textDecoration: "none" }}
            onClick={closeMobileMenu}
          >
            <FaStore className="logo-icon" />
            <span className="logo-main">E-Mall</span>
            <span className="logo-uk">World</span>
          </Link>
          <button
            className="btn btn-small btn-secondary mobile-menu-close"
            onClick={closeMobileMenu}
          >
            <span className="text">×</span>
          </button>
        </div>

        <div className="mobile-nav-links">
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`btn btn-medium btn-secondary nav-pill-link ${
                isActiveLink(link.path) ? "active" : ""
              }`}
              onClick={() => handleMobileNavClick(link.path)}
            >
              <span className="text">{link.name}</span>
            </button>
          ))}
        </div>

        <div className="mobile-nav-actions">
          {/* Mobile Cart Button */}
          <button
            className="btn btn-medium btn-secondary nav-pill-link"
            onClick={() => {
              closeMobileMenu();
              setShowCartModal(true);
            }}
          >
            <span className="sparkle">
              <FaShoppingCart />
            </span>
            <span className="text">
              Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
            </span>
            {getTotalItems() > 0 && (
              <span className="cart-total-mobile">₹{getTotalPrice().toFixed(2)}</span>
            )}
          </button>

          {localStorage.getItem("token") && shouldShowUserMenu ? (
            <>
              <button
                className="btn btn-medium btn-secondary nav-pill-link"
                onClick={() => {
                  closeMobileMenu();
                  setShowProfile(true);
                }}
              >
                <span className="sparkle">
                  <FaCog />
                </span>
                <span className="text">Profile Settings</span>
              </button>
              <button
                className="btn btn-medium btn-danger nav-pill-link logout"
                onClick={handleLogout}
              >
                <span className="sparkle">
                  <FaSignOutAlt />
                </span>
                <span className="text">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn btn-medium btn-primary login-button"
              onClick={closeMobileMenu}
            >
              <span className="sparkle">
                <FaSignInAlt />
              </span>
              <span className="text">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      
      {/* Cart Modal */}
      <CartModal 
        isOpen={showCartModal} 
        onClose={() => setShowCartModal(false)} 
      />
    </>
  );
};

export default Navbar;
