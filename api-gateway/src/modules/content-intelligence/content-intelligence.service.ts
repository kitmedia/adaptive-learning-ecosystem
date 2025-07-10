import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ContentIntelligenceService {
  private readonly logger = new Logger(ContentIntelligenceService.name);
  private readonly contentIntelligenceServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.contentIntelligenceServiceUrl = 
      this.configService.get<string>('CONTENT_INTELLIGENCE_SERVICE_URL') || 
      'http://localhost:8009';
  }

  async proxyRequest(path: string, method: string, data?: any, headers?: any) {
    try {
      const url = `${this.contentIntelligenceServiceUrl}${path}`;
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
      this.logger.error(`Content Intelligence service request failed: ${error.message}`);
      throw error;
    }
  }

  async getHealth() {
    return this.proxyRequest('/health', 'GET');
  }

  async analyzeContent(analysisData: any) {
    return this.proxyRequest('/analyze', 'POST', analysisData);
  }

  async generateQuestions(questionData: any) {
    return this.proxyRequest('/generate-questions', 'POST', questionData);
  }

  async improveContent(improvementData: any) {
    return this.proxyRequest('/improve', 'POST', improvementData);
  }

  async translateContent(translationData: any) {
    return this.proxyRequest('/translate', 'POST', translationData);
  }
}