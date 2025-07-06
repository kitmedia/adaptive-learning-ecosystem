import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealtimeGateway } from './realtime/realtime.gateway';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting para protección API
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto
      limit: 100, // 100 requests por minuto
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RealtimeGateway,
  ],
})
export class AppModule {}