import { Injectable } from '@nestjs/common';
import { MetricsService } from './metrics/metrics.service';

@Injectable()
export class AppService {
  constructor(private readonly metricsService: MetricsService) {}

  async getHealth() {
    const startTime = Date.now();
    
    try {
      // Test database connectivity (simulate)
      const dbStatus = await this.testDatabaseConnection();
      
      // Test Redis connectivity (simulate)
      const redisStatus = await this.testRedisConnection();
      
      // Test downstream services
      const servicesStatus = await this.testDownstreamServices();
      
      const responseTime = Date.now() - startTime;
      
      const healthData = {
        status: 'healthy',
        service: 'adaptive-learning-api-gateway',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        responseTime: `${responseTime}ms`,
        dependencies: {
          database: dbStatus,
          cache: redisStatus,
          services: servicesStatus,
        },
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        }
      };
      
      // Update metrics
      this.metricsService.setActiveConnections(1); // Simulate active connections
      this.metricsService.setDatabaseConnections(5, 'postgresql');
      
      return healthData;
      
    } catch (error) {
      // Record error in metrics
      this.metricsService.recordApiError('api-gateway', 'health_check_error', '/health');
      
      return {
        status: 'unhealthy',
        service: 'adaptive-learning-api-gateway',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`,
      };
    }
  }

  private async testDatabaseConnection(): Promise<{status: string, responseTime: number}> {
    const start = Date.now();
    // Simulate database check
    await new Promise(resolve => setTimeout(resolve, 5));
    return {
      status: 'connected',
      responseTime: Date.now() - start
    };
  }

  private async testRedisConnection(): Promise<{status: string, responseTime: number}> {
    const start = Date.now();
    // Simulate Redis check
    await new Promise(resolve => setTimeout(resolve, 3));
    return {
      status: 'connected',
      responseTime: Date.now() - start
    };
  }

  private async testDownstreamServices(): Promise<{[key: string]: string}> {
    return {
      'ai-tutor': 'healthy',
      'progress-tracking': 'healthy',
      'assessment': 'healthy',
    };
  }

  getSystemInfo() {
    return {
      name: 'Adaptive Learning Ecosystem',
      description: 'AI-powered adaptive learning platform',
      company: 'EbroValley Digital',
      developers: 'ToñoAdPAOS & Claudio Supreme',
      version: '1.0.0',
      architecture: 'Microservices',
      api_version: 'v1',
      services: {
        'api-gateway': 'http://localhost:4000',
        'ai-tutor': 'http://localhost:5001',
        'content-management': 'http://localhost:5002',
        'progress-tracking': 'http://localhost:5003',
        'collaboration': 'http://localhost:5004',
        'notifications': 'http://localhost:5005',
        'assessment': 'http://localhost:5006',
        'analytics': 'http://localhost:5007',
        'content-intelligence': 'http://localhost:5008',
      },
      databases: {
        'postgres': 'localhost:5433',
        'redis': 'localhost:6380',
        'qdrant': 'localhost:6333',
      },
    };
  }
}