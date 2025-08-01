import React from 'react';
import './ImageViewerModal.css';

const ImageViewerModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="image-viewer-modal-overlay" onClick={onClose}>
      <div className="image-viewer-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-viewer-modal-close" onClick={onClose}>&times;</button>
        <img src={imageUrl} alt="Product" className="image-viewer-modal-image" />
      </div>
    </div>
  );
};

export default ImageViewerModal;