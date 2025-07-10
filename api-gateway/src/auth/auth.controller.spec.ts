import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { JwtAuthService } from './jwt.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockJwtService: Partial<JwtAuthService>;

  beforeEach(async () => {
    // Mock del JwtAuthService
    mockJwtService = {
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      }),
      validateAccessToken: jest.fn().mockResolvedValue({
        sub: 'test-user-id',
        username: 'test-user',
        email: 'test@example.com',
        role: 'student'
      }),
      refreshAccessTokens: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      }),
      generateDemoToken: jest.fn().mockResolvedValue({
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        expiresIn: 3600
      }),
      revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
      getTokenStats: jest.fn().mockReturnValue({
        activeTokens: 5,
        totalIssued: 20
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: JwtAuthService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      // Mock bcrypt.compare to return true for valid credentials
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const loginDto = {
        username: 'ana_estudiante',
        password: 'demo123'
      };

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Login successful');
      expect(result.user.username).toBe('ana_estudiante');
      expect(mockJwtService.generateTokenPair).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = {
        username: 'invalid_user',
        password: 'wrong_password'
      };

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // Mock bcrypt.compare to return false for invalid password
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const loginDto = {
        username: 'ana_estudiante',
        password: 'wrong_password'
      };

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('generateDemoToken', () => {
    it('should return demo tokens', async () => {
      const result = await controller.generateDemoToken();

      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Demo token generated successfully');
    });
  });

  describe('getAuthStats', () => {
    it('should return authentication statistics', async () => {
      const result = await controller.getAuthStats();

      expect(result).toHaveProperty('tokenStats');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('timestamp');
    });
  });
});