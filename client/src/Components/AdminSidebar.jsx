/* eslint-disable no-unused-vars */
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBox,
  FaMapMarkerAlt,
  FaBookOpen,
  FaProductHunt,
  FaShoppingCart,
  FaUsers,
  FaSignOutAlt,
  FaHandshake,
  FaTag,
  FaBell,
  FaCog,
  FaUserCheck,
} from "react-icons/fa";
import { useTheme } from "../ThemeContext";
import { toast } from "react-toastify";
import "./AdminSidebar.css";

const adminLinks = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <FaHome /> },
  {
    name: "Manage Locations",
    path: "/admin/locations",
    icon: <FaMapMarkerAlt />,
  },

  {
    name: "Products",
    path: "/admin/products",
    icon: <FaProductHunt />,
    subLinks: [
      {
        name: "All Products",
        path: "/admin/products",
      },
      {
        name: "Categories",
        path: "/admin/categories",
      },
    ],
  },
  { name: "Orders", path: "/admin/orders", icon: <FaShoppingCart /> },
  { name: "Users", path: "/admin/users", icon: <FaUsers /> },
  { name: "Onboarding", path: "/admin/onboarding", icon: <FaUserCheck /> },
  { name: "Deals", path: "/admin/deals", icon: <FaHandshake /> },

  { name: "Subscriptions", path: "/admin/subscriptions", icon: <FaTag /> },

  { name: "Menu", path: "/admin/menu", icon: <FaBookOpen /> },
  { name: "Today's Offers", path: "/admin/offers", icon: <FaBell /> },
  { name: "Settings", path: "/admin/settings", icon: <FaCog /> },
];

const AdminSidebar = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleTitleClick = () => {
    navigate("/");
  };

  return (
    <aside className={`sidebar ${theme}`}>
      <div className="admin-sidebar">
        <h2
          className="admin-title"
          onClick={handleTitleClick}
          style={{ cursor: "pointer" }}
        >
          E-Mall Admin
        </h2>
        <nav>
          <ul className="admin-nav-list">
            {adminLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`admin-nav-link ${
                    location.pathname.includes(link.path) ? "active" : ""
                  }`}
                >
                  <span className="admin-nav-icon">{link.icon}</span>
                  <span
                    className="admin-nav-text"
                    style={{ textDecoration: "none" }}
                  >
                    {link.name}
                  </span>
                </Link>
                {link.subLinks && (
                  <ul className="admin-sub-nav-list">
                    {link.subLinks.map((subLink) => (
                      <li key={subLink.path}>
                        <Link
                          to={subLink.path}
                          style={{ textDecoration: "none" }}
                          className={`admin-sub-nav-link ${
                            location.pathname.includes(subLink.path)
                              ? "active"
                              : ""
                          }`}
                        >
                          {subLink.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {/* <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={
              theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
            }
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button> */}

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
