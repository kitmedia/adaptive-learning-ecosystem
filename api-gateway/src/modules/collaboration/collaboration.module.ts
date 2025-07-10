import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [CollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}