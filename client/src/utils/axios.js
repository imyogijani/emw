import axios from "axios";

// console.log("Local API URL:", import.meta.env.VITE_API_BASE_URL_LOCAL);
// console.log("Prod API URL:", import.meta.env.VITE_API_BASE_URL_PROD);
const instance = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL_LOCAL,
  baseURL: import.meta.env.VITE_API_BASE_URL_PROD,
  timeout: 15000, // Increased timeout for file uploads
});

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
        console.error(message);
      }

      // If there are field errors, log or handle them
      if (errors && typeof errors === "object") {
        Object.values(errors).forEach((errMsg) => {
          if (errMsg) console.error(errMsg);
        });
      }

      // Handle 401 logout logic...
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
    } else {
      toast.error("Network error. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default instance;
