import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';
import { CustomThrottlerGuard } from './custom-throttler.guard';
import { SecurityController } from './security.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { AuthModule } from '../auth/auth.module';
import { DEFAULT_RATE_LIMITS } from './rate-limit.config';

@Module({
  imports: [
    // Configure global throttling
    ThrottlerModule.forRoot(DEFAULT_RATE_LIMITS),
    MetricsModule,
    AuthModule,
  ],
  controllers: [SecurityController],
  providers: [
    ApiKeyService,
    CustomThrottlerGuard,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    // Note: ApiKeyGuard is applied selectively using @UseGuards() decorator
    ApiKeyGuard,
  ],
  exports: [ApiKeyService, ApiKeyGuard, CustomThrottlerGuard],
})
export class SecurityModule {}