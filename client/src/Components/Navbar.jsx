import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaStore,
  FaCog,
  FaSignOutAlt,
  FaSignInAlt,
  FaShoppingCart,
  FaUser,
  FaTachometerAlt,
  FaCreditCard,
  FaClipboardList,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "../utils/axios";
import "../Components/Navbar.css";
import UserProfile from "./UserProfile/UserProfile";
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

  // Show user menu for all authenticated users
  const shouldShowUserMenu = user && localStorage.getItem("token");

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
                    <FaUser className="user-avatar-icon" />
                  </button>
                  {showUserMenu && (
                    <div className="user-menu animate-dropdown">
                      <div className="user-info">
                        <FaUser className="menu-avatar-icon" />
                        <div className="user-details">
                          <p className="user-name">
                            {user?.role === "shopowner" 
                              ? (user?.shopownerName || user?.names || "Shopowner")
                              : (user?.names || "User")
                            }
                          </p>
                          <p className="user-email">
                            {user?.email || "No email"}
                          </p>
                          {user?.role === "shopowner" && (
                            <p className="user-role">
                              Seller
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="menu-divider"></div>
                      {/* My Profile - Available for all roles */}
                      <button
                        className="btn btn-small btn-secondary menu-item dashboard-dropdown"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowProfile(true);
                        }}
                      >
                        <span className="sparkle"><FaUser /></span>
                        <span className="text">My Profile</span>
                      </button>

                      {/* Role-specific menu items */}
                      {user?.role === "shopowner" && (
                        <>
                          <button
                            className="btn btn-small btn-secondary menu-item dashboard-dropdown"
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate("/seller/dashboard");
                            }}
                          >
                            <span className="sparkle"><FaTachometerAlt /></span>
                            <span className="text">Dashboard</span>
                          </button>
                        </>
                      )}

                      {user?.role === "client" && (
                        <>
                          <button
                            className="btn btn-small btn-secondary menu-item dashboard-dropdown"
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate("/cart");
                            }}
                          >
                            <span className="sparkle"><FaShoppingCart /></span>
                            <span className="text">My Cart</span>
                          </button>
                          <button
                            className="btn btn-small btn-secondary menu-item dashboard-dropdown"
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate("/orders");
                            }}
                          >
                            <span className="sparkle"><FaClipboardList /></span>
                            <span className="text">My Orders</span>
                          </button>
                          <button
                            className="btn btn-small btn-secondary menu-item dashboard-dropdown"
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate("/payment-methods");
                            }}
                          >
                            <span className="sparkle"><FaCreditCard /></span>
                            <span className="text">My Payment Methods</span>
                          </button>
                        </>
                      )}

                      {/* Logout - Available for all roles */}
                      <button
                        className="btn btn-small btn-danger menu-item dashboard-dropdown logout"
                        onClick={handleLogout}
                      >
                        <span className="sparkle"><FaSignOutAlt /></span>
                        <span className="text">Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-medium btn-primary login-button"
                style={{ textDecoration: "none" }}
              >
                <span className="sparkle"><FaSignInAlt /></span>
                <span className="text">Sign In</span>
              </Link>
            )}

            <button className="btn btn-small btn-secondary mobile-menu-toggle" onClick={toggleMobileMenu}>
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
          <button className="btn btn-small btn-secondary mobile-menu-close" onClick={closeMobileMenu}>
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
          {localStorage.getItem("token") && shouldShowUserMenu ? (
            <>
              {/* My Profile - Available for all roles */}
              <button
                className="btn btn-medium btn-secondary nav-pill-link"
                onClick={() => {
                  closeMobileMenu();
                  setShowProfile(true);
                }}
              >
                <span className="sparkle"><FaUser /></span>
                <span className="text">My Profile</span>
              </button>

              {/* Role-specific mobile menu items */}
              {user?.role === "shopowner" && (
                <button
                  className="btn btn-medium btn-secondary nav-pill-link"
                  onClick={() => {
                    closeMobileMenu();
                    navigate("/seller/dashboard");
                  }}
                >
                  <span className="sparkle"><FaTachometerAlt /></span>
                  <span className="text">Dashboard</span>
                </button>
              )}

              {user?.role === "client" && (
                <>
                  <button
                    className="btn btn-medium btn-secondary nav-pill-link"
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/cart");
                    }}
                  >
                    <span className="sparkle"><FaShoppingCart /></span>
                    <span className="text">My Cart</span>
                  </button>
                  <button
                    className="btn btn-medium btn-secondary nav-pill-link"
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/orders");
                    }}
                  >
                    <span className="sparkle"><FaClipboardList /></span>
                    <span className="text">My Orders</span>
                  </button>
                  <button
                    className="btn btn-medium btn-secondary nav-pill-link"
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/payment-methods");
                    }}
                  >
                    <span className="sparkle"><FaCreditCard /></span>
                    <span className="text">My Payment Methods</span>
                  </button>
                </>
              )}

              {/* Logout - Available for all roles */}
              <button className="btn btn-medium btn-danger nav-pill-link logout" onClick={handleLogout}>
                <span className="sparkle"><FaSignOutAlt /></span>
                <span className="text">Log Out</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn btn-medium btn-primary login-button"
              onClick={closeMobileMenu}
            >
              <span className="sparkle"><FaSignInAlt /></span>
              <span className="text">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Navbar;
