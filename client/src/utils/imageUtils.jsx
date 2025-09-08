/**
 * React component for images with automatic fallback and loading state
 */
import React, { useState } from "react";
import { getPlaceholderImage } from "./imageHelpers";
import "./SafeImage.css";

export const SafeImage = ({ 
  src, 
  alt, 
  category = 'default', 
  className = '',
  style = {},
  showLoading = true,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || getPlaceholderImage(category));

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e) => {
    setIsLoading(false);
    if (!hasError) {
      setHasError(true);
      const fallbackSrc = getPlaceholderImage(category);
      setCurrentSrc(fallbackSrc);
      e.target.src = fallbackSrc;
    }
  };

  return (
    <div className={`safe-image-container ${className}`} style={style}>
      {isLoading && showLoading && (
        <div className="image-loading-overlay">
          <div className="loading-spinner"></div>
          <span style={{ marginLeft: '8px', color: '#6c757d', fontSize: '14px' }}>Loading...</span>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: isLoading ? 0.3 : 1,
        }}
        {...props}
      />
    </div>
  );
};
