/* eslint-disable no-unused-vars */
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./SellerSidebar.css";

const sellerLinks = [
  { name: "Dashboard", path: "/seller/dashboard", icon: <FaHome /> },
  {
    name: "Products",
    path: "/seller/products/all",
    icon: <FaBox />,
    subLinks: [
      { name: "All Products", path: "/seller/products/all" },
      { name: "Add New Product", path: "/seller/products/add" },
    ],
  },
  { name: "Orders", path: "/seller/orders", icon: <FaShoppingCart /> },
  { name: "Deals", path: "/seller/deals", icon: <FaBox /> },
  { name: "Customers", path: "/seller/customers", icon: <FaUsers /> },
  { name: "Profile", path: "/seller/profile", icon: <FaUsers /> },
];

const SellerSidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { showSuccessToast } = await import('../utils/muiAlertHandler.jsx');
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    showSuccessToast("Logged out successfully", "Seller Sidebar - Logout");
    navigate("/login");
  };

  // Check if current location matches any sublink
  const isSubLinkActive = (subLinks) => {
    return subLinks?.some((subLink) => location.pathname === subLink.path);
  };

  const handleTitleClick = () => {
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="admin-sidebar">
        <h2
          className="admin-title"
          onClick={handleTitleClick}
          style={{ cursor: "pointer" }}
        >
          E-Mall Seller
        </h2>
        <nav>
          <ul className="admin-nav-list">
            {sellerLinks.map((link, idx) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`admin-nav-link ${
                    (
                      idx === 0
                        ? location.pathname === link.path
                        : location.pathname.includes(link.path) ||
                          isSubLinkActive(link.subLinks)
                    )
                      ? "active"
                      : ""
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
                            location.pathname === subLink.path ? "active" : ""
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
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SellerSidebar;
