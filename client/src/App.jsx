/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./styles/sweet-alert-styles.css";
import ProtectedRoute from "./Components/ProtectedRoute";
import "./App.css";
import Home from "./Pages/Home/index";

import Navbar from "./Components/Navbar";
import Products from "./Pages/Home/Products";
import Offers from "./Pages/Home/Offers";
import Shops from "./Pages/Home/Shops";
import Footer from "./Components/Footer/index";
import Login from "./Components/Login/Login";
import Register from "./Components/Login/Register";
import AuthTransition from "./Components/Login/AuthTransition";
import Pricing from "./Components/Login/Pricing";
import Terms from "./Pages/terms";
import Privacy from "./Pages/privacy";
import Cookies from "./Pages/cookies";
import ModernSlavery from "./Pages/modern-slavery";
import Help from "./Pages/help";
import AddRestaurant from "./Pages/add-restaurant";
import SignupDeliver from "./Pages/signup-deliver";
import CreateBusinessAccount from "./Pages/create-business";
import EmailPolicy from "./Pages/email-policy";
import DoNotSell from "./Pages/do-not-sell";
import NotFound from "./Pages/NotFound";
import AdminLayout from "./Components/AdminLayout";
import SellerLayout from "./Components/SellerLayout";
import Dashboard from "./Pages/admin/Dashboard";
import AdminProducts from "./Pages/admin/Products";
import Orders from "./Pages/admin/Orders";
import Users from "./Pages/admin/Users";
import Categories from "./Pages/admin/Categories";
import AdminMenu from "./Pages/admin/Menu";
import AdminDeals from "./Pages/admin/AdminDeals";
import AdminOffers from "./Pages/admin/AdminOffers";
import ManageLocations from "./Pages/admin/ManageLocations";
import Settings from "./Pages/admin/Settings";
import OnboardingManagement from "./Pages/admin/OnboardingManagement";
import SellerDashboard from "./Pages/Seller/SellerDashboard";
import SellerProducts from "./Pages/Seller/SellerProducts";
import AddProduct from "./Pages/Seller/AddProduct";
import StepWiseAddProduct from "./Pages/Seller/StepWiseAddProduct";
import SellerOrders from "./Pages/Seller/SellerOrders";
import SellerCustomers from "./Pages/Seller/SellerCustomers";
import Cart from "./Components/Cart/Cart";
import UserProfile from "./Components/UserProfile/UserProfile";
import { CartProvider } from "./context/CartContext";
import CartFloatingButton from "./Components/CartFloatingButton";
import SellerProfile from "./Pages/Seller/SellerProfile";
import SellerDeals from "./Pages/Seller/SellerDeals";
import ProductDetail from "./Pages/Home/ProductDetail";
import { DealsProvider } from "./context/DealsContext";
import Checkout from "./Pages/Checkout/Checkout";
import Payment from "./Pages/Payment/Payment";
import Invoice from "./Pages/Invoice/Invoice";
import SellerOnboarding from "./Pages/Seller/SellerOnboarding";
import Onboarding from "./Components/Onboarding/Onboarding";
import SellerShipments from "./Pages/Seller/SellerShipments";

function LayoutWrapper() {
  const [showProfile, setShowProfile] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const location = useLocation();

  // Check if device is mobile or tablet
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = window.innerWidth <= 1024; // Tablet and mobile breakpoint
      setIsMobileOrTablet(isMobile);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Define paths where you DON'T want header, navbar, footer
  const hideLayoutPaths = [
    "/login",
    "/register",
    "/checkout",
    "/payment",
    "/onboarding",

    "/admin",
    "/admin/dashboard",
    "/admin/products",
    "/admin/orders",
    "/admin/users",
    "/admin/categories",
    "/admin/deals",
    "/admin/menu",
    "/admin/offers", // Hide navbar/footer for admin offers page
    "/admin/locations", // Hide navbar/footer for admin locations page
    "/admin/onboarding", // Hide navbar/footer for admin onboarding page
    "/admin/settings", // Hide navbar/footer for admin settings page
    "/seller",
    "/seller/dashboard",
    "/seller/products/all",
    "/seller/products/add",
    "/seller/orders",
    "/seller/customers",
    "/seller/deals",
    "/seller/profile",
    "/seller/onboarding", // Hide layout for onboarding
    "/seller/sellershipments",
  ];

  const hideLayout = hideLayoutPaths.includes(location.pathname.toLowerCase());

  // Determine if we are on an admin, seller, login, or register route
  const isAdminOrSellerOrAuth =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/seller") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");

  // Show cart button only on non-admin/seller/auth/onboarding pages
  const shouldShowCartButton =
    !isAdminOrSellerOrAuth && !location.pathname.includes("onboarding");
  return (
    <>
      {!hideLayout && <Navbar onProfileClick={() => setShowProfile(true)} />}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="offer" element={<Offers />} />
        <Route path="shops" element={<Shops />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route
          path="login"
          element={
            <AuthTransition>
              <Login />
            </AuthTransition>
          }
        />
        <Route
          path="register"
          element={
            <AuthTransition>
              <Register />
            </AuthTransition>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/onboarding/*" element={<Onboarding />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/invoice/:orderId" element={<Invoice />} />

        <Route path="/profile-edit" element={<UserProfile />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/modern-slavery" element={<ModernSlavery />} />
        <Route path="/help" element={<Help />} />
        <Route path="/add-restaurant" element={<AddRestaurant />} />
        <Route path="/signup-deliver" element={<SignupDeliver />} />
        <Route path="/create-business" element={<CreateBusinessAccount />} />
        <Route path="/email-policy" element={<EmailPolicy />} />
        <Route path="/do-not-sell" element={<DoNotSell />} />
        <Route
          path="/seller/onboarding"
          element={
            <ProtectedRoute allowedRoles={["shopowner"]}>
              <SellerOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
          <Route path="onboarding" element={<OnboardingManagement />} />
          <Route path="categories" element={<Categories />} />
          <Route path="deals" element={<AdminDeals />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="locations" element={<ManageLocations />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route
          path="seller"
          element={
            <ProtectedRoute allowedRoles={["shopowner"]}>
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerDashboard />} />
          <Route path="dashboard" element={<SellerDashboard />} />
          <Route path="products/all" element={<SellerProducts />} />
          <Route path="products/add" element={<StepWiseAddProduct />} />
          <Route path="products/add-legacy" element={<AddProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="customers" element={<SellerCustomers />} />
          <Route path="deals" element={<SellerDeals />} />
          <Route path="profile" element={<SellerProfile />} />
          <Route path="sellershipments" element={<SellerShipments />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        {/* Add more routes as needed */}
      </Routes>
      {!hideLayout && <Footer />}
      {/* Cart button rendered at the end to ensure it's not clipped by containers */}
      {shouldShowCartButton && <CartFloatingButton />}
    </>
  );
}

function App() {
  return (
    <DealsProvider>
      <CartProvider>
        <BrowserRouter>
          <LayoutWrapper />
        </BrowserRouter>
      </CartProvider>
    </DealsProvider>
  );
}

export default App;
