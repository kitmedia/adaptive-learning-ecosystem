import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}