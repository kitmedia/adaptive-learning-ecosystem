import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiKeyService, ApiKey } from './api-key.service';
import { MetricsService } from '../metrics/metrics.service';

export const API_KEY_PERMISSION = 'api_key_permission';
export const RequireApiKeyPermission = (permission: string) =>
  Reflect.metadata(API_KEY_PERMISSION, permission);

interface RequestWithApiKey extends Request {
  apiKey?: ApiKey;
  apiKeyUsageStart?: number;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeyService: ApiKeyService,
    private metricsService: MetricsService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApiKey>();
    const response = context.switchToHttp().getResponse();
    
    // Record start time for metrics
    request.apiKeyUsageStart = Date.now();

    try {
      // Extract API key from headers
      const apiKey = this.extractApiKey(request);
      if (!apiKey) {
        throw new UnauthorizedException('API key is required');
      }

      // Validate API key
      const validatedKey = await this.apiKeyService.validateApiKey(apiKey);
      
      // Check rate limit
      await this.apiKeyService.checkRateLimit(validatedKey, request.path);

      // Check permissions if required
      const requiredPermission = this.reflector.get<string>(
        API_KEY_PERMISSION,
        context.getHandler()
      );
      
      if (requiredPermission && !this.apiKeyService.checkPermission(validatedKey, requiredPermission)) {
        throw new UnauthorizedException(`Insufficient permissions. Required: ${requiredPermission}`);
      }

      // Attach validated API key to request for later use
      request.apiKey = validatedKey;

      // Set response headers with rate limit info
      this.setRateLimitHeaders(response, validatedKey);

      return true;

    } catch (error) {
      // Record API key error in metrics
      this.metricsService.recordApiError(
        'api-gateway',
        'api_key_error',
        request.path
      );

      throw error;
    }
  }

  private extractApiKey(request: Request): string | null {
    // Check multiple possible header locations
    const authHeader = request.headers.authorization;
    const apiKeyHeader = request.headers['x-api-key'] as string;
    const apiKeyQuery = request.query['api_key'] as string;

    // Priority: Authorization header > X-API-Key header > Query parameter
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (authHeader && authHeader.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }

    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    if (apiKeyQuery) {
      return apiKeyQuery;
    }

    return null;
  }

  private setRateLimitHeaders(response: any, apiKey: ApiKey): void {
    const stats = this.apiKeyService.getUsageStats(apiKey.id);
    const remaining = Math.max(0, apiKey.rateLimit.requests - stats.requestsLastHour);
    const resetTime = new Date(Date.now() + (apiKey.rateLimit.period * 1000));

    response.setHeader('X-RateLimit-Limit', apiKey.rateLimit.requests.toString());
    response.setHeader('X-RateLimit-Remaining', remaining.toString());
    response.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000).toString());
    response.setHeader('X-RateLimit-Period', apiKey.rateLimit.period.toString());
  }

  // Middleware function to record usage after request completion
  static createUsageMiddleware(apiKeyService: ApiKeyService) {
    return (req: RequestWithApiKey, res: any, next: any) => {
      // Hook into response finish to record usage
      const originalEnd = res.end;
      
      res.end = function(chunk?: any, encoding?: any, cb?: any) {
        // Record API key usage
        if (req.apiKey && req.apiKeyUsageStart) {
          const responseTime = Date.now() - req.apiKeyUsageStart;
          const ip = req.ip || req.socket.remoteAddress || 'unknown';
          const userAgent = req.headers['user-agent'];

          apiKeyService.recordUsage(
            req.apiKey,
            req.path,
            req.method,
            ip,
            res.statusCode,
            responseTime,
            userAgent
          ).catch(error => {
            console.error('Failed to record API key usage:', error);
          });
        }

        // Call original end method
        return originalEnd.call(this, chunk, encoding, cb);
      };

      next();
    };
  }
}