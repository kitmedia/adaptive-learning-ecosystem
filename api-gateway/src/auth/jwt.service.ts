/**
 * JWT Service with Refresh Tokens
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Enterprise-grade authentication system
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface UserPayload {
  sub: string; // user id
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

@Injectable()
export class JwtAuthService {
  private refreshTokensStorage: Map<string, RefreshTokenData> = new Map();
  
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Acción específica: Generar par de tokens (access + refresh)
   * Razón: Seguridad empresarial con tokens de corta duración
   */
  async generateTokenPair(user: UserPayload): Promise<TokenPair> {
    const payload: UserPayload = {
      sub: user.sub,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
    });

    // Generate refresh token (long-lived)
    const refreshTokenId = uuidv4();
    const refreshToken = this.jwtService.sign(
      { 
        sub: user.sub, 
        tokenId: refreshTokenId,
        type: 'refresh'
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }
    );

    // Store refresh token metadata
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    this.refreshTokensStorage.set(refreshTokenId, {
      id: refreshTokenId,
      userId: user.sub,
      token: await this.hashToken(refreshToken),
      expiresAt,
      isRevoked: false,
      createdAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  /**
   * Acción específica: Validar access token
   * Razón: Verificar autenticación en cada request
   */
  async validateAccessToken(token: string): Promise<UserPayload> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      return {
        sub: payload.sub,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Acción específica: Renovar tokens usando refresh token
   * Razón: Mantener sesión activa sin re-login constante
   */
  async refreshAccessTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token structure
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if refresh token exists and is valid
      const storedToken = this.refreshTokensStorage.get(payload.tokenId);
      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired or revoked');
      }

      // Verify token hash
      const isValidToken = await bcrypt.compare(refreshToken, storedToken.token);
      if (!isValidToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke old refresh token
      this.refreshTokensStorage.delete(payload.tokenId);

      // Generate new token pair
      const userPayload: UserPayload = {
        sub: payload.sub,
        username: '', // Would normally fetch from database
        email: '',    // Would normally fetch from database
        role: 'student', // Would normally fetch from database
      };

      return this.generateTokenPair(userPayload);

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Acción específica: Revocar refresh token
   * Razón: Logout seguro e invalidación de sesiones
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    const token = this.refreshTokensStorage.get(tokenId);
    if (token) {
      token.isRevoked = true;
      this.refreshTokensStorage.set(tokenId, token);
    }
  }

  /**
   * Acción específica: Revocar todos los tokens de un usuario
   * Razón: Logout desde todos los dispositivos
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    for (const [tokenId, tokenData] of this.refreshTokensStorage.entries()) {
      if (tokenData.userId === userId) {
        tokenData.isRevoked = true;
        this.refreshTokensStorage.set(tokenId, tokenData);
      }
    }
  }

  /**
   * Acción específica: Limpiar tokens expirados
   * Razón: Mantenimiento automático de memoria
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    for (const [tokenId, tokenData] of this.refreshTokensStorage.entries()) {
      if (tokenData.expiresAt < now) {
        this.refreshTokensStorage.delete(tokenId);
      }
    }
  }

  /**
   * Acción específica: Hash del token
   * Razón: Almacenar tokens de forma segura
   */
  private async hashToken(token: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(token, saltRounds);
  }

  /**
   * Acción específica: Generar token de demo
   * Razón: Facilitar testing y desarrollo
   */
  async generateDemoToken(): Promise<TokenPair> {
    const demoUser: UserPayload = {
      sub: '550e8400-e29b-41d4-a716-446655440003',
      username: 'ana_estudiante',
      email: 'ana@ebrovalley.com',
      role: 'student',
    };

    return this.generateTokenPair(demoUser);
  }

  /**
   * Acción específica: Obtener estadísticas de tokens
   * Razón: Monitoreo y analytics de autenticación
   */
  getTokenStats(): {
    totalRefreshTokens: number;
    activeTokens: number;
    revokedTokens: number;
    expiredTokens: number;
  } {
    const now = new Date();
    let active = 0;
    let revoked = 0;
    let expired = 0;

    for (const tokenData of this.refreshTokensStorage.values()) {
      if (tokenData.isRevoked) {
        revoked++;
      } else if (tokenData.expiresAt < now) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      totalRefreshTokens: this.refreshTokensStorage.size,
      activeTokens: active,
      revokedTokens: revoked,
      expiredTokens: expired,
    };
  }
}

/**
 * Middleware para extraer y validar JWT
 */
export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Decorator para rutas protegidas
 */
export const Roles = (...roles: string[]) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const user = args[0]?.user;
      if (!user || !roles.includes(user.role)) {
        throw new UnauthorizedException(`Access denied. Required roles: ${roles.join(', ')}`);
      }
      return method.apply(this, args);
    };
  };
};