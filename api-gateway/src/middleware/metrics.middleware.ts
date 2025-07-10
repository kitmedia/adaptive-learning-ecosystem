import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';

interface RequestWithTimer extends Request {
  startTime?: number;
}

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: RequestWithTimer, res: Response, next: NextFunction): void {
    // Record request start time
    req.startTime = Date.now();

    // Override res.end to capture metrics when response finishes
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      // Calculate request duration
      const duration = req.startTime ? (Date.now() - req.startTime) / 1000 : 0;
      
      // Extract route pattern (removing dynamic segments)
      const route = req.route?.path || req.path || 'unknown';
      const cleanRoute = route.replace(/\/:[^\/]+/g, '/:id'); // Replace :id patterns
      
      // Record metrics
      try {
        // Record HTTP request metrics
        this.metricsService.recordHttpRequest(
          req.method,
          cleanRoute,
          res.statusCode,
          duration,
          'api-gateway'
        );

        // Record authentication metrics if it's an auth endpoint
        if (req.path.includes('/auth/')) {
          const isSuccess = res.statusCode < 400;
          this.metricsService.recordAuthAttempt(
            isSuccess ? 'success' : 'failure',
            req.method
          );
        }

        // Record API errors for 4xx/5xx responses
        if (res.statusCode >= 400) {
          const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
          this.metricsService.recordApiError('api-gateway', errorType, cleanRoute);
        }
      } catch (error) {
        // Silently fail metrics recording to not affect main request
        console.error('Metrics recording error:', error);
      }

      // Call original end method
      return originalEnd.call(this, chunk, encoding, cb);
    }.bind(res);

    next();
  }
}