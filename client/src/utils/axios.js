import axios from "axios";
import { getApiBaseUrl } from "./apiConfig";
import { handleApiError, ERROR_TYPES } from "./errorHandler";

// Get the correct base URL based on environment
const baseURL = getApiBaseUrl();

const instance = axios.create({
  baseURL: baseURL,
  timeout: 15000, // Increased timeout for file uploads
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("Using API Base URL:", baseURL);

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
    // Use the centralized error handler
    const context = error.config?.url
      ? `API Request to ${error.config.url}`
      : "API Request";
    const metadata = {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      timeout: error.config?.timeout,
    };

    // Handle the error with our centralized system
    handleApiError(error, context, null, { metadata });

    return Promise.reject(error);
  }
);

export default instance;
