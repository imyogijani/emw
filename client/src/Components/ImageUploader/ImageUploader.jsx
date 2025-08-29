import React, { useState, useCallback } from 'react';
import { LazyImage } from '../utils/ImageHelper';

export const ImageUploader = ({
  onUpload,
  maxFiles = 5,
  accept = 'image/*',
  className = '',
  preview = true
}) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file count
    if (selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file types
    const invalidFiles = selectedFiles.filter(
      file => !file.type.startsWith('image/')
    );
    if (invalidFiles.length > 0) {
      setError('Only image files are allowed');
      return;
    }

    setFiles(selectedFiles);
    setError(null);

    // Generate previews
    if (preview) {
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => {
        // Revoke old preview URLs to prevent memory leaks
        prev.forEach(URL.revokeObjectURL);
        return newPreviews;
      });
    }
  }, [maxFiles, preview]);

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const result = await onUpload(formData);
      setFiles([]);
      setPreviews([]);

      return result;
    } catch (err) {
      setError(err.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Validate files
    if (droppedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const invalidFiles = droppedFiles.filter(
      file => !file.type.startsWith('image/')
    );
    if (invalidFiles.length > 0) {
      setError('Only image files are allowed');
      return;
    }

    setFiles(droppedFiles);
    setError(null);

    // Generate previews
    if (preview) {
      const newPreviews = droppedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => {
        prev.forEach(URL.revokeObjectURL);
        return newPreviews;
      });
    }
  }, [maxFiles, preview]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <div className={`image-uploader ${className}`}>
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          className="file-input"
          disabled={uploading}
        />
        <div className="upload-instructions">
          {uploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <span>Drag and drop images here or click to select</span>
              <small>Maximum {maxFiles} files. JPG, PNG or WebP</small>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {preview && previews.length > 0 && (
        <div className="preview-container">
          {previews.map((preview, index) => (
            <div key={preview} className="preview-item">
              <LazyImage
                src={preview}
                alt={`Preview ${index + 1}`}
                className="preview-image"
              />
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload Images'}
        </button>
      )}
    </div>
  );
};

// Styles for the ImageUploader component
const styles = `
.image-uploader {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.drop-zone:hover {
  border-color: #666;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-instructions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-instructions span {
  font-size: 16px;
  color: #666;
}

.upload-instructions small {
  font-size: 12px;
  color: #999;
}

.upload-error {
  color: #dc3545;
  margin-top: 8px;
  font-size: 14px;
}

.preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.upload-button {
  display: block;
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  margin-top: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.upload-button:hover {
  background: #0056b3;
}

.upload-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
`;

// Create and inject styles
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default ImageUploader;
