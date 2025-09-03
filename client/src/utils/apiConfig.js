/* eslint-disable no-unused-vars */
/**
 * Get the appropriate API base URL based on the environment
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  try {
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV;
    const mode = import.meta.env.MODE;
    const hostname = window.location.hostname;
    
    console.log('Environment Detection:', {
      isDevelopment,
      mode,
      hostname,
      VITE_API_BASE_URL_LOCAL: import.meta.env.VITE_API_BASE_URL_LOCAL,
      VITE_API_BASE_URL_PROD: import.meta.env.VITE_API_BASE_URL_PROD
    });
    
    let apiBaseUrl;
    
    if (isDevelopment || mode === 'development') {
      // Use local API URL for development
      apiBaseUrl = import.meta.env.VITE_API_BASE_URL_LOCAL || 'http://localhost:8080';
    } else {
      // Production environment detection
      if (hostname === 'emallworld.com' || hostname === 'www.emallworld.com') {
        apiBaseUrl = import.meta.env.VITE_API_BASE_URL_PROD || 'https://api.emallworld.com';
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local production build testing
        apiBaseUrl = import.meta.env.VITE_API_BASE_URL_LOCAL || 'http://localhost:8080';
      } else {
        // Default to production API for any other domain
        apiBaseUrl = import.meta.env.VITE_API_BASE_URL_PROD || 'https://api.emallworld.com';
      }
    }
    
    // Validate the URL format
    if (!isValidUrl(apiBaseUrl)) {
      console.error('Invalid API base URL detected:', apiBaseUrl);
      // Fallback to production URL if current URL is invalid
      apiBaseUrl = 'https://api.emallworld.com';
    }
    
    console.log('Selected API Base URL:', apiBaseUrl);
    return apiBaseUrl;
    
  } catch (error) {
    console.error('Error determining API base URL:', error);
    // Fallback to production URL in case of any error
    return 'https://api.emallworld.com';
  }
};

/**
 * Validate if a string is a valid URL
 * @param {string} string - The string to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
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

      // If it's just a filename, assume it's in uploads/products
      return `${baseURL}/uploads/products/${img}`;
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

// Enhanced image loading utility with retry logic
export const loadImageWithRetry = (src, maxRetries = 3, delay = 1000) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const tryLoad = () => {
      const img = new Image();
      
      img.onload = () => resolve(src);
      
      img.onerror = () => {
        attempts++;
        if (attempts < maxRetries) {
          setTimeout(tryLoad, delay * attempts);
        } else {
          reject(new Error(`Failed to load image after ${maxRetries} attempts`));
        }
      };
      
      img.src = src;
    };
    
    tryLoad();
  });
};

// Utility to get fallback image based on context
export const getFallbackImage = (context = 'product') => {
  const fallbacks = {
    product: '/images/offer1.png',
    category: '/vite.svg',
    store: 'https://images.pexels.com/photos/6214360/pexels-photo-6214360.jpeg',
    user: '/images/MaleUser.png',
    default: '/images/offer1.png'
  };
  
  return fallbacks[context] || fallbacks.default;
};

// Specific utility for category images
export const processCategoryImageUrl = (image) => {
  try {
    if (!image || typeof image !== "string") {
      return getFallbackImage('category'); // Category-specific fallback
    }

    // Trim whitespace
    image = image.trim();

    if (!image) return getFallbackImage('category');

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
    return getFallbackImage('category');
  }
};

// Unified image processing function that handles all image types
export const processImageUrlUnified = (image, type = 'product') => {
  try {
    if (!image || (typeof image !== "string" && !Array.isArray(image))) {
      return getFallbackImage(type);
    }

    // Handle array of images
    if (Array.isArray(image)) {
      if (image.length === 0) return getFallbackImage(type);
      image = image[0];
    }

    // Ensure it's a string and trim whitespace
    image = String(image).trim();
    if (!image) return getFallbackImage(type);

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

    // If it's just a filename, determine the folder based on type
    const folderMap = {
      product: 'products',
      category: 'categories',
      brand: 'brands',
      store: 'shopowner',
      user: 'avatars',
      avatar: 'avatars'
    };
    
    const folder = folderMap[type] || 'products';
    return `${baseURL}/uploads/${folder}/${image}`;
  } catch (error) {
    console.error(`❌ Error processing ${type} image URL:`, error);
    return getFallbackImage(type);
  }
};

// Export the base URL getter for direct use
export default getApiBaseUrl;
