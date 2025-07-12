import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealtimeGateway } from './realtime/realtime.gateway';
import { AiTutorModule } from './modules/ai-tutor/ai-tutor.module';
import { ProgressTrackingModule } from './modules/progress-tracking/progress-tracking.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { ContentIntelligenceModule } from './modules/content-intelligence/content-intelligence.module';
import { ContentManagementModule } from './modules/content-management/content-management.module';
import { AuthModule } from './auth/auth.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './middleware/metrics.middleware';
import { SecurityModule } from './security/security.module';
import { ApiKeyService } from './security/api-key.service';
import { ApiKeyGuard } from './security/api-key.guard';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Módulo de autenticación
    AuthModule,
    
    // Seguridad y rate limiting
    SecurityModule,
    
    // Módulos de microservicios
    AiTutorModule,
    ProgressTrackingModule,
    AssessmentModule,
    NotificationsModule,
    CollaborationModule,
    ContentIntelligenceModule,
    ContentManagementModule,
    
    // Monitoring y métricas
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RealtimeGateway,
  ],
})
export class AppModule {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware)
      .forRoutes('*'); // Apply metrics middleware to all routes
    
    consumer
      .apply(ApiKeyGuard.createUsageMiddleware(this.apiKeyService))
      .exclude('auth/(.*)') // Exclude auth routes from API key tracking
      .forRoutes('*'); // Apply API key usage tracking to all routes
  }
}