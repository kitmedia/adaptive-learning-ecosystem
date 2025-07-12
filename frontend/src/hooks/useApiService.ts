/**
 * API Service Hook - Adaptive Learning Ecosystem
 * Centralized API communication with error handling, loading states, and caching
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  status: number;
}

interface ApiError {
  message: string;
  status: number;
  statusText: string;
  data?: any;
}

interface ApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
  cache?: boolean;
  retries?: number;
}

interface UseApiServiceReturn {
  // State
  loading: boolean;
  error: ApiError | null;
  
  // Methods
  get: <T = any>(url: string, options?: ApiOptions) => Promise<ApiResponse<T>>;
  post: <T = any>(url: string, data?: any, options?: ApiOptions) => Promise<ApiResponse<T>>;
  put: <T = any>(url: string, data?: any, options?: ApiOptions) => Promise<ApiResponse<T>>;
  delete: <T = any>(url: string, options?: ApiOptions) => Promise<ApiResponse<T>>;
  patch: <T = any>(url: string, data?: any, options?: ApiOptions) => Promise<ApiResponse<T>>;
  
  // Utilities
  clearError: () => void;
  clearCache: () => void;
  setLoading: (loading: boolean) => void;
  cleanup: () => void;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

const ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    profile: '/api/auth/profile',
  },
  
  // AI Tutor Service
  aiTutor: {
    base: '/api/ai-tutor',
    recommendations: '/api/ai-tutor/recommendations',
    progress: '/api/ai-tutor/progress',
    feedback: '/api/ai-tutor/feedback',
  },
  
  // Assessment Service
  assessment: {
    base: '/api/assessment',
    create: '/api/assessment/create',
    submit: '/api/assessment/submit',
    results: '/api/assessment/results',
  },
  
  // Analytics Service
  analytics: {
    base: '/api/analytics',
    dashboard: '/api/analytics/dashboard',
    users: '/api/analytics/users',
    courses: '/api/analytics/courses',
    revenue: '/api/analytics/revenue',
  },
  
  // Progress Tracking Service
  progress: {
    base: '/api/progress',
    user: '/api/progress/user',
    course: '/api/progress/course',
    achievements: '/api/progress/achievements',
  },
  
  // Content Management Service
  content: {
    base: '/api/content',
    courses: '/api/content/courses',
    lessons: '/api/content/lessons',
    media: '/api/content/media',
  },
  
  // Notifications Service
  notifications: {
    base: '/api/notifications',
    send: '/api/notifications/send',
    preferences: '/api/notifications/preferences',
    history: '/api/notifications/history',
  },
  
  // Collaboration Service
  collaboration: {
    base: '/api/collaboration',
    sessions: '/api/collaboration/sessions',
    comments: '/api/collaboration/comments',
  },
  
  // Content Intelligence Service
  contentIntelligence: {
    base: '/api/content-intelligence',
    analyze: '/api/content-intelligence/analyze',
    generate: '/api/content-intelligence/generate',
    suggestions: '/api/content-intelligence/suggestions',
  },
};

// =============================================================================
// CACHE IMPLEMENTATION
// =============================================================================

interface CacheEntry {
  data: any;
  timestamp: number;
  expires: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    const now = Date.now();
    const expires = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expires,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new ApiCache();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const createCacheKey = (method: string, url: string, data?: any): string => {
  const dataHash = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${dataHash}`;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// =============================================================================
// MAIN HOOK
// =============================================================================

export const useApiService = (): UseApiServiceReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // =============================================================================
  // CORE REQUEST FUNCTION
  // =============================================================================

  const makeRequest = useCallback(async <T = any>(
    method: string,
    url: string,
    data?: any,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    
    // Clear previous error
    setError(null);
    
    // Create cache key
    const cacheKey = createCacheKey(method, url, data);
    
    // Check cache for GET requests
    if (method === 'GET' && options.cache !== false) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Abort previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Create new abort controller
    abortController.current = new AbortController();
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: abortController.current.signal,
    };

    // Add authorization header if user is authenticated
    if (user?.token) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${user.token}`,
      };
    }

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.baseURL}${url}`;
    
    let lastError: ApiError | null = null;
    const maxRetries = options.retries ?? API_CONFIG.retries;
    
    // Retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setLoading(true);
        
        // Add timeout
        const timeoutId = setTimeout(() => {
          abortController.current?.abort();
        }, options.timeout ?? API_CONFIG.timeout);
        
        // Make request
        const response = await fetch(fullUrl, requestOptions);
        
        clearTimeout(timeoutId);
        
        // Parse response
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
        
        // Handle HTTP errors
        if (!response.ok) {
          const apiError: ApiError = {
            message: responseData.message || response.statusText,
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          };
          
          // Don't retry for client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            setError(apiError);
            throw apiError;
          }
          
          lastError = apiError;
          
          // Retry for server errors (5xx)
          if (attempt < maxRetries) {
            await sleep(API_CONFIG.retryDelay * (attempt + 1));
            continue;
          } else {
            setError(apiError);
            throw apiError;
          }
        }
        
        // Successful response
        const apiResponse: ApiResponse<T> = {
          data: responseData.data || responseData,
          success: true,
          message: responseData.message,
          status: response.status,
        };
        
        // Cache successful GET requests
        if (method === 'GET' && options.cache !== false) {
          apiCache.set(cacheKey, apiResponse);
        }
        
        return apiResponse;
        
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Request was aborted, don't set error
          throw err;
        }
        
        // Network or other errors
        const apiError: ApiError = {
          message: err.message || 'Network error',
          status: 0,
          statusText: 'Network Error',
          data: err,
        };
        
        lastError = apiError;
        
        // Retry on network errors
        if (attempt < maxRetries) {
          await sleep(API_CONFIG.retryDelay * (attempt + 1));
          continue;
        } else {
          setError(apiError);
          throw apiError;
        }
      } finally {
        setLoading(false);
      }
    }
    
    // If we get here, all retries failed
    if (lastError) {
      throw lastError;
    }
    
    throw new Error('Request failed after all retries');
  }, [user]);

  // =============================================================================
  // HTTP METHOD WRAPPERS
  // =============================================================================

  const get = useCallback(<T = any>(url: string, options?: ApiOptions) => {
    return makeRequest<T>('GET', url, undefined, options);
  }, [makeRequest]);

  const post = useCallback(<T = any>(url: string, data?: any, options?: ApiOptions) => {
    return makeRequest<T>('POST', url, data, options);
  }, [makeRequest]);

  const put = useCallback(<T = any>(url: string, data?: any, options?: ApiOptions) => {
    return makeRequest<T>('PUT', url, data, options);
  }, [makeRequest]);

  const del = useCallback(<T = any>(url: string, options?: ApiOptions) => {
    return makeRequest<T>('DELETE', url, undefined, options);
  }, [makeRequest]);

  const patch = useCallback(<T = any>(url: string, data?: any, options?: ApiOptions) => {
    return makeRequest<T>('PATCH', url, data, options);
  }, [makeRequest]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    apiCache.clear();
  }, []);

  const setLoadingState = useCallback((loadingState: boolean) => {
    setLoading(loadingState);
  }, []);

  // =============================================================================
  // CLEANUP ON UNMOUNT
  // =============================================================================

  const cleanup = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    // Cleanup cache periodically
    apiCache.cleanup();
  }, []);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // State
    loading,
    error,
    
    // HTTP methods
    get,
    post,
    put,
    delete: del,
    patch,
    
    // Utilities
    clearError,
    clearCache,
    setLoading: setLoadingState,
    cleanup,
  };
};

// =============================================================================
// EXPORT ADDITIONAL UTILITIES
// =============================================================================

export { ENDPOINTS, API_CONFIG };
export type { ApiResponse, ApiError, ApiOptions };