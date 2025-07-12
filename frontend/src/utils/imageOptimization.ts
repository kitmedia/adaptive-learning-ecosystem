/**
 * Image Optimization Pipeline
 * Advanced image loading, processing and optimization utilities
 * EbroValley Digital - Performance Excellence
 */

export interface ImageOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  width?: number;
  height?: number;
  lazy?: boolean;
  blur?: boolean;
  placeholder?: 'blur' | 'empty' | 'color';
  backgroundColor?: string;
  sizes?: string;
  priority?: boolean;
}

export interface OptimizedImage {
  src: string;
  srcSet: string;
  sizes: string;
  placeholder?: string;
  width?: number;
  height?: number;
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private cache = new Map<string, OptimizedImage>();
  private observers = new Map<string, IntersectionObserver>();
  private supportedFormats = new Set<string>();

  private constructor() {
    this.detectSupportedFormats();
  }

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  /**
   * Detect browser support for modern image formats
   */
  private async detectSupportedFormats(): Promise<void> {
    const formats = ['webp', 'avif', 'jpeg2000'];
    
    for (const format of formats) {
      const isSupported = await this.canUseFormat(format);
      if (isSupported) {
        this.supportedFormats.add(format);
      }
    }
  }

  /**
   * Check if browser supports specific image format
   */
  private canUseFormat(format: string): Promise<boolean> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      try {
        const dataURL = canvas.toDataURL(`image/${format}`);
        const img = new Image();
        
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = dataURL;
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Generate optimized image with responsive sources
   */
  generateOptimizedImage(
    src: string, 
    options: ImageOptions = {}
  ): OptimizedImage {
    const {
      quality = 85,
      format = 'auto',
      width,
      height,
      lazy = true,
      blur = false,
      placeholder = 'blur',
      backgroundColor = '#f3f4f6',
      sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      priority = false
    } = options;

    const cacheKey = `${src}-${JSON.stringify(options)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Determine best format
    const targetFormat = this.getBestFormat(format);
    
    // Generate responsive breakpoints
    const breakpoints = width ? 
      this.generateBreakpoints(width) : 
      [320, 640, 768, 1024, 1280, 1920];

    // Generate srcSet
    const srcSet = breakpoints
      .map(bp => `${this.optimizeImageUrl(src, { 
        width: bp, 
        height: height ? Math.round((height / (width || bp)) * bp) : undefined,
        quality,
        format: targetFormat 
      })} ${bp}w`)
      .join(', ');

    // Generate optimized main src
    const optimizedSrc = this.optimizeImageUrl(src, {
      width: width || 800,
      height,
      quality,
      format: targetFormat
    });

    // Generate placeholder if needed
    let placeholderSrc: string | undefined;
    if (placeholder === 'blur') {
      placeholderSrc = this.generateBlurPlaceholder(src, backgroundColor);
    } else if (placeholder === 'color') {
      placeholderSrc = this.generateColorPlaceholder(width || 800, height || 600, backgroundColor);
    }

    const result: OptimizedImage = {
      src: optimizedSrc,
      srcSet,
      sizes,
      placeholder: placeholderSrc,
      width,
      height
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get best supported format
   */
  private getBestFormat(requestedFormat: string): string {
    if (requestedFormat !== 'auto') {
      return requestedFormat;
    }

    // Priority: AVIF > WebP > JPEG
    if (this.supportedFormats.has('avif')) return 'avif';
    if (this.supportedFormats.has('webp')) return 'webp';
    return 'jpeg';
  }

  /**
   * Generate responsive breakpoints
   */
  private generateBreakpoints(maxWidth: number): number[] {
    const baseBreakpoints = [320, 640, 768, 1024, 1280, 1920];
    return baseBreakpoints.filter(bp => bp <= maxWidth * 1.2); // 20% larger for retina
  }

  /**
   * Optimize image URL with parameters
   */
  private optimizeImageUrl(
    src: string, 
    params: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    }
  ): string {
    // For external CDN services (Cloudinary, ImageKit, etc.)
    if (src.includes('cloudinary.com')) {
      return this.optimizeCloudinary(src, params);
    }
    
    if (src.includes('imagekit.io')) {
      return this.optimizeImageKit(src, params);
    }

    // For local images, return as-is (would be handled by build process)
    return src;
  }

  /**
   * Optimize for Cloudinary
   */
  private optimizeCloudinary(
    src: string, 
    params: { width?: number; height?: number; quality?: number; format?: string }
  ): string {
    const transformations: string[] = [];
    
    if (params.width) transformations.push(`w_${params.width}`);
    if (params.height) transformations.push(`h_${params.height}`);
    if (params.quality) transformations.push(`q_${params.quality}`);
    if (params.format) transformations.push(`f_${params.format}`);
    
    // Add auto optimization
    transformations.push('c_fill', 'f_auto', 'q_auto');
    
    const transformString = transformations.join(',');
    return src.replace('/upload/', `/upload/${transformString}/`);
  }

  /**
   * Optimize for ImageKit
   */
  private optimizeImageKit(
    src: string, 
    params: { width?: number; height?: number; quality?: number; format?: string }
  ): string {
    const urlParams: string[] = [];
    
    if (params.width) urlParams.push(`w-${params.width}`);
    if (params.height) urlParams.push(`h-${params.height}`);
    if (params.quality) urlParams.push(`q-${params.quality}`);
    if (params.format) urlParams.push(`f-${params.format}`);
    
    const paramString = urlParams.join(',');
    return `${src}?tr=${paramString}`;
  }

  /**
   * Generate blur placeholder using canvas
   */
  private generateBlurPlaceholder(src: string, backgroundColor: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return this.generateColorPlaceholder(40, 30, backgroundColor);
    
    canvas.width = 40;
    canvas.height = 30;
    
    // Fill with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 40, 30);
    
    // Add subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 40, 30);
    gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 40, 30);
    
    return canvas.toDataURL();
  }

  /**
   * Generate solid color placeholder
   */
  private generateColorPlaceholder(width: number, height: number, color: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/></svg>`)}`;
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    return canvas.toDataURL();
  }

  /**
   * Lazy loading implementation with Intersection Observer
   */
  setupLazyLoading(
    img: HTMLImageElement, 
    options: { 
      threshold?: number; 
      rootMargin?: string;
      onLoad?: () => void;
      onError?: () => void;
    } = {}
  ): void {
    const { threshold = 0.1, rootMargin = '50px', onLoad, onError } = options;
    
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without Intersection Observer
      this.loadImage(img, onLoad, onError);
      return;
    }

    const observerId = Math.random().toString(36).substr(2, 9);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target as HTMLImageElement, onLoad, onError);
            observer.unobserve(entry.target);
            this.observers.delete(observerId);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(img);
    this.observers.set(observerId, observer);
  }

  /**
   * Load image with error handling
   */
  private loadImage(
    img: HTMLImageElement, 
    onLoad?: () => void, 
    onError?: () => void
  ): void {
    const dataSrc = img.dataset.src;
    const dataSrcSet = img.dataset.srcset;
    
    if (!dataSrc) return;

    // Create a new image to preload
    const preloadImg = new Image();
    
    preloadImg.onload = () => {
      // Apply the source to the actual img element
      img.src = dataSrc;
      if (dataSrcSet) img.srcset = dataSrcSet;
      
      // Add loaded class for CSS transitions
      img.classList.add('loaded');
      img.classList.remove('loading');
      
      onLoad?.();
    };
    
    preloadImg.onerror = () => {
      img.classList.add('error');
      img.classList.remove('loading');
      onError?.();
    };
    
    // Start loading
    img.classList.add('loading');
    preloadImg.src = dataSrc;
    if (dataSrcSet) preloadImg.srcset = dataSrcSet;
  }

  /**
   * Preload critical images
   */
  preloadImage(src: string, options: ImageOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const optimized = this.generateOptimizedImage(src, options);
      const img = new Image();
      
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = optimized.src;
    });
  }

  /**
   * Batch preload multiple images
   */
  async preloadImages(
    images: Array<{ src: string; options?: ImageOptions }>,
    concurrency = 3
  ): Promise<void> {
    const batches: Array<Array<{ src: string; options?: ImageOptions }>> = [];
    
    for (let i = 0; i < images.length; i += concurrency) {
      batches.push(images.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(({ src, options }) => this.preloadImage(src, options))
      );
    }
  }

  /**
   * Clear cache and observers
   */
  cleanup(): void {
    this.cache.clear();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Global instance
export const imageOptimizer = ImageOptimizer.getInstance();

/**
 * Image optimization utility functions for use without React
 */
export const createOptimizedImageProps = (src: string, options: ImageOptions = {}) => {
  const optimized = imageOptimizer.generateOptimizedImage(src, options);
  const { lazy = true, priority = false } = options;
  
  if (lazy && !priority) {
    return {
      src: optimized.placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'data-src': optimized.src,
      'data-srcset': optimized.srcSet,
      sizes: optimized.sizes,
      className: 'optimized-image loading'
    };
  }

  return {
    src: optimized.src,
    srcSet: optimized.srcSet,
    sizes: optimized.sizes,
    className: 'optimized-image'
  };
};

// CSS for smooth loading transitions
export const imageOptimizationCSS = `
.optimized-image {
  transition: opacity 0.3s ease-in-out;
}

.optimized-image.loading {
  opacity: 0.7;
}

.optimized-image.loaded {
  opacity: 1;
}

.optimized-image.error {
  opacity: 0.5;
  filter: grayscale(100%);
}
`;

// Auto-inject CSS if in browser
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = imageOptimizationCSS;
  document.head.appendChild(styleSheet);
}