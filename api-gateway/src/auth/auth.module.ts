/**
 * Authentication Module
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Configuración completa de autenticación JWT
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtAuthService } from './jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtAuthService,
    JwtAuthGuard,
    JwtStrategy,
  ],
  exports: [
    JwtAuthService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}