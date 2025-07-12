/**
 * Advanced Code Splitting Utilities
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Intelligent component loading with error handling and performance monitoring
 */

import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { resourceHints } from './resourceHints';

interface LoadingOptions {
  timeout?: number;
  retries?: number;
  fallback?: ComponentType;
  preload?: boolean;
  priority?: 'high' | 'low';
}

interface ChunkInfo {
  name: string;
  size?: number;
  loadTime?: number;
  loadCount: number;
  errorCount: number;
  lastLoaded?: number;
}

class CodeSplittingManager {
  private static instance: CodeSplittingManager;
  private chunkRegistry = new Map<string, ChunkInfo>();
  private preloadQueue = new Set<string>();

  private constructor() {}

  static getInstance(): CodeSplittingManager {
    if (!CodeSplittingManager.instance) {
      CodeSplittingManager.instance = new CodeSplittingManager();
    }
    return CodeSplittingManager.instance;
  }

  /**
   * Enhanced lazy loading with retry logic and monitoring
   */
  lazyWithRetry<T extends ComponentType<any>>(
    importFunction: () => Promise<{ default: T }>,
    chunkName: string,
    options: LoadingOptions = {}
  ): LazyExoticComponent<T> {
    const { timeout = 30000, retries = 3, preload = false } = options;

    // Register chunk in registry
    if (!this.chunkRegistry.has(chunkName)) {
      this.chunkRegistry.set(chunkName, {
        name: chunkName,
        loadCount: 0,
        errorCount: 0
      });
    }

    const loadWithRetry = async (attempt = 1): Promise<{ default: T }> => {
      const startTime = performance.now();
      const chunkInfo = this.chunkRegistry.get(chunkName)!;

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout loading ${chunkName}`)), timeout);
        });

        const module = await Promise.race([importFunction(), timeoutPromise]);
        
        const loadTime = performance.now() - startTime;
        
        // Update metrics
        chunkInfo.loadCount++;
        chunkInfo.loadTime = loadTime;
        chunkInfo.lastLoaded = Date.now();

        console.log(`📦 Chunk loaded: ${chunkName} (${loadTime.toFixed(2)}ms, attempt ${attempt})`);

        // Send performance metrics
        if ('gtag' in window) {
          (window as any).gtag('event', 'chunk_load', {
            chunk_name: chunkName,
            load_time: loadTime,
            attempt: attempt,
            success: true
          });
        }

        return module;
      } catch (error) {
        chunkInfo.errorCount++;
        
        console.warn(`❌ Chunk load failed: ${chunkName} (attempt ${attempt})`, error);

        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return loadWithRetry(attempt + 1);
        }

        // Send error metrics
        if ('gtag' in window) {
          (window as any).gtag('event', 'chunk_load_error', {
            chunk_name: chunkName,
            attempt: attempt,
            error_message: (error as Error).message
          });
        }

        throw new Error(`Failed to load chunk ${chunkName} after ${retries} attempts: ${(error as Error).message}`);
      }
    };

    const component = lazy(() => loadWithRetry());

    // Preload if requested
    if (preload) {
      this.preloadChunk(chunkName, importFunction);
    }

    return component;
  }

  /**
   * Preload chunk without rendering
   */
  async preloadChunk<T>(
    chunkName: string, 
    importFunction: () => Promise<{ default: T }>
  ): Promise<void> {
    if (this.preloadQueue.has(chunkName)) {
      return;
    }

    this.preloadQueue.add(chunkName);

    try {
      console.log(`🔮 Preloading chunk: ${chunkName}`);
      await importFunction();
      console.log(`✅ Chunk preloaded: ${chunkName}`);
    } catch (error) {
      console.warn(`❌ Chunk preload failed: ${chunkName}`, error);
    } finally {
      this.preloadQueue.delete(chunkName);
    }
  }

  /**
   * Get chunk performance metrics
   */
  getChunkMetrics(): Record<string, ChunkInfo> {
    const metrics: Record<string, ChunkInfo> = {};
    this.chunkRegistry.forEach((info, name) => {
      metrics[name] = { ...info };
    });
    return metrics;
  }

  /**
   * Intelligent preloading based on route predictions
   */
  preloadByRoute(currentRoute: string): void {
    const preloadMap: Record<string, string[]> = {
      '/': ['auth', 'dashboard-preview'],
      '/auth/login': ['dashboard', 'user-profile'],
      '/dashboard': ['analytics', 'courses', 'settings'],
      '/courses': ['course-player', 'exercises'],
      '/analytics': ['charts', 'reports'],
      '/settings': ['profile', 'billing', 'preferences']
    };

    const chunksToPreload = preloadMap[currentRoute] || [];
    
    chunksToPreload.forEach(chunkName => {
      // Use requestIdleCallback for non-critical preloading
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.preloadByName(chunkName);
        });
      } else {
        setTimeout(() => this.preloadByName(chunkName), 100);
      }
    });
  }

  /**
   * Preload chunk by name (if registered)
   */
  private preloadByName(chunkName: string): void {
    // This would need to be connected to your chunk import functions
    // For now, we'll use module preload hints
    resourceHints.modulePreload(`/chunks/${chunkName}.js`);
  }

  /**
   * Clean up old chunks from memory (useful for long-running apps)
   */
  cleanupOldChunks(maxAge: number = 30 * 60 * 1000): void {
    const now = Date.now();
    const chunksToRemove: string[] = [];

    this.chunkRegistry.forEach((info, name) => {
      if (info.lastLoaded && (now - info.lastLoaded) > maxAge) {
        chunksToRemove.push(name);
      }
    });

    chunksToRemove.forEach(name => {
      this.chunkRegistry.delete(name);
      console.log(`🧹 Cleaned up old chunk: ${name}`);
    });
  }
}

// Export singleton instance
export const codeSplitting = CodeSplittingManager.getInstance();

// Utility function for creating lazy components with sensible defaults
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  chunkName: string,
  options?: LoadingOptions
) => {
  return codeSplitting.lazyWithRetry(importFunction, chunkName, {
    timeout: 15000,
    retries: 2,
    ...options
  });
};

// Predefined lazy components for common use cases
export const LazyComponents = {
  // Analytics
  BusinessIntelligenceDashboard: createLazyComponent(
    () => import('../components/Analytics/BusinessIntelligenceDashboard'),
    'analytics-dashboard'
  ),

  // Performance Monitor (development only)
  PerformanceMonitor: createLazyComponent(
    () => import('../components/PerformanceMonitor'),
    'performance-monitor'
  ),

  // GDPR Components
  CookieConsent: createLazyComponent(
    () => import('../components/gdpr/CookieConsent'),
    'gdpr-cookies',
    { priority: 'high' }
  ),

  UserRightsManager: createLazyComponent(
    () => import('../components/gdpr/UserRightsManager'),
    'gdpr-rights'
  ),

  // Privacy Policy (lazy loaded when needed)
  PrivacyPolicy: createLazyComponent(
    () => import('../pages/PrivacyPolicy'),
    'privacy-policy'
  ),

  // Error Boundaries
  ErrorBoundary: createLazyComponent(
    () => import('../components/ErrorBoundary'),
    'error-boundary',
    { priority: 'high' }
  )
};

// Hook for using code splitting metrics in components
export const useCodeSplittingMetrics = () => {
  return {
    getMetrics: () => codeSplitting.getChunkMetrics(),
    preloadByRoute: (route: string) => codeSplitting.preloadByRoute(route),
    cleanup: () => codeSplitting.cleanupOldChunks()
  };
};

export default codeSplitting;