import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('notifications')
@Controller('api/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check notifications service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealth() {
    return this.notificationsService.getHealth();
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a single notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid notification data' })
  async sendNotification(
    @Body() notificationData: any,
    @Headers() headers: any,
  ) {
    return this.notificationsService.sendNotification(notificationData);
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send bulk notifications' })
  @ApiResponse({ status: 201, description: 'Bulk notifications queued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid bulk notification data' })
  async sendBulkNotifications(
    @Body() bulkData: any,
    @Headers() headers: any,
  ) {
    return this.notificationsService.sendBulkNotifications(bulkData);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of notifications to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of notifications to skip' })
  @ApiResponse({ status: 200, description: 'User notifications retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query() query: any,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }
}