/**
 * Performance Monitoring Hook
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Real-time performance tracking and optimization
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Custom metrics
  loadTime: number | null;
  domReady: number | null;
  resourceLoadTime: number | null;
  memoryUsage: number | null;
  connectionType: string | null;
  
  // Performance budget alerts
  budgetViolations: string[];
}

interface PerformanceBudget {
  fcp: number; // < 1.8s
  lcp: number; // < 2.5s
  fid: number; // < 100ms
  cls: number; // < 0.1
  bundleSize: number; // < 1MB
  loadTime: number; // < 3s
}

const DEFAULT_BUDGET: PerformanceBudget = {
  fcp: 1800,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  bundleSize: 1024 * 1024, // 1MB
  loadTime: 3000
};

export const usePerformance = (budget: Partial<PerformanceBudget> = {}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    loadTime: null,
    domReady: null,
    resourceLoadTime: null,
    memoryUsage: null,
    connectionType: null,
    budgetViolations: []
  });

  const performanceBudget = { ...DEFAULT_BUDGET, ...budget };
  const observer = useRef<PerformanceObserver | null>(null);
  const navigationStartTime = useRef<number>(performance.timeOrigin);

  // Get navigation timing
  const getNavigationMetrics = useCallback(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        return {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          resourceLoadTime: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
        };
      }
    }
    return null;
  }, []);

  // Get memory usage
  const getMemoryMetrics = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }, []);

  // Get connection information
  const getConnectionInfo = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }, []);

  // Check performance budget violations
  const checkBudgetViolations = useCallback((currentMetrics: PerformanceMetrics) => {
    const violations: string[] = [];

    if (currentMetrics.fcp && currentMetrics.fcp > performanceBudget.fcp) {
      violations.push(`FCP: ${currentMetrics.fcp}ms > ${performanceBudget.fcp}ms`);
    }

    if (currentMetrics.lcp && currentMetrics.lcp > performanceBudget.lcp) {
      violations.push(`LCP: ${currentMetrics.lcp}ms > ${performanceBudget.lcp}ms`);
    }

    if (currentMetrics.fid && currentMetrics.fid > performanceBudget.fid) {
      violations.push(`FID: ${currentMetrics.fid}ms > ${performanceBudget.fid}ms`);
    }

    if (currentMetrics.cls && currentMetrics.cls > performanceBudget.cls) {
      violations.push(`CLS: ${currentMetrics.cls} > ${performanceBudget.cls}`);
    }

    if (currentMetrics.loadTime && currentMetrics.loadTime > performanceBudget.loadTime) {
      violations.push(`Load Time: ${currentMetrics.loadTime}ms > ${performanceBudget.loadTime}ms`);
    }

    return violations;
  }, [performanceBudget]);

  // Send metrics to analytics
  const sendMetrics = useCallback((metricsData: PerformanceMetrics) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // Send to Google Analytics
      (window as any).gtag('event', 'performance_metrics', {
        fcp: metricsData.fcp,
        lcp: metricsData.lcp,
        fid: metricsData.fid,
        cls: metricsData.cls,
        load_time: metricsData.loadTime,
        memory_usage: metricsData.memoryUsage,
        connection_type: metricsData.connectionType,
        budget_violations: metricsData.budgetViolations.length
      });
    }

    // Send to custom analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...metricsData,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(error => {
        console.warn('Failed to send performance metrics:', error);
      });
    }
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    let currentMetrics = { ...metrics };

    // Observe paint entries (FCP)
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          currentMetrics.fcp = entry.startTime;
        }
      }
    });

    // Observe LCP entries
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      currentMetrics.lcp = lastEntry.startTime;
    });

    // Observe layout shift entries (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          currentMetrics.cls = clsValue;
        }
      }
    });

    // Observe input delay entries (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        currentMetrics.fid = (entry as any).processingStart - entry.startTime;
      }
    });

    try {
      paintObserver.observe({ entryTypes: ['paint'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('Error setting up performance observers:', error);
    }

    // Get initial navigation metrics
    const initialNavMetrics = getNavigationMetrics();
    if (initialNavMetrics) {
      currentMetrics = { ...currentMetrics, ...initialNavMetrics };
    }

    // Get memory and connection info
    const memoryInfo = getMemoryMetrics();
    if (memoryInfo) {
      currentMetrics.memoryUsage = memoryInfo.used;
    }

    const connectionInfo = getConnectionInfo();
    if (connectionInfo) {
      currentMetrics.connectionType = connectionInfo.effectiveType;
    }

    // Update metrics after a delay to allow all measurements
    const timeout = setTimeout(() => {
      const violations = checkBudgetViolations(currentMetrics);
      currentMetrics.budgetViolations = violations;

      setMetrics(currentMetrics);
      sendMetrics(currentMetrics);

      // Log budget violations in development
      if (process.env.NODE_ENV === 'development' && violations.length > 0) {
        console.warn('⚠️ Performance Budget Violations:', violations);
      }
    }, 2000);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      paintObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
    };
  }, [getNavigationMetrics, getMemoryMetrics, getConnectionInfo, checkBudgetViolations, sendMetrics]);

  // Monitor resource loading
  const trackResourceLoad = useCallback((resourceUrl: string, startTime: number) => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Resource loaded: ${resourceUrl} (${loadTime.toFixed(2)}ms)`);
    }

    // Track slow resources
    if (loadTime > 1000) {
      console.warn(`🐌 Slow resource detected: ${resourceUrl} (${loadTime.toFixed(2)}ms)`);
    }

    return loadTime;
  }, []);

  // Manual performance measurement
  const measureTask = useCallback((taskName: string, task: () => void | Promise<void>) => {
    const startTime = performance.now();
    
    const measure = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ Task "${taskName}": ${duration.toFixed(2)}ms`);
      }
      
      // Mark as performance entry
      performance.mark(`${taskName}-end`);
      performance.measure(taskName, `${taskName}-start`, `${taskName}-end`);
      
      return duration;
    };

    performance.mark(`${taskName}-start`);

    if (task instanceof Promise) {
      return task.then(measure).catch((error) => {
        measure();
        throw error;
      });
    } else {
      task();
      return measure();
    }
  }, []);

  // Get performance score
  const getPerformanceScore = useCallback(() => {
    let score = 100;
    let factors = 0;

    if (metrics.fcp) {
      factors++;
      if (metrics.fcp > performanceBudget.fcp) {
        score -= 20;
      } else if (metrics.fcp > performanceBudget.fcp * 0.8) {
        score -= 10;
      }
    }

    if (metrics.lcp) {
      factors++;
      if (metrics.lcp > performanceBudget.lcp) {
        score -= 25;
      } else if (metrics.lcp > performanceBudget.lcp * 0.8) {
        score -= 10;
      }
    }

    if (metrics.fid) {
      factors++;
      if (metrics.fid > performanceBudget.fid) {
        score -= 20;
      } else if (metrics.fid > performanceBudget.fid * 0.8) {
        score -= 10;
      }
    }

    if (metrics.cls) {
      factors++;
      if (metrics.cls > performanceBudget.cls) {
        score -= 15;
      } else if (metrics.cls > performanceBudget.cls * 0.8) {
        score -= 5;
      }
    }

    return Math.max(0, score);
  }, [metrics, performanceBudget]);

  return {
    metrics,
    performanceScore: getPerformanceScore(),
    trackResourceLoad,
    measureTask,
    isGood: metrics.budgetViolations.length === 0,
    hasViolations: metrics.budgetViolations.length > 0,
    budget: performanceBudget
  };
};