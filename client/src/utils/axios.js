import axios from "axios";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "./apiConfig";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL_LOCAL,
  // baseURL: import.meta.env.VITE_API_BASE_URL_PROD,
  timeout: 15000, // Increased timeout for file uploads
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("Using API Base URL:", getApiBaseUrl());

console.log("Axios Instance Configuration:", {
  baseURL: instance.defaults.baseURL,
  timeout: instance.defaults.timeout,
  headers: instance.defaults.headers,
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { message, errors } = error.response.data || {};

      // Show main error message
      if (message) {
        toast.error(message); // Changed to toast instead of console.error
      }

      // If there are field errors, show them as toasts
      if (errors && typeof errors === "object") {
        Object.values(errors).forEach((errMsg) => {
          if (errMsg) toast.error(errMsg); // Changed to toast
        });
      }

      // Handle 401 logout logic
      if (error.response.status === 401) {
        const publicPaths = [
          "/",
          "/menu",
          "/offer",
          "/shops",
          "/product",
          "/login",
          "/register",
          "/pricing",
        ];
        const currentPath = window.location.pathname;
        const isPublicPath = publicPaths.some((path) =>
          currentPath.startsWith(path)
        );

        if (!isPublicPath) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error("No response from server. Please check your connection.");
    } else {
      // Something happened in setting up the request
      toast.error("Network error. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default instance;
