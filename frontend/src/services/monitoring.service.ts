/**
 * Monitoring Service
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Enterprise-grade monitoring and alerting system
 */

interface MonitoringMetrics {
  // Performance metrics
  pageLoadTime: number;
  renderTime: number;
  interactionTime: number;
  
  // User experience metrics
  userSatisfactionScore: number;
  bounceRate: number;
  sessionDuration: number;
  
  // Technical metrics
  errorRate: number;
  apiResponseTime: number;
  cacheHitRate: number;
  
  // Business metrics
  conversionRate: number;
  userEngagement: number;
  featureUsage: Record<string, number>;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  metric: keyof MonitoringMetrics;
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: number;
  resolved?: boolean;
}

interface MonitoringConfig {
  enabled: boolean;
  alerting: boolean;
  realTimeUpdates: boolean;
  dataRetention: number; // days
  thresholds: Partial<MonitoringMetrics>;
  endpoints: {
    metrics: string;
    alerts: string;
    logs: string;
  };
}

class MonitoringService {
  private static instance: MonitoringService;
  private config: MonitoringConfig;
  private metrics: MonitoringMetrics;
  private alerts: Alert[] = [];
  private metricsHistory: { timestamp: number; metrics: MonitoringMetrics }[] = [];
  private subscribers: ((metrics: MonitoringMetrics) => void)[] = [];

  private constructor() {
    this.config = {
      enabled: true,
      alerting: true,
      realTimeUpdates: true,
      dataRetention: 30,
      thresholds: {
        pageLoadTime: 3000, // 3 seconds
        renderTime: 1000, // 1 second
        errorRate: 5, // 5%
        apiResponseTime: 2000, // 2 seconds
        userSatisfactionScore: 7, // out of 10
        bounceRate: 40, // 40%
        conversionRate: 2 // 2%
      },
      endpoints: {
        metrics: '/api/monitoring/metrics',
        alerts: '/api/monitoring/alerts',
        logs: '/api/monitoring/logs'
      }
    };

    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeMetrics(): MonitoringMetrics {
    return {
      pageLoadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      userSatisfactionScore: 10,
      bounceRate: 0,
      sessionDuration: 0,
      errorRate: 0,
      apiResponseTime: 0,
      cacheHitRate: 100,
      conversionRate: 0,
      userEngagement: 0,
      featureUsage: {}
    };
  }

  private startMonitoring(): void {
    if (!this.config.enabled) return;

    // Monitor page load performance
    this.monitorPageLoad();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor API performance
    this.monitorAPIPerformance();
    
    // Monitor errors
    this.monitorErrors();
    
    // Real-time updates
    if (this.config.realTimeUpdates) {
      setInterval(() => {
        this.updateMetrics();
        this.checkThresholds();
        this.notifySubscribers();
      }, 5000); // Update every 5 seconds
    }

    // Data cleanup
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Cleanup daily

    console.log('🔍 Monitoring Service initialized');
  }

  private monitorPageLoad(): void {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.updateMetric('pageLoadTime', navigation.loadEventEnd - navigation.fetchStart);
            this.updateMetric('renderTime', navigation.domContentLoadedEventEnd - navigation.fetchStart);
          }
        }, 100);
      });
    }
  }

  private monitorUserInteractions(): void {
    let lastInteraction = Date.now();
    let sessionStart = Date.now();
    let interactions = 0;

    const updateInteractionMetrics = () => {
      const now = Date.now();
      this.updateMetric('sessionDuration', now - sessionStart);
      this.updateMetric('userEngagement', interactions / ((now - sessionStart) / 60000)); // interactions per minute
    };

    ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        lastInteraction = Date.now();
        interactions++;
        updateInteractionMetrics();
      });
    });

    // Track bounce rate
    setTimeout(() => {
      const sessionDuration = Date.now() - sessionStart;
      if (sessionDuration < 30000 && interactions < 3) { // Less than 30 seconds and 3 interactions
        this.updateMetric('bounceRate', this.metrics.bounceRate + 1);
      }
    }, 30000);
  }

  private monitorAPIPerformance(): void {
    // Override fetch to monitor API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.updateMetric('apiResponseTime', responseTime);
        
        // Track error rate
        if (!response.ok) {
          this.updateMetric('errorRate', this.metrics.errorRate + 1);
        }
        
        // Send API performance data
        this.logAPICall({
          url: args[0] as string,
          method: (args[1] as RequestInit)?.method || 'GET',
          responseTime,
          status: response.status,
          success: response.ok
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.updateMetric('errorRate', this.metrics.errorRate + 1);
        this.updateMetric('apiResponseTime', responseTime);
        
        throw error;
      }
    };
  }

  private monitorErrors(): void {
    window.addEventListener('error', (event) => {
      this.updateMetric('errorRate', this.metrics.errorRate + 1);
      
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.updateMetric('errorRate', this.metrics.errorRate + 1);
      
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
  }

  private updateMetrics(): void {
    // Calculate dynamic metrics
    if (this.metricsHistory.length > 0) {
      const recent = this.metricsHistory.slice(-10); // Last 10 data points
      
      // Calculate cache hit rate (simulated)
      this.metrics.cacheHitRate = Math.random() * 20 + 80; // 80-100%
      
      // Calculate user satisfaction score based on performance
      let satisfactionScore = 10;
      if (this.metrics.pageLoadTime > 3000) satisfactionScore -= 2;
      if (this.metrics.errorRate > 5) satisfactionScore -= 3;
      if (this.metrics.apiResponseTime > 2000) satisfactionScore -= 1;
      this.metrics.userSatisfactionScore = Math.max(1, satisfactionScore);
    }

    // Store metrics history
    this.metricsHistory.push({
      timestamp: Date.now(),
      metrics: { ...this.metrics }
    });

    // Limit history size
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-500);
    }
  }

  private checkThresholds(): void {
    if (!this.config.alerting) return;

    Object.entries(this.config.thresholds).forEach(([metric, threshold]) => {
      const currentValue = this.metrics[metric as keyof MonitoringMetrics] as number;
      
      if (typeof currentValue === 'number' && typeof threshold === 'number' && currentValue > threshold) {
        this.createAlert(metric as keyof MonitoringMetrics, threshold, currentValue);
      }
    });
  }

  private createAlert(metric: keyof MonitoringMetrics, threshold: number, currentValue: number): void {
    const alertId = `${metric}-${Date.now()}`;
    
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(alert => 
      alert.metric === metric && !alert.resolved && 
      (Date.now() - alert.timestamp) < 300000 // 5 minutes
    );
    
    if (existingAlert) return;

    const severity = this.getAlertSeverity(metric, threshold, currentValue);
    
    const alert: Alert = {
      id: alertId,
      type: severity,
      metric,
      threshold,
      currentValue,
      message: this.getAlertMessage(metric, threshold, currentValue),
      timestamp: Date.now()
    };

    this.alerts.push(alert);
    
    console.warn(`🚨 Alert: ${alert.message}`);
    
    // Send alert to monitoring endpoint
    this.sendAlert(alert);
  }

  private getAlertSeverity(metric: keyof MonitoringMetrics, threshold: number, currentValue: number): Alert['type'] {
    const ratio = currentValue / threshold;
    
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'error';
    if (ratio > 1.2) return 'warning';
    return 'info';
  }

  private getAlertMessage(metric: keyof MonitoringMetrics, threshold: number, currentValue: number): string {
    const messages: Record<keyof MonitoringMetrics, string> = {
      pageLoadTime: `Tiempo de carga excesivo: ${currentValue.toFixed(0)}ms (límite: ${threshold}ms)`,
      renderTime: `Tiempo de renderizado alto: ${currentValue.toFixed(0)}ms (límite: ${threshold}ms)`,
      interactionTime: `Tiempo de interacción lento: ${currentValue.toFixed(0)}ms (límite: ${threshold}ms)`,
      errorRate: `Tasa de errores elevada: ${currentValue.toFixed(1)}% (límite: ${threshold}%)`,
      apiResponseTime: `API responde lentamente: ${currentValue.toFixed(0)}ms (límite: ${threshold}ms)`,
      userSatisfactionScore: `Satisfacción del usuario baja: ${currentValue.toFixed(1)}/10 (mínimo: ${threshold}/10)`,
      bounceRate: `Tasa de rebote alta: ${currentValue.toFixed(1)}% (límite: ${threshold}%)`,
      sessionDuration: `Duración de sesión: ${currentValue.toFixed(0)}ms`,
      cacheHitRate: `Tasa de cache baja: ${currentValue.toFixed(1)}% (mínimo: ${threshold}%)`,
      conversionRate: `Tasa de conversión baja: ${currentValue.toFixed(1)}% (mínimo: ${threshold}%)`,
      userEngagement: `Engagement del usuario bajo: ${currentValue.toFixed(1)} (mínimo: ${threshold})`,
      featureUsage: `Uso de características: ${JSON.stringify(currentValue)}`
    };

    return messages[metric] || `Métrica ${metric} fuera de rango: ${currentValue} (límite: ${threshold})`;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.metrics);
      } catch (error) {
        console.error('Error notifying monitoring subscriber:', error);
      }
    });
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (this.config.dataRetention * 24 * 60 * 60 * 1000);
    
    // Clean old metrics history
    this.metricsHistory = this.metricsHistory.filter(entry => entry.timestamp > cutoffTime);
    
    // Clean old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    
    console.log('🧹 Monitoring data cleanup completed');
  }

  // Public API methods
  public updateMetric(metric: keyof MonitoringMetrics, value: number): void {
    if (typeof this.metrics[metric] === 'number') {
      (this.metrics[metric] as number) = value;
    } else if (typeof this.metrics[metric] === 'object') {
      // For featureUsage object
      (this.metrics[metric] as Record<string, number>)[metric] = value;
    }
  }

  public trackFeatureUsage(feature: string): void {
    this.metrics.featureUsage[feature] = (this.metrics.featureUsage[feature] || 0) + 1;
  }

  public trackConversion(): void {
    this.updateMetric('conversionRate', this.metrics.conversionRate + 1);
  }

  public subscribe(callback: (metrics: MonitoringMetrics) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  public getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  public getMetricsHistory(): { timestamp: number; metrics: MonitoringMetrics }[] {
    return [...this.metricsHistory];
  }

  private async sendAlert(alert: Alert): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        await fetch(this.config.endpoints.alerts, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(alert)
        });
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  private async logAPICall(apiCall: any): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        await fetch(this.config.endpoints.logs, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'api_call',
            data: apiCall,
            timestamp: Date.now()
          })
        });
      }
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }

  private async logError(error: any): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        await fetch(this.config.endpoints.logs, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'error',
            data: error,
            timestamp: Date.now()
          })
        });
      }
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();
export default monitoringService;