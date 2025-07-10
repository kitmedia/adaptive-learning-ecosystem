import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
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
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}