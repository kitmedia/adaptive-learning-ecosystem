/**
 * Lazy Loading Image Component
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Optimized image loading with performance monitoring
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: React.ReactNode;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  blurDataURL,
  priority = false,
  quality = 75,
  sizes,
  onLoad,
  onError,
  fallback
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // Generate responsive image sources
  const generateSrcSet = useCallback((baseSrc: string) => {
    const formats = ['webp', 'avif'];
    const sizes = [640, 768, 1024, 1280, 1920];
    
    // For demo purposes, we'll assume the image service supports format conversion
    // In production, you'd integrate with services like Cloudinary, Vercel, or custom image optimization
    return sizes.map(size => {
      const optimizedSrc = baseSrc.includes('?') 
        ? `${baseSrc}&w=${size}&q=${quality}&f=webp`
        : `${baseSrc}?w=${size}&q=${quality}&f=webp`;
      return `${optimizedSrc} ${size}w`;
    }).join(', ');
  }, [quality]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    intersectionObserverRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    
    // Performance tracking
    if (loadStartTime) {
      const loadTime = performance.now() - loadStartTime;
      console.log(`🖼️ Image loaded: ${src} (${loadTime.toFixed(2)}ms)`);
      
      // Send performance data
      if ('gtag' in window) {
        (window as any).gtag('event', 'image_load', {
          image_url: src,
          load_time: loadTime,
          image_size: width && height ? width * height : null
        });
      }
    }
    
    onLoad?.();
  }, [src, loadStartTime, width, height, onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    console.warn(`❌ Failed to load image: ${src}`);
    onError?.();
  }, [src, onError]);

  // Start loading when in view
  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      setLoadStartTime(performance.now());
    }
  }, [isInView, isLoaded, hasError]);

  // Generate placeholder with blur effect
  const blurPlaceholder = blurDataURL || placeholder;
  
  // Calculate aspect ratio for layout stability
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
        paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined
      }}
    >
      {/* Placeholder/Blur background */}
      {blurPlaceholder && !isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
          style={{
            backgroundImage: `url(${blurPlaceholder})`,
            filter: 'blur(20px)',
            transform: 'scale(1.1)' // Prevent blur edge artifacts
          }}
        />
      )}

      {/* Loading state */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          {fallback || (
            <>
              <ImageOff className="h-12 w-12 mb-2" />
              <span className="text-sm">Failed to load image</span>
            </>
          )}
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          srcSet={generateSrcSet(src)}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            transition-opacity duration-300 object-cover w-full h-full
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${aspectRatio ? 'absolute inset-0' : ''}
          `}
          style={{
            colorScheme: 'light dark'
          }}
        />
      )}

      {/* Development overlay */}
      {import.meta.env.DEV && isLoaded && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {width}×{height}
        </div>
      )}
    </div>
  );
};

export default LazyImage;