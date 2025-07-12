/**
 * Analytics Service - Adaptive Learning Ecosystem
 * EbroValley Digital - Centralized analytics service integration
 * 
 * Service layer for communicating with the analytics microservice
 * and managing analytics data flow
 */

// import { ApiService } from './apiService';

// Temporary mock for ApiService
interface ApiService {
  getAuthToken(): string;
}

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface AnalyticsEvent {
  user_id: string;
  session_id: string;
  event_type: string;
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
  properties?: Record<string, string | number | boolean>;
  course_id?: string;
  lesson_id?: string;
  assessment_id?: string;
  timestamp?: string;
}

export interface EventBatch {
  events: AnalyticsEvent[];
  batch_id: string;
  sent_at: string;
}

export interface LearningAnalytics {
  user_id: string;
  course_id: string;
  course_title: string;
  completion_rate: number;
  time_spent_hours: number;
  avg_quiz_score: number;
  lessons_completed: number;
  assessments_taken: number;
  engagement_score: number;
  last_activity: string;
  recent_activity_count: number;
}

export interface BusinessMetrics {
  period_start: string;
  period_end: string;
  total_users: number;
  active_users: number;
  new_registrations: number;
  course_completions: number;
  average_session_duration: number;
  revenue_metrics: Record<string, number>;
  engagement_metrics: Record<string, number>;
}

export interface PredictiveInsights {
  user_id: string;
  predicted_completion_probability: number;
  estimated_completion_time_hours: number;
  at_risk_dropout: boolean;
  recommended_interventions: string[];
  confidence_score: number;
}

export interface RealtimeMetrics {
  timestamp: string;
  daily_active_users: number;
  active_sessions: number;
  event_counts: Record<string, number>;
  total_events_today: number;
}

export interface AnalyticsQuery {
  start_date?: string;
  end_date?: string;
  user_id?: string;
  course_id?: string;
  event_type?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsResponse<T> {
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  };
  metadata?: {
    generated_at: string;
    cache_hit: boolean;
    execution_time_ms: number;
  };
}

// =============================================================================
// ANALYTICS SERVICE CLASS
// =============================================================================

export class AnalyticsService {
  private apiService: ApiService;
  private baseUrl: string;
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.baseUrl = process.env.REACT_APP_ANALYTICS_SERVICE_URL || 'http://localhost:8004';
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  private getCacheKey(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCachedData(key: string, data: unknown, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  // =============================================================================
  // EVENT TRACKING
  // =============================================================================

  /**
   * Track a single event
   */
  async trackEvent(event: AnalyticsEvent): Promise<{ event_id: string; status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Track multiple events in a batch
   */
  async trackEventBatch(events: AnalyticsEvent[]): Promise<{ batch_id: string; status: string; processed: number }> {
    try {
      const batch: EventBatch = {
        events,
        batch_id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sent_at: new Date().toISOString()
      };

      const response = await fetch(`${this.baseUrl}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        },
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to track event batch:', error);
      throw error;
    }
  }

  // =============================================================================
  // LEARNING ANALYTICS
  // =============================================================================

  /**
   * Get learning analytics for a user
   */
  async getLearningAnalytics(userId: string, courseId?: string): Promise<AnalyticsResponse<LearningAnalytics[]>> {
    try {
      const cacheKey = this.getCacheKey('learning-analytics', { userId, courseId });
      const cached = this.getCachedData<AnalyticsResponse<LearningAnalytics[]>>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams();
      if (courseId) params.append('course_id', courseId);

      const response = await fetch(`${this.baseUrl}/learning-analytics/${userId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result: AnalyticsResponse<LearningAnalytics[]> = {
        data: data.learning_analytics || [],
        metadata: {
          generated_at: new Date().toISOString(),
          cache_hit: false,
          execution_time_ms: 0
        }
      };

      this.setCachedData(cacheKey, result, 2); // Cache for 2 minutes
      return result;
    } catch (error) {
      console.error('Failed to get learning analytics:', error);
      throw error;
    }
  }

  /**
   * Get aggregated learning analytics for multiple users
   */
  async getAggregatedLearningAnalytics(query: AnalyticsQuery): Promise<AnalyticsResponse<LearningAnalytics[]>> {
    try {
      const cacheKey = this.getCacheKey('aggregated-learning-analytics', query);
      const cached = this.getCachedData<AnalyticsResponse<LearningAnalytics[]>>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });

      const response = await fetch(`${this.baseUrl}/learning-analytics/aggregated?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result: AnalyticsResponse<LearningAnalytics[]> = {
        data,
        metadata: {
          generated_at: new Date().toISOString(),
          cache_hit: false,
          execution_time_ms: 0
        }
      };

      this.setCachedData(cacheKey, result, 5); // Cache for 5 minutes
      return result;
    } catch (error) {
      console.error('Failed to get aggregated learning analytics:', error);
      throw error;
    }
  }

  // =============================================================================
  // BUSINESS METRICS
  // =============================================================================

  /**
   * Get business metrics for a date range
   */
  async getBusinessMetrics(startDate: string, endDate: string): Promise<AnalyticsResponse<BusinessMetrics>> {
    try {
      const cacheKey = this.getCacheKey('business-metrics', { startDate, endDate });
      const cached = this.getCachedData<AnalyticsResponse<BusinessMetrics>>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      const response = await fetch(`${this.baseUrl}/business-metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result: AnalyticsResponse<BusinessMetrics> = {
        data,
        metadata: {
          generated_at: new Date().toISOString(),
          cache_hit: false,
          execution_time_ms: 0
        }
      };

      this.setCachedData(cacheKey, result, 10); // Cache for 10 minutes
      return result;
    } catch (error) {
      console.error('Failed to get business metrics:', error);
      throw error;
    }
  }

  /**
   * Get historical business metrics
   */
  async getHistoricalBusinessMetrics(days: number = 30): Promise<AnalyticsResponse<BusinessMetrics[]>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);

      const cacheKey = this.getCacheKey('historical-business-metrics', { days });
      const cached = this.getCachedData<AnalyticsResponse<BusinessMetrics[]>>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        granularity: 'daily'
      });

      const response = await fetch(`${this.baseUrl}/business-metrics/historical?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result: AnalyticsResponse<BusinessMetrics[]> = {
        data: data.metrics || [],
        metadata: {
          generated_at: new Date().toISOString(),
          cache_hit: false,
          execution_time_ms: 0
        }
      };

      this.setCachedData(cacheKey, result, 15); // Cache for 15 minutes
      return result;
    } catch (error) {
      console.error('Failed to get historical business metrics:', error);
      throw error;
    }
  }

  // =============================================================================
  // PREDICTIVE INSIGHTS
  // =============================================================================

  /**
   * Get predictive insights for a user
   */
  async getPredictiveInsights(userId: string): Promise<AnalyticsResponse<PredictiveInsights[]>> {
    try {
      const cacheKey = this.getCacheKey('predictive-insights', { userId });
      const cached = this.getCachedData<AnalyticsResponse<PredictiveInsights[]>>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await fetch(`${this.baseUrl}/predictive-insights/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result: AnalyticsResponse<PredictiveInsights[]> = {
        data: Array.isArray(data) ? data : [data],
        metadata: {
          generated_at: new Date().toISOString(),
          cache_hit: false,
          execution_time_ms: 0
        }
      };

      this.setCachedData(cacheKey, result, 30); // Cache for 30 minutes
      return result;
    } catch (error) {
      console.error('Failed to get predictive insights:', error);
      throw error;
    }
  }

  // =============================================================================
  // REAL-TIME METRICS
  // =============================================================================

  /**
   * Get real-time metrics
   */
  async getRealtimeMetrics(): Promise<AnalyticsResponse<RealtimeMetrics>> {
    try {
      const response = await fetch(`${this.baseUrl}/realtime-metrics`, {
        headers: {
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result: AnalyticsResponse<RealtimeMetrics> = {
        data,
        metadata: {
          generated_at: new Date().toISOString(),
          cache_hit: false,
          execution_time_ms: 0
        }
      };

      return result;
    } catch (error) {
      console.error('Failed to get realtime metrics:', error);
      throw error;
    }
  }

  // =============================================================================
  // CUSTOM QUERIES
  // =============================================================================

  /**
   * Execute custom analytics query
   */
  async executeCustomQuery(query: string, params?: Record<string, string | number | boolean | null>): Promise<AnalyticsResponse<unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/custom-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        },
        body: JSON.stringify({ query, params })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data,
        metadata: {
          generated_at: new Date().toISOString(),
          cache_hit: false,
          execution_time_ms: 0
        }
      };
    } catch (error) {
      console.error('Failed to execute custom query:', error);
      throw error;
    }
  }

  // =============================================================================
  // REPORTING
  // =============================================================================

  /**
   * Generate analytics report
   */
  async generateReport(reportType: string, params?: Record<string, string | number | boolean | null>): Promise<AnalyticsResponse<unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/${reportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data,
        metadata: {
          generated_at: new Date().toISOString(),
          cache_hit: false,
          execution_time_ms: 0
        }
      };
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportData(format: 'json' | 'csv' | 'xlsx', query: AnalyticsQuery): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
      params.append('format', format);

      const response = await fetch(`${this.baseUrl}/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiService.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Analytics service health check failed:', error);
      throw error;
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let analyticsServiceInstance: AnalyticsService | null = null;

export const getAnalyticsService = (apiService?: ApiService): AnalyticsService => {
  if (!analyticsServiceInstance) {
    const mockApiService = apiService || {
      getAuthToken: () => 'mock-token'
    };
    analyticsServiceInstance = new AnalyticsService(mockApiService);
  }
  return analyticsServiceInstance;
};

export default AnalyticsService;