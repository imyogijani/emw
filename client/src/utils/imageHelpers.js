/**
 * Image utility functions for handling fallbacks and error states
 */

// Default placeholder image URL (local fallback)
export const DEFAULT_PLACEHOLDER = "/Mall1.png";

// Category-specific placeholder images with local fallback
export const CATEGORY_PLACEHOLDERS = {
  electronics: "/Mall1.png",
  fashion: "/Mall1.png", 
  beauty: "/Mall1.png",
  home: "/Mall1.png",
  sports: "/Mall1.png",
  books: "/Mall1.png",
  toys: "/Mall1.png",
  default: DEFAULT_PLACEHOLDER
};

/**
 * Get a placeholder image based on category
 * @param {string} category - Product category
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = (category = 'default') => {
  const categoryKey = category.toLowerCase();
  return CATEGORY_PLACEHOLDERS[categoryKey] || CATEGORY_PLACEHOLDERS.default;
};

/**
 * Handle image error by setting a fallback
 * @param {Event} event - Image error event
 * @param {string} fallbackUrl - Optional custom fallback URL
 */
export const handleImageError = (event, fallbackUrl = null) => {
  const img = event.target;
  const customFallback = fallbackUrl || DEFAULT_PLACEHOLDER;
  
  // Prevent infinite loop if fallback also fails
  if (img.src !== customFallback) {
    img.src = customFallback;
  }
};

/**
 * Get the best available image from multiple sources
 * @param {Object} item - Item object with potential image properties
 * @param {string} category - Item category for placeholder
 * @returns {string} Best available image URL
 */
export const getBestImage = (item, category = 'default') => {
  // Try multiple image sources
  const possibleImages = [
    item?.image,
    item?.images?.[0],
    item?.thumbnail,
    item?.picture,
    item?.photo
  ].filter(Boolean);

  if (possibleImages.length > 0) {
    return possibleImages[0];
  }

  // Return category-specific placeholder
  return getPlaceholderImage(category);
};
