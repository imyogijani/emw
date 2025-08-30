import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "../utils/axios";
import { showErrorToast } from "../utils/errorHandler";
import LoadingTransition from "./LoadingTransition/LoadingTransition";
import { setReturnUrl } from "../utils/navigationUtils";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/auth/verify-token", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setIsAuthenticated(true);
          setUserRole(response.data.user.role.toLowerCase());
        } else {
          throw new Error("Invalid token");
        }
      } catch (error) {
        console.error("Auth error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setIsAuthenticated(false);
        showErrorToast("Session expired. Please login again.", "ProtectedRoute - Authentication");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return (
      <LoadingTransition 
        isLoading={true} 
        message="Verifying authentication..." 
        overlay={true}
      />
    );
  }

  if (!isAuthenticated) {
    // Store current path for post-login redirect (exclude login/register pages)
    const currentPath = location.pathname + location.search;
    if (currentPath !== '/login' && currentPath !== '/register') {
      setReturnUrl(currentPath);
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    showErrorToast("You do not have permission to access this page", "ProtectedRoute - Authorization");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
