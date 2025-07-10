import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ProgressTrackingController } from './progress-tracking.controller';
import { ProgressTrackingService } from './progress-tracking.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    ConfigModule,
    AuthModule,
  ],
  controllers: [ProgressTrackingController],
  providers: [ProgressTrackingService],
  exports: [ProgressTrackingService],
})
export class ProgressTrackingModule {}