import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaStore,
  FaCog,
  FaSignOutAlt,
  FaSignInAlt,
  FaShoppingCart,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "../utils/axios";
import "../Components/Navbar.css";
import UserProfile from "./UserProfile/UserProfile";
import MaleUser from "../images/MaleUser.png";
import mallimage from "../images/Mall1.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Browse Products", path: "/menu" },
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    setShowMobileMenu(false);
    toast.success("Logged out successfully");
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
            {localStorage.getItem("token") && shouldShowUserMenu ? (
              <>
                <div className="user-menu-container">
                  <button
                    className="profile-button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    title={user?.name || "User profile"}
                  >
                    <img
                      src={avatarError ? MaleUser : user?.avatar || MaleUser}
                      alt={user?.name || "User avatar"}
                      className="user-avatar"
                      onError={handleAvatarError}
                    />
                  </button>
                  {showUserMenu && (
                    <div className="user-menu animate-dropdown">
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
                        className="menu-item dashboard-dropdown"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowProfile(true);
                        }}
                      >
                        <FaCog /> My Profile
                      </button>
                      <button
                        className="menu-item dashboard-dropdown"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/profile-edit"); // Assuming a route for editing profile
                        }}
                      >
                        <FaCog /> Edit Profile
                      </button>
                      <button
                        className="menu-item dashboard-dropdown logout"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="login-button"
                style={{ textDecoration: "none", borderRadius: "20px" }}
              >
                <FaSignInAlt />
                <span>Sign In</span>
              </Link>
            )}

            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
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
          <button className="mobile-menu-close" onClick={closeMobileMenu}>
            ×
          </button>
        </div>

        <div className="mobile-nav-links">
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`nav-pill-link ${
                isActiveLink(link.path) ? "active" : ""
              }`}
              onClick={() => handleMobileNavClick(link.path)}
            >
              {link.name}
            </button>
          ))}
        </div>

        <div className="mobile-nav-actions">
          {localStorage.getItem("token") && shouldShowUserMenu ? (
            <>
              <button
                className="nav-pill-link"
                onClick={() => {
                  closeMobileMenu();
                  setShowProfile(true);
                }}
              >
                <FaCog /> Profile Settings
              </button>
              <button className="nav-pill-link logout" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="login-button"
              onClick={closeMobileMenu}
            >
              <FaSignInAlt />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Navbar;
