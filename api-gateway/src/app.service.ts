import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'healthy',
      service: 'adaptive-learning-api-gateway',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
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