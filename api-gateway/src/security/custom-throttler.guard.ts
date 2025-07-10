import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MetricsService } from '../metrics/metrics.service';
import { ENDPOINT_RATE_LIMITS, IP_WHITELIST } from './rate-limit.config';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly metricsService: MetricsService
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Request): Promise<string> {
    // Use IP address as the primary tracker
    const ip = this.getClientIP(req);
    
    // If authenticated user, combine IP + user ID for better tracking
    const user = (req as any).user;
    if (user?.sub) {
      return `${ip}:${user.sub}`;
    }
    
    return ip;
  }

  protected getClientIP(req: Request): string {
    // Handle various proxy configurations
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIP = req.headers['x-real-ip'] as string;
    const cfConnectingIP = req.headers['cf-connecting-ip'] as string;
    
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    
    return req.socket.remoteAddress || req.ip || '0.0.0.0';
  }

  protected isWhitelisted(ip: string): boolean {
    return IP_WHITELIST.some(whitelist => {
      if (whitelist.includes('/')) {
        // CIDR notation - simplified check
        const [network, prefixLength] = whitelist.split('/');
        return ip.startsWith(network.split('.').slice(0, parseInt(prefixLength) / 8).join('.'));
      }
      return ip === whitelist;
    });
  }

  protected getCustomLimits(context: ExecutionContext): { ttl: number; limit: number } | null {
    const request = context.switchToHttp().getRequest<Request>();
    const route = request.route?.path || request.path;
    
    // Check for custom endpoint limits
    const customLimit = ENDPOINT_RATE_LIMITS[route as keyof typeof ENDPOINT_RATE_LIMITS];
    if (customLimit) {
      return customLimit;
    }

    // Check for endpoint patterns
    if (route.includes('/auth/')) {
      return { ttl: 300000, limit: 10 }; // 10 requests per 5 minutes for auth
    }
    
    if (route.includes('/ai-tutor/')) {
      return { ttl: 60000, limit: 50 }; // 50 requests per minute for AI services
    }
    
    if (route.includes('/assessments/')) {
      return { ttl: 60000, limit: 30 }; // 30 requests per minute for assessments
    }

    return null; // Use default limits
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIP(request);
    
    // Skip rate limiting for whitelisted IPs
    if (this.isWhitelisted(ip)) {
      return true;
    }

    try {
      // Use default throttling logic with enhancements
      const result = await super.canActivate(context);
      
      // Record successful request in metrics
      this.metricsService.recordHttpRequest(
        request.method,
        request.route?.path || request.path,
        200,
        0 // Duration will be recorded by metrics middleware
      );
      
      return result;
      
    } catch (error) {
      if (error instanceof ThrottlerException) {
        // Record rate limit violation in metrics
        this.metricsService.recordApiError(
          'api-gateway',
          'rate_limit_exceeded',
          request.route?.path || request.path
        );
        
        // Log rate limit violation for monitoring
        console.warn(`Rate limit exceeded for ${ip} on ${request.method} ${request.path}`);
      }
      
      throw error;
    }
  }

  protected generateKey(context: ExecutionContext, suffix: string): string {
    const request = context.switchToHttp().getRequest<Request>();
    const tracker = this.getTracker(request);
    
    // Include endpoint in the key for per-endpoint limiting
    const endpoint = request.route?.path || request.path;
    
    return `${tracker}:${endpoint}:${suffix}`;
  }
}