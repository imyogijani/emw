import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import './MUICarousel.css';

const MUICarousel = ({
  items = [],
  autoPlay = true,
  autoPlayInterval = 4000,
  showDots = true,
  showArrows = true,
  infinite = true,
  pauseOnHover = true,
  className = '',
  height = '400px',
  renderItem = null,
  onSlideChange = null
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, autoPlayInterval, items.length]);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setCurrentIndex(prevIndex => {
      const newIndex = infinite 
        ? (prevIndex + 1) % items.length
        : Math.min(prevIndex + 1, items.length - 1);
      
      if (onSlideChange) onSlideChange(newIndex);
      return newIndex;
    });
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [infinite, items.length, isTransitioning, onSlideChange]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setCurrentIndex(prevIndex => {
      const newIndex = infinite 
        ? (prevIndex - 1 + items.length) % items.length
        : Math.max(prevIndex - 1, 0);
      
      if (onSlideChange) onSlideChange(newIndex);
      return newIndex;
    });
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [infinite, items.length, isTransitioning, onSlideChange]);

  const goToSlide = useCallback((index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    
    setCurrentIndex(index);
    if (onSlideChange) onSlideChange(index);
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, isTransitioning, onSlideChange]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPlaying(false);
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && autoPlay) setIsPlaying(true);
  };

  // Default item renderer
  const defaultRenderItem = (item, index) => {
    if (typeof item === 'string') {
      return (
        <div className="carousel-slide-content">
          <img 
            src={item} 
            alt={`Slide ${index + 1}`}
            className="carousel-image"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div className="carousel-slide-content">
        {item.image && (
          <img 
            src={item.image} 
            alt={item.title || `Slide ${index + 1}`}
            className="carousel-image"
            loading="lazy"
          />
        )}
        {(item.title || item.description) && (
          <div className="carousel-text-overlay">
            {item.title && <h3 className="carousel-title">{item.title}</h3>}
            {item.description && <p className="carousel-description">{item.description}</p>}
            {item.buttonText && (
              <button 
                className="carousel-cta-button"
                onClick={item.onButtonClick}
              >
                {item.buttonText}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!items || items.length === 0) {
    return (
      <div className={`mui-carousel empty ${className}`} style={{ height }}>
        <div className="carousel-empty-state">
          <p>No items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`mui-carousel ${className}`}
      style={{ height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="carousel-container">
        {/* Main slides */}
        <div className="carousel-slides">
          {items.map((item, index) => (
            <div
              key={index}
              className={`carousel-slide ${
                index === currentIndex ? 'active' : ''
              } ${isTransitioning ? 'transitioning' : ''}`}
              style={{
                transform: `translateX(${(index - currentIndex) * 100}%)`,
                opacity: index === currentIndex ? 1 : 0
              }}
            >
              {renderItem ? renderItem(item, index) : defaultRenderItem(item, index)}
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {showArrows && items.length > 1 && (
          <>
            <button
              className="carousel-arrow carousel-arrow-prev"
              onClick={prevSlide}
              disabled={!infinite && currentIndex === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="carousel-arrow carousel-arrow-next"
              onClick={nextSlide}
              disabled={!infinite && currentIndex === items.length - 1}
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Play/Pause button */}
        {autoPlay && items.length > 1 && (
          <button
            className="carousel-play-pause"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        )}

        {/* Dots indicator */}
        {showDots && items.length > 1 && (
          <div className="carousel-dots">
            {items.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${
                  index === currentIndex ? 'active' : ''
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        {isPlaying && items.length > 1 && (
          <div className="carousel-progress">
            <div 
              className="carousel-progress-bar"
              style={{
                animationDuration: `${autoPlayInterval}ms`,
                animationPlayState: isPlaying ? 'running' : 'paused'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MUICarousel;