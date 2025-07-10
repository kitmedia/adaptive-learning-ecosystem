import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class ProgressTrackingService {
  private readonly logger = new Logger(ProgressTrackingService.name);
  private readonly progressTrackingUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.progressTrackingUrl = this.configService.get<string>('PROGRESS_TRACKING_URL') || 'http://localhost:5004';
    this.logger.log(`Progress Tracking Service URL: ${this.progressTrackingUrl}`);
  }

  async checkHealth(): Promise<{ status: number; data: any }> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.progressTrackingUrl}/health`)
      );
      
      this.logger.log('Progress Tracking Service health check successful');
      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Progress Tracking Service health check failed', error.message);
      throw new Error(`Progress Tracking Service health check failed: ${error.message}`);
    }
  }

  async updateProgress(progressData: any): Promise<{ status: number; data: any }> {
    try {
      this.logger.log(`Updating progress for student: ${progressData.student_id}, lesson: ${progressData.lesson_id}`);
      
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.progressTrackingUrl}/progress/update`, progressData)
      );
      
      this.logger.log('Progress update successful');
      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to update progress', error.message);
      throw new Error(`Failed to update progress: ${error.message}`);
    }
  }

  async getStudentProgress(studentId: string, courseId: string): Promise<{ status: number; data: any }> {
    try {
      this.logger.log(`Getting progress for student: ${studentId}, course: ${courseId}`);
      
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.progressTrackingUrl}/progress/student/${studentId}/course/${courseId}`)
      );
      
      this.logger.log('Student progress retrieved successfully');
      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to get student progress', error.message);
      throw new Error(`Failed to get student progress: ${error.message}`);
    }
  }

  async getStudentSummary(studentId: string): Promise<{ status: number; data: any }> {
    try {
      this.logger.log(`Getting summary for student: ${studentId}`);
      
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.progressTrackingUrl}/progress/student/${studentId}/summary`)
      );
      
      this.logger.log('Student summary retrieved successfully');
      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to get student summary', error.message);
      throw new Error(`Failed to get student summary: ${error.message}`);
    }
  }
}