import { getApiBaseUrl } from './apiConfig';

export class ImageHelper {
  static sizes = {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200
  };

  static getImageUrl(image, size = 'original') {
    if (!image) return null;

    try {
      // If full URL is provided, return as is
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }

      const baseUrl = getApiBaseUrl();

      // If it's an image object with versions
      if (typeof image === 'object' && image.versions) {
        if (size === 'original') {
          return image.url;
        }
        return image.versions[size]?.url || image.url;
      }

      // If it's a path
      if (image.startsWith('/')) {
        return `${baseUrl}${image}`;
      }

      // Default case
      return `${baseUrl}/uploads/${image}`;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return null;
    }
  }

  static getOptimalImageSize(containerWidth) {
    const sizes = Object.entries(this.sizes)
      .sort(([, a], [, b]) => a - b);

    // Find the first size larger than the container
    const optimal = sizes.find(([, size]) => size >= containerWidth);
    return optimal ? optimal[0] : 'large';
  }

  static generateSrcSet(image) {
    if (!image || typeof image !== 'object' || !image.versions) {
      return '';
    }

    return Object.entries(image.versions)
      .map(([, version]) => `${version.url} ${version.width}w`)
      .join(', ');
  }

  static generateSizes(breakpoints = {}) {
    return Object.entries(breakpoints)
      .map(([breakpoint, size]) => `(max-width: ${breakpoint}px) ${size}px`)
      .concat(['100vw'])
      .join(', ');
  }
}

export const LazyImage = ({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  sizes,
  ...props
}) => {
  const imageUrl = ImageHelper.getImageUrl(src);
  const srcSet = ImageHelper.generateSrcSet(src);
  const imageSizes = sizes || ImageHelper.generateSizes({
    640: '100vw',
    768: '50vw',
    1024: '33vw'
  });

  return (
    <img
      src={imageUrl}
      srcSet={srcSet}
      sizes={imageSizes}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      {...props}
    />
  );
};

export default ImageHelper;
