import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly databaseConnections: Gauge<string>;
  private readonly cacheHitRate: Gauge<string>;
  private readonly authenticationAttempts: Counter<string>;
  private readonly apiErrors: Counter<string>;

  constructor() {
    // Enable default metrics collection (CPU, memory, etc.)
    collectDefaultMetrics({ register });

    // HTTP Requests Total Counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
      registers: [register],
    });

    // HTTP Request Duration Histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
      registers: [register],
    });

    // Active Connections Gauge
    this.activeConnections = new Gauge({
      name: 'active_connections_total',
      help: 'Number of active connections',
      labelNames: ['service'],
      registers: [register],
    });

    // Database Connections Gauge
    this.databaseConnections = new Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections',
      labelNames: ['database', 'service'],
      registers: [register],
    });

    // Cache Hit Rate Gauge
    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_type', 'service'],
      registers: [register],
    });

    // Authentication Attempts Counter
    this.authenticationAttempts = new Counter({
      name: 'authentication_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['result', 'method'],
      registers: [register],
    });

    // API Errors Counter
    this.apiErrors = new Counter({
      name: 'api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['service', 'error_type', 'endpoint'],
      registers: [register],
    });
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    service: string = 'api-gateway'
  ): void {
    const statusCodeStr = statusCode.toString();
    
    this.httpRequestsTotal
      .labels(method, route, statusCodeStr, service)
      .inc();
    
    this.httpRequestDuration
      .labels(method, route, statusCodeStr, service)
      .observe(duration);
  }

  /**
   * Update active connections count
   */
  setActiveConnections(count: number, service: string = 'api-gateway'): void {
    this.activeConnections.labels(service).set(count);
  }

  /**
   * Update database connections count
   */
  setDatabaseConnections(count: number, database: string, service: string = 'api-gateway'): void {
    this.databaseConnections.labels(database, service).set(count);
  }

  /**
   * Update cache hit rate
   */
  setCacheHitRate(rate: number, cacheType: string, service: string = 'api-gateway'): void {
    this.cacheHitRate.labels(cacheType, service).set(rate);
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(result: 'success' | 'failure', method: string): void {
    this.authenticationAttempts.labels(result, method).inc();
  }

  /**
   * Record API error
   */
  recordApiError(service: string, errorType: string, endpoint: string): void {
    this.apiErrors.labels(service, errorType, endpoint).inc();
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    register.clear();
  }

  /**
   * Get registry for custom metrics
   */
  getRegister() {
    return register;
  }
}