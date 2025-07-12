/**
 * Resource Hints Utilities
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Advanced resource loading optimization with preconnect, prefetch, and preload
 */

interface ResourceHintOptions {
  priority?: 'high' | 'low';
  crossOrigin?: 'anonymous' | 'use-credentials';
  media?: string;
  as?: string;
  type?: string;
}

class ResourceHintsManager {
  private static instance: ResourceHintsManager;
  private appliedHints = new Set<string>();

  private constructor() {}

  static getInstance(): ResourceHintsManager {
    if (!ResourceHintsManager.instance) {
      ResourceHintsManager.instance = new ResourceHintsManager();
    }
    return ResourceHintsManager.instance;
  }

  /**
   * Add preconnect hint for external domains
   */
  preconnect(url: string, options: ResourceHintOptions = {}): void {
    const hint = `preconnect-${url}`;
    if (this.appliedHints.has(hint)) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    document.head.appendChild(link);
    this.appliedHints.add(hint);

    console.log(`🔗 Preconnect applied: ${url}`);
  }

  /**
   * Add DNS prefetch for external domains
   */
  dnsPrefetch(url: string): void {
    const hint = `dns-prefetch-${url}`;
    if (this.appliedHints.has(hint)) return;

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;

    document.head.appendChild(link);
    this.appliedHints.add(hint);

    console.log(`🌐 DNS Prefetch applied: ${url}`);
  }

  /**
   * Preload critical resources
   */
  preload(url: string, options: ResourceHintOptions = {}): void {
    const hint = `preload-${url}`;
    if (this.appliedHints.has(hint)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    if (options.as) {
      link.as = options.as;
    }
    
    if (options.type) {
      link.type = options.type;
    }
    
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    if (options.media) {
      link.media = options.media;
    }

    document.head.appendChild(link);
    this.appliedHints.add(hint);

    console.log(`⚡ Preload applied: ${url} (as: ${options.as})`);
  }

  /**
   * Prefetch resources for next navigation
   */
  prefetch(url: string, options: ResourceHintOptions = {}): void {
    const hint = `prefetch-${url}`;
    if (this.appliedHints.has(hint)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    
    if (options.as) {
      link.as = options.as;
    }
    
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    document.head.appendChild(link);
    this.appliedHints.add(hint);

    console.log(`🔮 Prefetch applied: ${url}`);
  }

  /**
   * Preload module for future use
   */
  modulePreload(url: string): void {
    const hint = `modulepreload-${url}`;
    if (this.appliedHints.has(hint)) return;

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = url;

    document.head.appendChild(link);
    this.appliedHints.add(hint);

    console.log(`📦 Module preload applied: ${url}`);
  }

  /**
   * Apply performance-optimized hints for the application
   */
  applyOptimalHints(): void {
    // Preconnect to external services
    this.preconnect('https://fonts.googleapis.com');
    this.preconnect('https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
    this.preconnect('https://api.stripe.com');
    this.preconnect('https://www.google-analytics.com');
    
    // DNS prefetch for less critical external resources
    this.dnsPrefetch('https://api.github.com');
    this.dnsPrefetch('https://cdnjs.cloudflare.com');
    
    // Preload critical CSS and fonts
    this.preload('/fonts/inter-var.woff2', { 
      as: 'font', 
      type: 'font/woff2', 
      crossOrigin: 'anonymous' 
    });

    // Preload hero images
    this.preload('/images/hero-background.webp', { 
      as: 'image',
      media: '(min-width: 768px)'
    });

    // Prefetch likely next pages
    this.prefetch('/dashboard');
    this.prefetch('/profile');
    this.prefetch('/settings');
  }

  /**
   * Apply hints based on user behavior and route
   */
  applyIntelligentHints(currentRoute: string, userBehavior?: any): void {
    // Route-specific optimizations
    switch (currentRoute) {
      case '/':
      case '/home':
        this.prefetch('/auth/login');
        this.prefetch('/auth/register');
        this.preload('/api/features', { as: 'fetch' });
        break;
        
      case '/auth/login':
        this.prefetch('/dashboard');
        this.modulePreload('/chunks/dashboard.js');
        break;
        
      case '/dashboard':
        this.prefetch('/analytics');
        this.prefetch('/courses');
        this.preload('/api/dashboard/summary', { as: 'fetch' });
        break;
        
      case '/analytics':
        this.preload('/api/analytics/realtime', { as: 'fetch' });
        this.modulePreload('/chunks/charts.js');
        break;
    }

    // Behavior-based prefetching
    if (userBehavior?.frequentRoutes) {
      userBehavior.frequentRoutes.forEach((route: string) => {
        this.prefetch(route);
      });
    }
  }

  /**
   * Apply hints based on connection quality
   */
  applyConnectionAwareHints(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      const saveData = connection?.saveData;

      // Skip aggressive prefetching on slow connections or data saver mode
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        console.log('🐌 Slow connection detected, reducing prefetch hints');
        return;
      }

      // Aggressive prefetching on fast connections
      if (effectiveType === '4g') {
        console.log('🚀 Fast connection detected, applying aggressive hints');
        this.prefetch('/api/courses/popular', { as: 'fetch' });
        this.prefetch('/api/user/recommendations', { as: 'fetch' });
        
        // Preload next likely chunks
        this.modulePreload('/chunks/course-player.js');
        this.modulePreload('/chunks/interactive-exercises.js');
      }
    }
  }

  /**
   * Preload critical above-the-fold images
   */
  preloadCriticalImages(images: string[]): void {
    images.forEach((imageUrl, index) => {
      // Only preload first 2-3 images to avoid bandwidth waste
      if (index < 3) {
        this.preload(imageUrl, { as: 'image' });
      }
    });
  }

  /**
   * Get performance metrics for resource hints
   */
  getHintsMetrics(): object {
    return {
      totalHints: this.appliedHints.size,
      appliedHints: Array.from(this.appliedHints),
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      timestamp: Date.now()
    };
  }

  /**
   * Clear all applied hints (useful for testing)
   */
  clearHints(): void {
    this.appliedHints.clear();
    console.log('🧹 Resource hints cleared');
  }
}

// Export singleton instance
export const resourceHints = ResourceHintsManager.getInstance();

// Utility functions for common use cases
export const applyRouteHints = (route: string) => {
  resourceHints.applyIntelligentHints(route);
};

export const applyOptimalHints = () => {
  resourceHints.applyOptimalHints();
  resourceHints.applyConnectionAwareHints();
};

export const preloadCriticalAssets = (assets: string[]) => {
  assets.forEach(asset => {
    if (asset.endsWith('.css')) {
      resourceHints.preload(asset, { as: 'style' });
    } else if (asset.endsWith('.js')) {
      resourceHints.modulePreload(asset);
    } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(asset)) {
      resourceHints.preload(asset, { as: 'image' });
    } else if (/\.(woff2|woff)$/i.test(asset)) {
      resourceHints.preload(asset, { 
        as: 'font', 
        type: asset.endsWith('.woff2') ? 'font/woff2' : 'font/woff',
        crossOrigin: 'anonymous' 
      });
    }
  });
};

export default resourceHints;