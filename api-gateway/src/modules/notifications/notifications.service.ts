import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notificationsServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.notificationsServiceUrl = 
      this.configService.get<string>('NOTIFICATIONS_SERVICE_URL') || 
      'http://localhost:8007';
  }

  async proxyRequest(path: string, method: string, data?: any, headers?: any) {
    try {
      const url = `${this.notificationsServiceUrl}${path}`;
      this.logger.debug(`Proxying ${method} request to: ${url}`);

      const config = {
        method,
        url,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        ...(data && { data }),
      };

      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error) {
      this.logger.error(`Notifications service request failed: ${error.message}`);
      throw error;
    }
  }

  async getHealth() {
    return this.proxyRequest('/health', 'GET');
  }

  async sendNotification(notificationData: any) {
    return this.proxyRequest('/notifications/send', 'POST', notificationData);
  }

  async sendBulkNotifications(bulkData: any) {
    return this.proxyRequest('/notifications/send-bulk', 'POST', bulkData);
  }

  async getUserNotifications(userId: string, query?: any) {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    return this.proxyRequest(`/notifications/${userId}${queryString}`, 'GET');
  }
}