import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/auth.module';
import { ContentManagementController } from './content-management.controller';
import { ContentManagementService } from './content-management.service';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [ContentManagementController],
  providers: [ContentManagementService],
  exports: [ContentManagementService],
})
export class ContentManagementModule {}