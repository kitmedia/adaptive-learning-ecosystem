import { ThrottlerModuleOptions } from '@nestjs/throttler';

export interface RateLimitConfig {
  ttl: number;      // Time window in milliseconds
  limit: number;    // Maximum requests per window
  skipIf?: (request: any) => boolean;
}

export const DEFAULT_RATE_LIMITS: ThrottlerModuleOptions = [
  {
    name: 'default',
    ttl: 60000,  // 1 minute
    limit: 100,  // 100 requests per minute
  },
  {
    name: 'auth',
    ttl: 60000,  // 1 minute  
    limit: 10,   // 10 auth attempts per minute
  },
  {
    name: 'api',
    ttl: 60000,  // 1 minute
    limit: 200,  // 200 API calls per minute
  }
];

export const ENDPOINT_RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  '/auth/login': {
    ttl: 300000,    // 5 minutes
    limit: 5,       // 5 attempts per 5 minutes
  },
  '/auth/register': {
    ttl: 3600000,   // 1 hour
    limit: 3,       // 3 registrations per hour
  },
  '/auth/forgot-password': {
    ttl: 3600000,   // 1 hour
    limit: 3,       // 3 password reset requests per hour
  },
  
  // AI services - moderate limits
  '/ai-tutor/diagnostic/generate': {
    ttl: 60000,     // 1 minute
    limit: 10,      // 10 diagnostics per minute
  },
  '/ai-tutor/diagnostic/analyze': {
    ttl: 60000,     // 1 minute
    limit: 20,      // 20 analyses per minute
  },
  '/ai-tutor/feedback/realtime': {
    ttl: 60000,     // 1 minute
    limit: 100,     // 100 feedback requests per minute
  },
  
  // Assessment endpoints - moderate limits
  '/assessments/generate': {
    ttl: 60000,     // 1 minute
    limit: 30,      // 30 assessments per minute
  },
  '/assessments/submit': {
    ttl: 60000,     // 1 minute
    limit: 50,      // 50 submissions per minute
  },
  
  // Progress tracking - higher limits
  '/progress/update': {
    ttl: 60000,     // 1 minute
    limit: 200,     // 200 progress updates per minute
  },
  
  // Health checks - very high limits
  '/health': {
    ttl: 60000,     // 1 minute
    limit: 1000,    // 1000 health checks per minute
  },
  '/metrics': {
    ttl: 60000,     // 1 minute
    limit: 600,     // 600 metrics requests per minute (Prometheus scraping)
  }
};

export const IP_WHITELIST = [
  '127.0.0.1',
  '::1',
  '10.0.0.0/8',     // Private networks
  '172.16.0.0/12',  // Private networks
  '192.168.0.0/16', // Private networks
];

export const RATE_LIMIT_HEADERS = {
  rateLimitHeadersEnabled: true,
  rateLimitHeaderPrefix: 'X-RateLimit-',
  responseHeaders: {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    retryAfter: 'Retry-After'
  }
};