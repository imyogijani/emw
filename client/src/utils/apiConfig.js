// Utility function to get the correct API base URL based on environment
export const getApiBaseUrl = () => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
  
  if (isDevelopment) {
    return import.meta.env.VITE_API_BASE_URL_LOCAL || 'http://localhost:8080';
  } else {
    return import.meta.env.VITE_API_BASE_URL_PROD || 'https://api.emallworld.com';
  }
};

// Utility function to process image URLs with correct base URL
export const processImageUrl = (image) => {
  const baseURL = getApiBaseUrl();
  
  // Handle different image formats
  const getFullUrl = (img) => {
    if (!img) return '/images/offer1.png'; // Default fallback
    
    // If image already starts with http/https, return as is
    if (img.startsWith('http')) return img;
    
    // If image starts with /uploads, prepend base URL
    if (img.startsWith('/uploads')) {
      return `${baseURL}${img}`;
    }
    
    // If it's just a filename, assume it's in uploads
    return `${baseURL}/uploads/${img}`;
  };

  // Handle array of images
  if (Array.isArray(image) && image.length > 0) {
    return getFullUrl(image[0]);
  } 
  // Handle string image
  else if (typeof image === 'string' && image.length > 0) {
    return getFullUrl(image);
  }

  // Return default fallback
  return '/images/offer1.png';
};

// Specific utility for category images
export const processCategoryImageUrl = (image) => {
  if (!image) return '/vite.svg'; // Category-specific fallback
  
  const baseURL = getApiBaseUrl();
  
  if (image.startsWith('http')) return image;
  if (image.startsWith('/uploads')) {
    return `${baseURL}${image}`;
  }
  
  return `${baseURL}/uploads/categories/${image}`;
};

// Export the base URL getter for direct use
export default getApiBaseUrl;