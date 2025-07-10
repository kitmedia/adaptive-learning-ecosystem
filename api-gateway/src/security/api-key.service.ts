import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  hashedKey: string;
  permissions: string[];
  rateLimit: {
    requests: number;
    period: number; // in seconds
  };
  usageCount: number;
  lastUsed: Date | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyUsage {
  keyId: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  ip: string;
  userAgent?: string;
  responseStatus: number;
  responseTime: number;
}

@Injectable()
export class ApiKeyService {
  private apiKeys: Map<string, ApiKey> = new Map();
  private usageHistory: ApiKeyUsage[] = [];

  constructor(private configService: ConfigService) {
    this.initializeDefaultApiKeys();
  }

  private initializeDefaultApiKeys(): void {
    // Create default API keys for development/testing
    const defaultKeys = [
      {
        name: 'Development Key',
        permissions: ['read', 'write'],
        rateLimit: { requests: 1000, period: 3600 } // 1000 requests per hour
      },
      {
        name: 'Read-Only Key',
        permissions: ['read'],
        rateLimit: { requests: 500, period: 3600 } // 500 requests per hour
      },
      {
        name: 'Analytics Key',
        permissions: ['read', 'analytics'],
        rateLimit: { requests: 10000, period: 3600 } // 10000 requests per hour
      }
    ];

    defaultKeys.forEach(keyData => {
      const apiKey = this.createApiKey(keyData.name, keyData.permissions, keyData.rateLimit);
      console.log(`Created API Key: ${keyData.name} - ${apiKey.key}`);
    });
  }

  generateApiKey(): string {
    // Generate a secure random API key
    const prefix = 'al_'; // adaptive-learning prefix
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  createApiKey(
    name: string,
    permissions: string[] = ['read'],
    rateLimit: { requests: number; period: number } = { requests: 100, period: 3600 },
    expiresAt?: Date
  ): ApiKey {
    const key = this.generateApiKey();
    const hashedKey = this.hashApiKey(key);
    const id = crypto.randomUUID();

    const apiKey: ApiKey = {
      id,
      name,
      key, // Store plain key only during creation
      hashedKey,
      permissions,
      rateLimit,
      usageCount: 0,
      lastUsed: null,
      isActive: true,
      expiresAt: expiresAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store by hashed key for security
    this.apiKeys.set(hashedKey, { ...apiKey, key: '[REDACTED]' });

    return apiKey; // Return with plain key only once
  }

  async validateApiKey(apiKey: string): Promise<ApiKey> {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Remove prefix if present and validate format
    const cleanKey = apiKey.startsWith('al_') ? apiKey : `al_${apiKey}`;
    const hashedKey = this.hashApiKey(cleanKey);

    const storedKey = this.apiKeys.get(hashedKey);
    if (!storedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is active
    if (!storedKey.isActive) {
      throw new UnauthorizedException('API key is disabled');
    }

    // Check if key has expired
    if (storedKey.expiresAt && storedKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    return storedKey;
  }

  async checkRateLimit(apiKey: ApiKey, endpoint: string): Promise<boolean> {
    const now = new Date();
    const periodStart = new Date(now.getTime() - (apiKey.rateLimit.period * 1000));

    // Count recent usage for this key
    const recentUsage = this.usageHistory.filter(usage => 
      usage.keyId === apiKey.id && 
      usage.timestamp >= periodStart
    );

    if (recentUsage.length >= apiKey.rateLimit.requests) {
      throw new ForbiddenException(
        `Rate limit exceeded. Limit: ${apiKey.rateLimit.requests} requests per ${apiKey.rateLimit.period} seconds`
      );
    }

    return true;
  }

  async recordUsage(
    apiKey: ApiKey,
    endpoint: string,
    method: string,
    ip: string,
    responseStatus: number,
    responseTime: number,
    userAgent?: string
  ): Promise<void> {
    const usage: ApiKeyUsage = {
      keyId: apiKey.id,
      endpoint,
      method,
      timestamp: new Date(),
      ip,
      userAgent,
      responseStatus,
      responseTime
    };

    this.usageHistory.push(usage);

    // Update API key usage count and last used
    const storedKey = this.apiKeys.get(apiKey.hashedKey);
    if (storedKey) {
      storedKey.usageCount++;
      storedKey.lastUsed = new Date();
      storedKey.updatedAt = new Date();
    }

    // Clean old usage history (keep last 24 hours)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.usageHistory = this.usageHistory.filter(usage => usage.timestamp >= dayAgo);
  }

  checkPermission(apiKey: ApiKey, requiredPermission: string): boolean {
    return apiKey.permissions.includes(requiredPermission) || 
           apiKey.permissions.includes('admin');
  }

  getAllApiKeys(): Omit<ApiKey, 'hashedKey'>[] {
    return Array.from(this.apiKeys.values()).map(key => {
      const { hashedKey, ...safeKey } = key;
      return safeKey;
    });
  }

  getApiKeyUsage(keyId?: string, limit: number = 100): ApiKeyUsage[] {
    let usage = this.usageHistory;
    
    if (keyId) {
      usage = usage.filter(u => u.keyId === keyId);
    }

    return usage
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getUsageStats(keyId?: string): {
    totalRequests: number;
    requestsLast24h: number;
    requestsLastHour: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    let usage = this.usageHistory;
    if (keyId) {
      usage = usage.filter(u => u.keyId === keyId);
    }

    const totalRequests = usage.length;
    const requestsLast24h = usage.filter(u => u.timestamp >= last24h).length;
    const requestsLastHour = usage.filter(u => u.timestamp >= lastHour).length;
    
    const responseTimes = usage.map(u => u.responseTime).filter(t => t > 0);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const errorRequests = usage.filter(u => u.responseStatus >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    return {
      totalRequests,
      requestsLast24h,
      requestsLastHour,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  deactivateApiKey(keyId: string): boolean {
    for (const [hashedKey, apiKey] of this.apiKeys.entries()) {
      if (apiKey.id === keyId) {
        apiKey.isActive = false;
        apiKey.updatedAt = new Date();
        return true;
      }
    }
    return false;
  }

  updateApiKeyRateLimit(keyId: string, rateLimit: { requests: number; period: number }): boolean {
    for (const [hashedKey, apiKey] of this.apiKeys.entries()) {
      if (apiKey.id === keyId) {
        apiKey.rateLimit = rateLimit;
        apiKey.updatedAt = new Date();
        return true;
      }
    }
    return false;
  }
}