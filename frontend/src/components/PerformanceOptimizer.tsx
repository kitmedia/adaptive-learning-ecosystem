/**
 * Performance Optimizer Component
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Automatic performance optimization and monitoring
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { resourceHints, applyOptimalHints, applyRouteHints } from '../utils/resourceHints';
import { codeSplitting } from '../utils/codesplitting';
import { usePerformance } from '../hooks/usePerformance';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableAutoOptimization?: boolean;
  enableIntelligentPrefetch?: boolean;
  enablePerformanceMonitoring?: boolean;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  children,
  enableAutoOptimization = true,
  enableIntelligentPrefetch = true,
  enablePerformanceMonitoring = true
}) => {
  const location = useLocation();
  const { measureTask } = usePerformance();
  const lastRoute = useRef<string>('');
  const routeChangeCount = useRef<number>(0);
  const userBehavior = useRef<{
    visitedRoutes: string[];
    routeFrequency: Record<string, number>;
    sessionStartTime: number;
  }>({
    visitedRoutes: [],
    routeFrequency: {},
    sessionStartTime: Date.now()
  });

  // Track user behavior for intelligent optimization
  const trackUserBehavior = useCallback((route: string) => {
    const behavior = userBehavior.current;
    
    if (!behavior.visitedRoutes.includes(route)) {
      behavior.visitedRoutes.push(route);
    }
    
    behavior.routeFrequency[route] = (behavior.routeFrequency[route] || 0) + 1;
    
    // Send behavior analytics
    if (enablePerformanceMonitoring && 'gtag' in window) {
      (window as any).gtag('event', 'route_visit', {
        route: route,
        visit_count: behavior.routeFrequency[route],
        total_routes_visited: behavior.visitedRoutes.length,
        session_duration: Date.now() - behavior.sessionStartTime
      });
    }
  }, [enablePerformanceMonitoring]);

  // Initialize performance optimizations
  useEffect(() => {
    if (!enableAutoOptimization) return;

    measureTask('performance-initialization', () => {
      // Apply optimal resource hints
      applyOptimalHints();
      
      // Initialize code splitting preloading
      codeSplitting.preloadByRoute(location.pathname);
      
      console.log('🚀 Performance Optimizer initialized');
    });
  }, [enableAutoOptimization, measureTask, location.pathname]);

  // Handle route changes
  useEffect(() => {
    const currentRoute = location.pathname;
    
    if (lastRoute.current !== currentRoute) {
      routeChangeCount.current++;
      
      measureTask('route-change-optimization', () => {
        // Track user behavior
        trackUserBehavior(currentRoute);
        
        if (enableIntelligentPrefetch) {
          // Apply route-specific hints
          applyRouteHints(currentRoute);
          
          // Preload likely next chunks
          codeSplitting.preloadByRoute(currentRoute);
          
          // Apply intelligent prefetching based on user behavior
          applyIntelligentPrefetch(currentRoute);
        }
        
        console.log(`📊 Route optimized: ${currentRoute} (visit #${routeChangeCount.current})`);
      });
      
      lastRoute.current = currentRoute;
    }
  }, [location.pathname, enableIntelligentPrefetch, trackUserBehavior, measureTask]);

  // Intelligent prefetch based on user patterns
  const applyIntelligentPrefetch = useCallback((currentRoute: string) => {
    const behavior = userBehavior.current;
    
    // Get most frequently visited routes
    const frequentRoutes = Object.entries(behavior.routeFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([route]) => route);
    
    // Prefetch frequent routes that aren't current
    frequentRoutes
      .filter(route => route !== currentRoute)
      .forEach(route => {
        resourceHints.prefetch(route);
      });
    
    // Pattern-based predictions
    const routePatterns: Record<string, string[]> = {
      '/': ['/auth/login', '/auth/register', '/dashboard'],
      '/auth/login': ['/dashboard', '/auth/forgot-password'],
      '/auth/register': ['/dashboard', '/auth/verify'],
      '/dashboard': ['/analytics', '/courses', '/settings', '/profile'],
      '/courses': ['/courses/[id]', '/dashboard'],
      '/analytics': ['/dashboard', '/reports'],
      '/settings': ['/profile', '/billing', '/dashboard']
    };
    
    const predictedRoutes = routePatterns[currentRoute] || [];
    predictedRoutes.forEach(route => {
      resourceHints.prefetch(route);
    });
    
    // Time-based prefetching (prefetch likely next pages after user stays for a while)
    setTimeout(() => {
      if (location.pathname === currentRoute) {
        predictedRoutes.slice(0, 2).forEach(route => {
          resourceHints.prefetch(route);
        });
      }
    }, 3000);
  }, [location.pathname]);

  // Cleanup old performance data periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (enableAutoOptimization) {
        codeSplitting.cleanupOldChunks();
        console.log('🧹 Performance cleanup completed');
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [enableAutoOptimization]);

  // Connection-aware optimizations
  useEffect(() => {
    if (!enableAutoOptimization) return;

    const handleConnectionChange = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection?.effectiveType;
        const saveData = connection?.saveData;

        console.log(`📡 Connection changed: ${effectiveType}, saveData: ${saveData}`);

        if (saveData || effectiveType === '2g' || effectiveType === 'slow-2g') {
          // Reduce aggressive optimizations on slow connections
          console.log('🐌 Reducing optimizations for slow connection');
        } else if (effectiveType === '4g') {
          // Apply aggressive optimizations on fast connections
          console.log('🚀 Applying aggressive optimizations for fast connection');
          applyRouteHints(location.pathname);
        }
      }
    };

    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', handleConnectionChange);
      
      return () => {
        (navigator as any).connection?.removeEventListener('change', handleConnectionChange);
      };
    }
  }, [enableAutoOptimization, location.pathname]);

  // Visibility API optimizations
  useEffect(() => {
    if (!enableAutoOptimization) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce resource usage
        console.log('👁️ Page hidden, reducing optimizations');
      } else {
        // Page is visible, resume optimizations
        console.log('👁️ Page visible, resuming optimizations');
        applyRouteHints(location.pathname);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableAutoOptimization, location.pathname]);

  // Memory pressure handling
  useEffect(() => {
    if (!enableAutoOptimization) return;

    const handleMemoryWarning = () => {
      console.log('⚠️ Memory pressure detected, cleaning up');
      codeSplitting.cleanupOldChunks(5 * 60 * 1000); // Cleanup chunks older than 5 minutes
      
      // Clear some resource hints
      resourceHints.clearHints();
    };

    // Monitor memory usage
    const memoryCheckInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
        
        if (usedMB > limitMB * 0.8) {
          handleMemoryWarning();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(memoryCheckInterval);
  }, [enableAutoOptimization]);

  return <>{children}</>;
};

export default PerformanceOptimizer;