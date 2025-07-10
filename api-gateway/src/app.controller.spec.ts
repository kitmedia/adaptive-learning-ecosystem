import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

describe('AppController', () => {
  let controller: AppController;
  let mockAppService: Partial<AppService>;

  beforeEach(async () => {
    // Mock del AppService
    mockAppService = {
      getHealth: jest.fn().mockReturnValue({
        status: 'healthy',
        service: 'adaptive-learning-api-gateway',
        timestamp: '2025-01-07T15:30:00.000Z',
        version: '1.0.0',
        environment: 'test'
      }),
      getSystemInfo: jest.fn().mockReturnValue({
        name: 'Adaptive Learning API Gateway',
        version: '1.0.0',
        description: 'API Gateway for Adaptive Learning Ecosystem',
        environment: 'test'
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const result = await controller.getHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('service');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version');
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('adaptive-learning-api-gateway');
    });
  });

  describe('getInfo', () => {
    it('should return API information', async () => {
      const result = await controller.getInfo();

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('environment');
      expect(result.name).toBe('Adaptive Learning API Gateway');
    });
  });
});