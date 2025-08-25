import React from 'react';
import './LoadingTransition.css';

const LoadingTransition = ({ 
  isLoading, 
  message = "Loading...", 
  showSpinner = true,
  overlay = true 
}) => {
  if (!isLoading) return null;

  return (
    <div className={`loading-transition ${overlay ? 'overlay' : ''}`}>
      <div className="loading-content">
        {showSpinner && (
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
        )}
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingTransition;