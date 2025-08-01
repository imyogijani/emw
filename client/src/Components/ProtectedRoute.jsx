import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "../utils/axios";
import { toast } from "react-toastify";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

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
        toast.error("Session expired. Please login again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    toast.error("You do not have permission to access this page");
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
