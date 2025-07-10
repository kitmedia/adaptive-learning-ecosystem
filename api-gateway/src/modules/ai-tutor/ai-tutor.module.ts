import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiTutorController } from './ai-tutor.controller';
import { AiTutorService } from './ai-tutor.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    AuthModule,
  ],
  controllers: [AiTutorController],
  providers: [AiTutorService],
  exports: [AiTutorService],
})
export class AiTutorModule {}