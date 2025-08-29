import { useState, useEffect, useCallback } from 'react';
import { loadImageWithRetry, getFallbackImage } from '../utils/apiConfig';

/**
 * Custom hook for handling image loading with error handling, retry logic, and fallbacks
 * @param {string|Array} imageSrc - The image source URL or array of URLs
 * @param {string} imageType - Type of image (product, category, store, user, etc.)
 * @param {Object} options - Configuration options
 * @returns {Object} - Image loading state and handlers
 */
export const useImageLoader = (imageSrc, imageType = 'product', options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    enableLazyLoading = true,
    customFallback = null
  } = options;

  const [imageState, setImageState] = useState({
    src: null,
    isLoading: true,
    hasError: false,
    isRetrying: false,
    retryCount: 0
  });

  const fallbackImage = customFallback || getFallbackImage(imageType);

  const loadImage = useCallback(async (src) => {
    if (!src) {
      setImageState(prev => ({
        ...prev,
        src: fallbackImage,
        isLoading: false,
        hasError: true
      }));
      return;
    }

    setImageState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      isRetrying: prev.retryCount > 0
    }));

    try {
      await loadImageWithRetry(src, maxRetries, retryDelay);
      setImageState({
        src,
        isLoading: false,
        hasError: false,
        isRetrying: false,
        retryCount: 0
      });
    } catch (error) {
      console.warn(`Failed to load image: ${src}`, error);
      setImageState(prev => ({
        ...prev,
        src: fallbackImage,
        isLoading: false,
        hasError: true,
        isRetrying: false,
        retryCount: prev.retryCount + 1
      }));
    }
  }, [fallbackImage, maxRetries, retryDelay]);

  const retryLoad = useCallback(() => {
    if (imageSrc) {
      loadImage(imageSrc);
    }
  }, [imageSrc, loadImage]);

  const handleImageError = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      src: fallbackImage,
      isLoading: false,
      hasError: true
    }));
  }, [fallbackImage]);

  const handleImageLoad = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      isLoading: false,
      hasError: false
    }));
  }, []);

  useEffect(() => {
    if (imageSrc) {
      loadImage(imageSrc);
    } else {
      setImageState({
        src: fallbackImage,
        isLoading: false,
        hasError: true,
        isRetrying: false,
        retryCount: 0
      });
    }
  }, [imageSrc, loadImage, fallbackImage]);

  return {
    ...imageState,
    retryLoad,
    handleImageError,
    handleImageLoad,
    fallbackImage
  };
};

/**
 * Simplified hook for basic image loading with fallback
 * @param {string} imageSrc - The image source URL
 * @param {string} fallback - Fallback image URL
 * @returns {Object} - Basic image state
 */
export const useSimpleImageLoader = (imageSrc, fallback) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const resetImage = useCallback(() => {
    setImageLoading(true);
    setImageError(false);
  }, []);

  useEffect(() => {
    if (imageSrc) {
      resetImage();
    }
  }, [imageSrc, resetImage]);

  return {
    src: imageError ? fallback : imageSrc,
    isLoading: imageLoading,
    hasError: imageError,
    handleImageLoad,
    handleImageError,
    resetImage
  };
};

export default useImageLoader;