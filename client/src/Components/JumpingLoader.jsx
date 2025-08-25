import React from 'react';
import './JumpingLoader.css';

const JumpingLoader = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  };

  return (
    <div className={`loader ${sizeClasses[size]} ${className}`}></div>
  );
};

export default JumpingLoader;