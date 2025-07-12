/**
 * Monitoring Hook
 * Adaptive Learning Ecosystem - EbroValley Digital
 * React hook for integrating monitoring and logging
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { monitoringService } from '../services/monitoring.service';
import { logger } from '../services/logger.service';

interface UseMonitoringOptions {
  enableAutoTracking?: boolean;
  trackUserActions?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
}

interface MonitoringHookResult {
  // Metrics
  metrics: ReturnType<typeof monitoringService.getMetrics>;
  alerts: ReturnType<typeof monitoringService.getAlerts>;
  
  // Actions
  trackEvent: (category: string, action: string, context?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (metric: string, value: number, context?: Record<string, any>) => void;
  trackUserAction: (action: string, context?: Record<string, any>) => void;
  trackFeatureUsage: (feature: string) => void;
  trackConversion: () => void;
  
  // Logging
  log: {
    debug: (message: string, context?: Record<string, any>) => void;
    info: (message: string, context?: Record<string, any>) => void;
    warn: (message: string, context?: Record<string, any>) => void;
    error: (message: string, context?: Record<string, any>, error?: Error) => void;
    critical: (message: string, context?: Record<string, any>, error?: Error) => void;
  };
  
  // State
  isHealthy: boolean;
  hasAlerts: boolean;
  sessionId: string;
}

export const useMonitoring = (options: UseMonitoringOptions = {}): MonitoringHookResult => {
  const {
    enableAutoTracking = true,
    trackUserActions = true,
    trackPerformance = true,
    trackErrors = true,
    logLevel = 'info'
  } = options;

  const [metrics, setMetrics] = useState(monitoringService.getMetrics());
  const [alerts, setAlerts] = useState(monitoringService.getAlerts());
  const componentName = useRef<string>('unknown');
  const mountTime = useRef<number>(Date.now());
  const interactionCount = useRef<number>(0);

  // Get component name from stack trace
  useEffect(() => {
    const stack = new Error().stack;
    if (stack) {
      const match = stack.match(/at (\w+)/);
      if (match && match[1] !== 'useMonitoring') {
        componentName.current = match[1];
      }
    }
  }, []);

  // Set up monitoring subscription
  useEffect(() => {
    const unsubscribe = monitoringService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setAlerts(monitoringService.getAlerts());
    });

    return unsubscribe;
  }, []);

  // Auto-track component lifecycle
  useEffect(() => {
    if (!enableAutoTracking) return;

    const startTime = Date.now();
    
    logger.debug('system', `Component ${componentName.current} mounted`, {
      component: componentName.current,
      mountTime: startTime
    });

    // Track component performance
    if (trackPerformance) {
      setTimeout(() => {
        const renderTime = Date.now() - startTime;
        monitoringService.updateMetric('renderTime', renderTime);
        logger.info('performance', `Component ${componentName.current} render time`, {
          component: componentName.current,
          renderTime
        });
      }, 100);
    }

    return () => {
      const sessionDuration = Date.now() - mountTime.current;
      
      logger.debug('system', `Component ${componentName.current} unmounted`, {
        component: componentName.current,
        sessionDuration,
        interactions: interactionCount.current
      });

      if (trackPerformance) {
        logger.info('performance', `Component ${componentName.current} session metrics`, {
          component: componentName.current,
          sessionDuration,
          interactions: interactionCount.current,
          interactionsPerMinute: (interactionCount.current / (sessionDuration / 60000))
        });
      }
    };
  }, [enableAutoTracking, trackPerformance]);

  // Auto-track user interactions
  useEffect(() => {
    if (!trackUserActions) return;

    const handleUserInteraction = (event: Event) => {
      interactionCount.current++;
      
      const target = event.target as HTMLElement;
      const elementType = target.tagName.toLowerCase();
      const elementId = target.id;
      const elementClass = target.className;

      logger.debug('user', `User interaction: ${event.type}`, {
        component: componentName.current,
        eventType: event.type,
        elementType,
        elementId,
        elementClass,
        timestamp: Date.now()
      });

      // Track specific interaction types
      if (event.type === 'click') {
        monitoringService.trackFeatureUsage(`click_${elementType}`);
      }
    };

    const events = ['click', 'submit', 'change', 'focus', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction, true);
      });
    };
  }, [trackUserActions]);

  // Auto-track errors
  useEffect(() => {
    if (!trackErrors) return;

    const handleError = (event: ErrorEvent) => {
      logger.error('system', `JavaScript error in component ${componentName.current}`, {
        component: componentName.current,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, event.error);

      monitoringService.updateMetric('errorRate', metrics.errorRate + 1);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('system', `Unhandled promise rejection in component ${componentName.current}`, {
        component: componentName.current,
        reason: event.reason
      });

      monitoringService.updateMetric('errorRate', metrics.errorRate + 1);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackErrors, metrics.errorRate]);

  // Tracking functions
  const trackEvent = useCallback((category: string, action: string, context?: Record<string, any>) => {
    logger.info('user', `Event: ${category}/${action}`, {
      component: componentName.current,
      category,
      action,
      ...context
    });

    monitoringService.trackFeatureUsage(`${category}_${action}`);
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    logger.error('system', `Error in component ${componentName.current}`, {
      component: componentName.current,
      message: error.message,
      stack: error.stack,
      ...context
    }, error);

    monitoringService.updateMetric('errorRate', metrics.errorRate + 1);
  }, [metrics.errorRate]);

  const trackPerformanceMetric = useCallback((metric: string, value: number, context?: Record<string, any>) => {
    logger.info('performance', `Performance metric: ${metric}`, {
      component: componentName.current,
      metric,
      value,
      ...context
    });

    monitoringService.updateMetric(metric as any, value);
  }, []);

  const trackUserAction = useCallback((action: string, context?: Record<string, any>) => {
    interactionCount.current++;
    
    logger.info('user', `User action: ${action}`, {
      component: componentName.current,
      action,
      interactionCount: interactionCount.current,
      ...context
    });

    monitoringService.trackFeatureUsage(action);
  }, []);

  const trackFeatureUsage = useCallback((feature: string) => {
    logger.info('business', `Feature used: ${feature}`, {
      component: componentName.current,
      feature
    });

    monitoringService.trackFeatureUsage(feature);
  }, []);

  const trackConversion = useCallback(() => {
    logger.info('business', 'Conversion tracked', {
      component: componentName.current,
      timestamp: Date.now()
    });

    monitoringService.trackConversion();
  }, []);

  // Logging functions with component context
  const logFunctions = {
    debug: useCallback((message: string, context?: Record<string, any>) => {
      logger.debug('system', message, {
        component: componentName.current,
        ...context
      });
    }, []),

    info: useCallback((message: string, context?: Record<string, any>) => {
      logger.info('system', message, {
        component: componentName.current,
        ...context
      });
    }, []),

    warn: useCallback((message: string, context?: Record<string, any>) => {
      logger.warn('system', message, {
        component: componentName.current,
        ...context
      });
    }, []),

    error: useCallback((message: string, context?: Record<string, any>, error?: Error) => {
      logger.error('system', message, {
        component: componentName.current,
        ...context
      }, error);
    }, []),

    critical: useCallback((message: string, context?: Record<string, any>, error?: Error) => {
      logger.critical('system', message, {
        component: componentName.current,
        ...context
      }, error);
    }, [])
  };

  // Computed state
  const isHealthy = alerts.filter(a => !a.resolved && (a.type === 'error' || a.type === 'critical')).length === 0;
  const hasAlerts = alerts.filter(a => !a.resolved).length > 0;
  const sessionId = logger.getSessionId();

  return {
    metrics,
    alerts,
    trackEvent,
    trackError,
    trackPerformance: trackPerformanceMetric,
    trackUserAction,
    trackFeatureUsage,
    trackConversion,
    log: logFunctions,
    isHealthy,
    hasAlerts,
    sessionId
  };
};

export default useMonitoring;