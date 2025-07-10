import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);
  private readonly assessmentUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.assessmentUrl = this.configService.get<string>('ASSESSMENT_URL') || 'http://localhost:5005';
    this.logger.log(`Assessment Service URL: ${this.assessmentUrl}`);
  }

  async checkHealth(): Promise<{ status: number; data: any }> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.assessmentUrl}/health`)
      );
      
      this.logger.log('Assessment Service health check successful');
      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Assessment Service health check failed', error.message);
      throw new Error(`Assessment Service health check failed: ${error.message}`);
    }
  }

  async generateAssessment(params: {
    course_id: string;
    difficulty_level?: string;
    num_questions?: number;
    assessment_type?: string;
    lesson_id?: string;
  }): Promise<{ status: number; data: any }> {
    try {
      this.logger.log(`Generating assessment for course: ${params.course_id}`);
      
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.assessmentUrl}/assessments/generate?${queryParams.toString()}`)
      );
      
      this.logger.log('Assessment generated successfully');
      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to generate assessment', error.message);
      throw new Error(`Failed to generate assessment: ${error.message}`);
    }
  }

  async getAssessment(assessmentId: string, includeAnswers: boolean = false): Promise<{ status: number; data: any }> {
    try {
      this.logger.log(`Getting assessment: ${assessmentId}`);
      
      const queryParams = includeAnswers ? '?include_answers=true' : '';
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.assessmentUrl}/assessments/${assessmentId}${queryParams}`)
      );
      
      this.logger.log('Assessment retrieved successfully');
      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to get assessment', error.message);
      throw new Error(`Failed to get assessment: ${error.message}`);
    }
  }

  async submitAssessment(assessmentId: string, submissionData: any): Promise<{ status: number; data: any }> {
    try {
      this.logger.log(`Processing assessment submission for: ${assessmentId}`);
      
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.assessmentUrl}/assessments/${assessmentId}/submit`, submissionData)
      );
      
      this.logger.log('Assessment submission processed successfully');
      return {
        status: response.status,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to submit assessment', error.message);
      throw new Error(`Failed to submit assessment: ${error.message}`);
    }
  }
}