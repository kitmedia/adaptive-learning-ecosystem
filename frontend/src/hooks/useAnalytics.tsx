/**
 * Analytics Hook - Adaptive Learning Ecosystem
 * EbroValley Digital - Event tracking and analytics integration
 * 
 * Comprehensive analytics tracking system for user behavior,
 * learning progress, and business intelligence
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './useAuth';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface AnalyticsEvent {
  user_id: string;
  session_id: string;
  event_type: string;
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
  properties?: Record<string, any>;
  course_id?: string;
  lesson_id?: string;
  assessment_id?: string;
  timestamp?: string;
}

interface AnalyticsConfig {
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  enableDebug: boolean;
  enabledEvents: string[];
}

interface AnalyticsContext {
  sessionId: string;
  userId?: string;
  userRole?: string;
  courseId?: string;
  lessonId?: string;
  assessmentId?: string;
  deviceInfo: {
    userAgent: string;
    screen: string;
    language: string;
    timezone: string;
  };
}

interface LearningEvent {
  action: 'start' | 'progress' | 'complete' | 'pause' | 'resume';
  content_type: 'lesson' | 'assessment' | 'course' | 'quiz';
  content_id: string;
  progress_percentage?: number;
  time_spent_seconds?: number;
  difficulty_level?: string;
  score?: number;
  attempts?: number;
}

interface EngagementEvent {
  action: 'click' | 'hover' | 'scroll' | 'focus' | 'blur' | 'resize';
  element_type: string;
  element_id?: string;
  element_text?: string;
  page_section?: string;
  scroll_depth?: number;
  time_on_element?: number;
}

interface NavigationEvent {
  action: 'page_view' | 'navigation' | 'search' | 'filter' | 'sort';
  page_path: string;
  page_title: string;
  referrer?: string;
  search_query?: string;
  filter_criteria?: Record<string, any>;
  load_time?: number;
}

// =============================================================================
// ANALYTICS HOOK
// =============================================================================

export const useAnalytics = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(true);
  const [context, setContext] = useState<AnalyticsContext | null>(null);
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const flushTimer = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

  // Configuration - memoized to prevent dependency warnings
  const config = useMemo<AnalyticsConfig>(() => ({
    endpoint: process.env.REACT_APP_ANALYTICS_ENDPOINT || 'http://localhost:8004',
    batchSize: 10,
    flushInterval: 5000, // 5 seconds
    maxRetries: 3,
    enableDebug: process.env.NODE_ENV === 'development',
    enabledEvents: [
      'page_view',
      'learning_progress',
      'assessment_completion',
      'user_interaction',
      'navigation',
      'engagement',
      'error',
      'performance'
    ]
  }), []);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  useEffect(() => {
    const initializeAnalytics = async () => {
      // Check user consent (GDPR compliance)
      const consent = localStorage.getItem('analytics_consent');
      if (consent === 'false') {
        setIsEnabled(false);
        return;
      }

      // Generate or retrieve session ID
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }

      // Gather device and browser information
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screen: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Set analytics context
      setContext({
        sessionId,
        userId: user?.id,
        userRole: user?.role,
        deviceInfo
      });

      // Log session start
      if (isEnabled) {
        // We'll manually call trackEvent here to avoid circular dependency
        const event: AnalyticsEvent = {
          user_id: user?.id || 'anonymous',
          session_id: sessionId,
          event_type: 'session',
          event_category: 'system',
          event_action: 'start',
          properties: {
            user_role: user?.role,
            device_info: deviceInfo,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            user_agent: deviceInfo.userAgent,
            screen_resolution: deviceInfo.screen,
            language: deviceInfo.language,
            timezone: deviceInfo.timezone
          },
          timestamp: new Date().toISOString()
        };
        eventQueue.current.push(event);
      }
    };

    initializeAnalytics();

    // Cleanup on unmount
    return () => {
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
      }
      flushEvents();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, isEnabled]); // Only include primitive values to avoid infinite loops

  // =============================================================================
  // CORE TRACKING FUNCTIONS
  // =============================================================================

  const trackEvent = useCallback((event: Partial<AnalyticsEvent>) => {
    if (!isEnabled || !context) return;

    // Check if event type is enabled
    if (!config.enabledEvents.includes(event.event_type || '')) return;

    const fullEvent: AnalyticsEvent = {
      user_id: context.userId || 'anonymous',
      session_id: context.sessionId,
      event_type: event.event_type || 'generic',
      event_category: event.event_category || 'uncategorized',
      event_action: event.event_action || 'unknown',
      event_label: event.event_label,
      event_value: event.event_value,
      properties: {
        ...event.properties,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        user_agent: context.deviceInfo.userAgent,
        screen_resolution: context.deviceInfo.screen,
        language: context.deviceInfo.language,
        timezone: context.deviceInfo.timezone
      },
      course_id: event.course_id || context.courseId,
      lesson_id: event.lesson_id || context.lessonId,
      assessment_id: event.assessment_id || context.assessmentId,
      timestamp: new Date().toISOString()
    };

    // Add to queue
    eventQueue.current.push(fullEvent);

    // Debug logging
    if (config.enableDebug) {
      console.log('Analytics Event:', fullEvent);
    }

    // Flush if queue is full
    if (eventQueue.current.length >= config.batchSize) {
      flushEvents();
    } else {
      // Schedule flush
      scheduleFlush();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, context]); // Config excluded to prevent circular dependency

  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];

    // Clear flush timer
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }

    try {
      const response = await fetch(`${config.endpoint}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          batch_id: `batch_${Date.now()}`,
          sent_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Reset retry count on success
      retryCount.current = 0;

      if (config.enableDebug) {
        console.log(`Analytics: Sent ${eventsToSend.length} events successfully`);
      }
    } catch (error) {
      console.error('Analytics: Failed to send events:', error);

      // Retry logic
      if (retryCount.current < config.maxRetries) {
        retryCount.current++;
        // Re-add events to queue for retry
        eventQueue.current.unshift(...eventsToSend);
        
        // Exponential backoff
        const retryDelay = Math.pow(2, retryCount.current) * 1000;
        setTimeout(() => flushEvents(), retryDelay);
      } else {
        // Store failed events in localStorage as fallback
        const failedEvents = JSON.parse(localStorage.getItem('analytics_failed_events') || '[]');
        failedEvents.push(...eventsToSend);
        localStorage.setItem('analytics_failed_events', JSON.stringify(failedEvents.slice(-100))); // Keep last 100
        retryCount.current = 0;
      }
    }
  }, [config]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return;

    flushTimer.current = setTimeout(() => {
      flushEvents();
    }, config.flushInterval);
  }, [flushEvents, config.flushInterval]);

  // =============================================================================
  // SPECIALIZED TRACKING FUNCTIONS
  // =============================================================================

  const trackPageView = useCallback((page: string, title?: string) => {
    trackEvent({
      event_type: 'page_view',
      event_category: 'navigation',
      event_action: 'view',
      event_label: page,
      properties: {
        page_path: page,
        page_title: title || document.title,
        referrer: document.referrer,
        load_time: performance.now()
      }
    });
  }, [trackEvent]);

  const trackLearningEvent = useCallback((learningEvent: LearningEvent) => {
    trackEvent({
      event_type: 'learning',
      event_category: learningEvent.content_type,
      event_action: learningEvent.action,
      event_label: learningEvent.content_id,
      event_value: learningEvent.progress_percentage || learningEvent.score,
      properties: {
        time_spent_seconds: learningEvent.time_spent_seconds,
        difficulty_level: learningEvent.difficulty_level,
        score: learningEvent.score,
        attempts: learningEvent.attempts,
        progress_percentage: learningEvent.progress_percentage
      },
      course_id: learningEvent.content_type === 'course' ? learningEvent.content_id : undefined,
      lesson_id: learningEvent.content_type === 'lesson' ? learningEvent.content_id : undefined,
      assessment_id: learningEvent.content_type === 'assessment' ? learningEvent.content_id : undefined
    });
  }, [trackEvent]);

  const trackEngagementEvent = useCallback((engagementEvent: EngagementEvent) => {
    trackEvent({
      event_type: 'engagement',
      event_category: 'interaction',
      event_action: engagementEvent.action,
      event_label: engagementEvent.element_type,
      event_value: engagementEvent.time_on_element || engagementEvent.scroll_depth,
      properties: {
        element_id: engagementEvent.element_id,
        element_text: engagementEvent.element_text,
        page_section: engagementEvent.page_section,
        scroll_depth: engagementEvent.scroll_depth,
        time_on_element: engagementEvent.time_on_element
      }
    });
  }, [trackEvent]);

  const trackNavigationEvent = useCallback((navigationEvent: NavigationEvent) => {
    trackEvent({
      event_type: 'navigation',
      event_category: 'user_flow',
      event_action: navigationEvent.action,
      event_label: navigationEvent.page_path,
      event_value: navigationEvent.load_time,
      properties: {
        page_title: navigationEvent.page_title,
        referrer: navigationEvent.referrer,
        search_query: navigationEvent.search_query,
        filter_criteria: navigationEvent.filter_criteria,
        load_time: navigationEvent.load_time
      }
    });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    trackEvent({
      event_type: 'error',
      event_category: 'system',
      event_action: 'exception',
      event_label: error.name,
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        error_context: context,
        url: window.location.href,
        user_agent: navigator.userAgent
      }
    });
  }, [trackEvent]);

  const trackPerformance = useCallback((metric: string, value: number, context?: Record<string, any>) => {
    trackEvent({
      event_type: 'performance',
      event_category: 'metrics',
      event_action: 'measure',
      event_label: metric,
      event_value: value,
      properties: {
        metric_name: metric,
        metric_value: value,
        context: context,
        timestamp: performance.now()
      }
    });
  }, [trackEvent]);

  // =============================================================================
  // CONTEXT MANAGEMENT
  // =============================================================================

  const setLearningContext = useCallback((courseId?: string, lessonId?: string, assessmentId?: string) => {
    setContext(prev => prev ? {
      ...prev,
      courseId,
      lessonId,
      assessmentId
    } : null);
  }, []);

  const clearLearningContext = useCallback(() => {
    setContext(prev => prev ? {
      ...prev,
      courseId: undefined,
      lessonId: undefined,
      assessmentId: undefined
    } : null);
  }, []);

  // =============================================================================
  // CONSENT MANAGEMENT
  // =============================================================================

  const setAnalyticsConsent = useCallback((consent: boolean) => {
    localStorage.setItem('analytics_consent', consent.toString());
    setIsEnabled(consent);
    
    if (!consent) {
      // Clear queue and stop tracking
      eventQueue.current = [];
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
    }
  }, []);

  const getAnalyticsConsent = useCallback(() => {
    const consent = localStorage.getItem('analytics_consent');
    return consent !== 'false';
  }, []);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // Core tracking
    trackEvent,
    trackPageView,
    trackLearningEvent,
    trackEngagementEvent,
    trackNavigationEvent,
    trackError,
    trackPerformance,
    
    // Context management
    setLearningContext,
    clearLearningContext,
    
    // Consent management
    setAnalyticsConsent,
    getAnalyticsConsent,
    
    // Utility
    flushEvents,
    isEnabled,
    context,
    
    // Queue status
    queueSize: eventQueue.current.length,
    
    // Debug helpers
    getQueuedEvents: () => [...eventQueue.current],
    clearQueue: () => { eventQueue.current = []; }
  };
};

// =============================================================================
// ANALYTICS PROVIDER COMPONENT
// =============================================================================

interface AnalyticsProviderProps {
  children: React.ReactNode;
  config?: Partial<AnalyticsConfig>;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const analytics = useAnalytics();

  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        promise: event.promise,
        reason: event.reason
      });
    };

    // Performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            analytics.trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
            analytics.trackPerformance('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'paint'] });
    }

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [analytics]);

  return <>{children}</>;
};

// =============================================================================
// ANALYTICS HOC
// =============================================================================

export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>,
  eventConfig?: {
    trackMount?: boolean;
    trackUnmount?: boolean;
    trackProps?: (keyof P)[];
  }
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, _ref) => {
    const analytics = useAnalytics();
    const componentName = Component.displayName || Component.name || 'Unknown';

    useEffect(() => {
      if (eventConfig?.trackMount) {
        analytics.trackEvent({
          event_type: 'component',
          event_category: 'lifecycle',
          event_action: 'mount',
          event_label: componentName,
          properties: {
            component_name: componentName,
            props: eventConfig.trackProps ? 
              Object.fromEntries(
                eventConfig.trackProps.map(key => [key, (props as any)[key]])
              ) : undefined
          }
        });
      }

      return () => {
        if (eventConfig?.trackUnmount) {
          analytics.trackEvent({
            event_type: 'component',
            event_category: 'lifecycle',
            event_action: 'unmount',
            event_label: componentName
          });
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analytics, componentName]); // Props intentionally omitted to avoid infinite re-renders

    return React.createElement(Component, props as any);
  });

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

export default useAnalytics;