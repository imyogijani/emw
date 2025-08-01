import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SellerSidebar from "./SellerSidebar";

const SellerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle sidebar open/close for mobile
  const handleSidebarToggle = () => setSidebarOpen((open) => !open);
  const handleSidebarClose = () => setSidebarOpen(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Hamburger button for mobile */}
      <button
        className="seller-hamburger-btn"
        onClick={handleSidebarToggle}
        aria-label="Open sidebar"
        style={{
          position: "fixed",
          top: 20,
          left: sidebarOpen ? 280 : 20,
          zIndex: 200,
          background: "var(--dark-blue)",
          border: "none",
          borderRadius: 6,
          width: 44,
          height: 44,
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          transition: "left 0.3s ease",
        }}
      >
        <span className="hamburger-lines">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflowY: "auto",
          backgroundColor: "var(--dark-blue)",
          zIndex: 100,
          width: "280px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="seller-sidebar-container"
      >
        <SellerSidebar onClose={handleSidebarClose} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="seller-sidebar-overlay"
          onClick={handleSidebarClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            zIndex: 99,
          }}
        ></div>
      )}

      {/* Main content */}
      <div
        style={{
          marginLeft: "280px",
          flexGrow: 1,
          overflowY: "auto",
          height: "100vh",
        }}
        className="seller-main-content"
      >
        <Outlet />
      </div>

      <style>{`
        .seller-sidebar-container::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 900px) {
          .seller-main-content {
            margin-left: 0 !important;
            padding-top: 80px !important;
            padding-left: 15px !important;
            padding-right: 15px !important;
          }
          .seller-hamburger-btn {
            display: flex !important;
          }
          .seller-sidebar-container {
            width: 260px !important;
            min-width: 220px !important;
            max-width: 85vw !important;
            box-shadow: 2px 0 8px rgba(0,0,0,0.08) !important;
            background: var(--dark-blue) !important;
            transition: transform 0.3s ease !important;
            will-change: transform !important;
            transform: ${sidebarOpen ? "translateX(0)" : "translateX(-100%)"} !important;
          }
        }
        @media (max-width: 768px) {
          .seller-main-content {
            padding-top: 70px !important;
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
          .seller-sidebar-container {
            max-width: 90vw !important;
            width: 240px !important;
          }
        }
        @media (max-width: 480px) {
          .seller-main-content {
            padding-top: 60px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .seller-sidebar-container {
            max-width: 95vw !important;
            width: 220px !important;
          }
          .seller-hamburger-btn {
            width: 40px !important;
            height: 40px !important;
            top: 15px !important;
            left: ${sidebarOpen ? 230 : 15}px !important;
          }
        }
        .hamburger-lines {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .hamburger-lines span {
          display: block;
          width: 24px;
          height: 3px;
          background: #fff;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default SellerLayout;
