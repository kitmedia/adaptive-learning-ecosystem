/**
 * JWT Strategy for Passport
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Estrategia de autenticación con Passport
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from './jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Acción específica: Validar payload del JWT
   * Razón: Método requerido por Passport para validación
   */
  async validate(payload: any): Promise<UserPayload> {
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      sub: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
  }
}