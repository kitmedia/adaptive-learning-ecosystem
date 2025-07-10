import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private readonly collaborationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.collaborationServiceUrl = 
      this.configService.get<string>('COLLABORATION_SERVICE_URL') || 
      'http://localhost:8008';
  }

  async proxyRequest(path: string, method: string, data?: any, headers?: any) {
    try {
      const url = `${this.collaborationServiceUrl}${path}`;
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
      this.logger.error(`Collaboration service request failed: ${error.message}`);
      throw error;
    }
  }

  async getHealth() {
    return this.proxyRequest('/health', 'GET');
  }

  async createSession(sessionData: any) {
    return this.proxyRequest('/sessions', 'POST', sessionData);
  }

  async getSession(sessionId: string) {
    return this.proxyRequest(`/sessions/${sessionId}`, 'GET');
  }

  async joinSession(sessionId: string, joinData: any) {
    return this.proxyRequest(`/sessions/${sessionId}/join`, 'POST', joinData);
  }

  async getWebSocketUrl(): Promise<string> {
    return `${this.collaborationServiceUrl.replace('http', 'ws')}/ws/collaborate`;
  }
}