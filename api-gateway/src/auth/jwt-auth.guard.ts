/**
 * JWT Authentication Guard
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Guard para proteger rutas con JWT
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthService, extractTokenFromHeader } from './jwt.service';

/**
 * Decorator para marcar rutas como públicas (sin autenticación)
 */
export const Public = () => {
  const SetMetadata = require('@nestjs/common').SetMetadata;
  return SetMetadata('isPublic', true);
};

/**
 * Decorator para especificar roles requeridos
 */
export const RequiredRoles = (...roles: string[]) => {
  const SetMetadata = require('@nestjs/common').SetMetadata;
  return SetMetadata('roles', roles);
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtAuthService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Acción específica: Validar token JWT en cada request
   * Razón: Proteger rutas y extraer información del usuario
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Extraer token del header
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Validar token y extraer usuario
      const user = await this.jwtService.validateAccessToken(token);
      request.user = user;

      // Verificar roles si están especificados
      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
          throw new UnauthorizedException(
            `Access denied. Required roles: ${requiredRoles.join(', ')}`
          );
        }
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}