// Utility function to get the correct API base URL based on environment
export const getApiBaseUrl = () => {
  try {
    // Check if we're in development mode
    const isDevelopment =
      import.meta.env.DEV ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("localhost");

    let baseUrl;

    if (isDevelopment) {
      baseUrl =
        import.meta.env.VITE_API_BASE_URL_LOCAL || "http://localhost:8080";
    } else {
      baseUrl =
        import.meta.env.VITE_API_BASE_URL_PROD || "https://api.emallworld.com";
    }

    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      console.error("❌ Invalid API base URL:", baseUrl);
      return isDevelopment
        ? "http://localhost:8080"
        : "https://api.emallworld.com";
    }

    return baseUrl;
  } catch (error) {
    console.error("❌ Error determining API base URL:", error);
    return "http://localhost:8080"; // Safe fallback
  }
};

// Utility function to process image URLs with correct base URL
export const processImageUrl = (image) => {
  try {
    const baseURL = getApiBaseUrl();

    // Handle different image formats
    const getFullUrl = (img) => {
      if (!img || typeof img !== "string") {
        return "/images/offer1.png"; // Default fallback
      }

      // Trim whitespace
      img = img.trim();

      if (!img) return "/images/offer1.png";

      // If image already starts with http/https, return as is
      if (img.startsWith("http://") || img.startsWith("https://")) {
        return img;
      }

      // If image starts with /uploads, prepend base URL
      if (img.startsWith("/uploads")) {
        return `${baseURL}${img}`;
      }

      // If it starts with uploads (without slash), add slash
      if (img.startsWith("uploads/")) {
        return `${baseURL}/${img}`;
      }

      // If it's just a filename, assume it's in uploads
      return `${baseURL}/uploads/${img}`;
    };

    // Handle array of images
    if (Array.isArray(image) && image.length > 0) {
      return getFullUrl(image[0]);
    }
    // Handle string image
    else if (typeof image === "string" && image.length > 0) {
      return getFullUrl(image);
    }

    // Return default fallback
    return "/images/offer1.png";
  } catch (error) {
    console.error("❌ Error processing image URL:", error);
    return "/images/offer1.png";
  }
};

// Specific utility for category images
export const processCategoryImageUrl = (image) => {
  try {
    if (!image || typeof image !== "string") {
      return "/vite.svg"; // Category-specific fallback
    }

    // Trim whitespace
    image = image.trim();

    if (!image) return "/vite.svg";

    const baseURL = getApiBaseUrl();

    // If image already starts with http/https, return as is
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // If image starts with /uploads, prepend base URL
    if (image.startsWith("/uploads")) {
      return `${baseURL}${image}`;
    }

    // If it starts with uploads (without slash), add slash
    if (image.startsWith("uploads/")) {
      return `${baseURL}/${image}`;
    }

    // If it's just a filename, assume it's in uploads/categories
    return `${baseURL}/uploads/categories/${image}`;
  } catch (error) {
    console.error("❌ Error processing category image URL:", error);
    return "/vite.svg";
  }
};

// Export the base URL getter for direct use
export default getApiBaseUrl;
