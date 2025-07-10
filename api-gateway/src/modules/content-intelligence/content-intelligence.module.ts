import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ContentIntelligenceController } from './content-intelligence.controller';
import { ContentIntelligenceService } from './content-intelligence.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ContentIntelligenceController],
  providers: [ContentIntelligenceService],
  exports: [ContentIntelligenceService],
})
export class ContentIntelligenceModule {}