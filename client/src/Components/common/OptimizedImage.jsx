import React, { useState, useCallback } from 'react';
import { processImageUrlUnified, getFallbackImage } from '../../utils/apiConfig';
import { useImageLoader } from '../../hooks/useImageLoader';

/**
 * Optimized Image component with comprehensive error handling and loading states
 * @param {Object} props - Component props
 * @param {string|Array} props.src - Image source URL or array of URLs
 * @param {string} props.type - Image type (product, category, store, user, etc.)
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.className - CSS classes
 * @param {Object} props.style - Inline styles
 * @param {boolean} props.lazy - Enable lazy loading (default: true)
 * @param {boolean} props.showRetryButton - Show retry button on error (default: false)
 * @param {string} props.customFallback - Custom fallback image URL
 * @param {Function} props.onLoad - Callback when image loads
 * @param {Function} props.onError - Callback when image fails to load
 * @param {Object} props.loaderProps - Props for the loading component
 * @param {Object} props.errorProps - Props for the error component
 * @returns {JSX.Element} - Optimized image component
 */
const OptimizedImage = ({
  src,
  type = 'product',
  alt = 'Image',
  className = '',
  style = {},
  lazy = true,
  showRetryButton = false,
  customFallback = null,
  onLoad = null,
  onError = null,
  loaderProps = {},
  errorProps = {},
  ...otherProps
}) => {
  const processedSrc = src ? processImageUrlUnified(src, type) : null;
  const fallback = customFallback || getFallbackImage(type);
  
  const {
    src: imageSrc,
    isLoading,
    hasError,
    isRetrying,
    retryLoad,
    handleImageError,
    handleImageLoad
  } = useImageLoader(processedSrc, type, {
    customFallback: fallback,
    enableLazyLoading: lazy
  });

  const [imageVisible, setImageVisible] = useState(!lazy);

  const onImageLoad = useCallback((e) => {
    handleImageLoad();
    onLoad?.(e);
  }, [handleImageLoad, onLoad]);

  const onImageError = useCallback((e) => {
    handleImageError();
    onError?.(e);
  }, [handleImageError, onError]);

  const handleRetry = useCallback(() => {
    retryLoad();
  }, [retryLoad]);

  // Intersection Observer for lazy loading
  const imageRef = useCallback((node) => {
    if (!lazy || imageVisible) return;
    
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setImageVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, [lazy, imageVisible]);

  // Loading component
  const LoadingComponent = () => (
    <div 
      className={`image-loader ${loaderProps.className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        minHeight: '100px',
        ...loaderProps.style
      }}
    >
      {isRetrying ? (
        <div className="retry-spinner">
          <div className="spinner"></div>
          <span>Retrying...</span>
        </div>
      ) : (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );

  // Error component
  const ErrorComponent = () => (
    <div 
      className={`image-error ${errorProps.className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px dashed #dee2e6',
        minHeight: '100px',
        padding: '20px',
        textAlign: 'center',
        color: '#6c757d',
        ...errorProps.style
      }}
    >
      <div className="error-icon" style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
      <div className="error-message">Image not available</div>
      {showRetryButton && (
        <button 
          onClick={handleRetry}
          className="retry-button"
          style={{
            marginTop: '8px',
            padding: '4px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );

  // Don't render anything if lazy loading and not visible yet
  if (lazy && !imageVisible) {
    return (
      <div 
        ref={imageRef} 
        className={className}
        style={{
          ...style,
          backgroundColor: '#f5f5f5',
          minHeight: '100px'
        }}
      />
    );
  }

  // Show loading state
  if (isLoading && !hasError) {
    return <LoadingComponent />;
  }

  // Show error state without fallback image
  if (hasError && !imageSrc) {
    return <ErrorComponent />;
  }

  // Render the image
  return (
    <img
      ref={lazy ? imageRef : null}
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        display: isLoading ? 'none' : 'block'
      }}
      onLoad={onImageLoad}
      onError={onImageError}
      loading={lazy ? 'lazy' : 'eager'}
      {...otherProps}
    />
  );
};

// CSS for spinners (can be moved to a separate CSS file)
const spinnerStyles = `
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-loader, .image-error {
  font-size: 14px;
}

.retry-spinner .spinner {
  border-top-color: #28a745;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('optimized-image-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'optimized-image-styles';
  styleSheet.textContent = spinnerStyles;
  document.head.appendChild(styleSheet);
}

export default OptimizedImage;