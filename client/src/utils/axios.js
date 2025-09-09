import axios from "axios";
import { getApiBaseUrl } from "./apiConfig";
import { handleApiError } from "./muiAlertHandler.jsx";
import { ERROR_TYPES } from "./errorHandler";

// Get the correct base URL based on environment
const baseURL = getApiBaseUrl();

const instance = axios.create({
  baseURL: baseURL,
  timeout: 15000, // Increased timeout for file uploads
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, //  cookie send for refresh token mandatory
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

//  Token refresh logic
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Add a response interceptor
// instance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Use the centralized error handler
//     const context = error.config?.url
//       ? `API Request to ${error.config.url}`
//       : "API Request";
//     const metadata = {
//       method: error.config?.method?.toUpperCase(),
//       url: error.config?.url,
//       baseURL: error.config?.baseURL,
//       timeout: error.config?.timeout,
//     };

//     // Handle the error with our centralized system
//     handleApiError(error, context, null, { metadata });

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const context = error.config?.url
        ? `API Request to ${error.config.url}`
        : "API Request";

      const metadata = {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      };

      handleApiError(error, context, null, { metadata });
      return Promise.reject(error);
    }

    //  If access token has expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh already in progress, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        //  Refresh token API call
        const res = await axios.post(
          `${baseURL}/api/auth/refresh-token`,
          {},
          { withCredentials: true } //  for cookie sends
        );

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("token", newAccessToken);

        instance.defaults.headers.common["Authorization"] =
          "Bearer " + newAccessToken;

        processQueue(null, newAccessToken);
        console.log("Access Token:", localStorage.getItem("token"));
        console.log("Refresh Token:", document.cookie);

        return instance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login"; // force logout
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
