import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import { toast } from "react-toastify";

import "./AdminHeader.css";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import NotificationBell from "../NotificationBell";

const AdminHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header>
      <nav>
        <div className="nav-left">
          <h1>{theme === "light" ? "Foodecom" : "Foodecom Dark"}</h1>
        </div>
        <div className="nav-center">
          <ul>
            <li>
              <Link to="/admin/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/admin/products">Products</Link>
            </li>
            <li>
              <Link to="/admin/orders">Orders</Link>
            </li>
            <li>
              <Link to="/admin/users">Users</Link>
            </li>
          </ul>
        </div>
        <div className="nav-right">
          <NotificationBell role="admin" />
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </nav>
    </header>
  );
};

export default AdminHeader;
