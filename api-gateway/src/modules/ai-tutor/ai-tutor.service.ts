import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class AiTutorService {
  private readonly aiTutorUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiTutorUrl = this.configService.get('AI_TUTOR_SERVICE_URL') || 'http://localhost:5001';
  }

  async proxyRequest(path: string, method: string, data?: any, params?: any): Promise<any> {
    try {
      const url = `${this.aiTutorUrl}${path}`;
      
      const config = {
        method,
        url,
        data,
        params,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.request(config)
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          statusCode: error.response.status,
          message: error.response.data?.detail || error.response.statusText,
          data: error.response.data,
        };
      }
      throw error;
    }
  }

  // Specific methods for AI-Tutor endpoints
  async getHealth() {
    return this.proxyRequest('/health', 'GET');
  }

  async generateDiagnostic(studentId: string) {
    return this.proxyRequest(`/diagnostic/generate?student_id=${studentId}`, 'POST');
  }

  async analyzeDiagnostic(data: any) {
    return this.proxyRequest('/diagnostic/analyze', 'POST', data);
  }

  async getAdaptivePath(studentId: string, courseId?: string) {
    const path = `/path/adaptive/${studentId}`;
    const params = courseId ? { course_id: courseId } : undefined;
    return this.proxyRequest(path, 'GET', null, params);
  }

  async generateFeedback(data: any) {
    return this.proxyRequest('/feedback/realtime', 'POST', data);
  }

  async getStudentProfile(studentId: string) {
    return this.proxyRequest(`/students/${studentId}/profile`, 'GET');
  }
}