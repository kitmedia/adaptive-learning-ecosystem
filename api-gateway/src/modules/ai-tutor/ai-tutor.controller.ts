import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiTutorService } from './ai-tutor.service';

@Controller('ai-tutor')
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @Get('health')
  async checkHealth() {
    try {
      return await this.aiTutorService.getHealth();
    } catch (error) {
      throw new HttpException(
        error.message || 'AI-Tutor service unavailable',
        error.statusCode || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('diagnostic/generate')
  async generateDiagnostic(@Query('student_id') studentId: string) {
    if (!studentId) {
      throw new HttpException('student_id is required', HttpStatus.BAD_REQUEST);
    }
    
    try {
      return await this.aiTutorService.generateDiagnostic(studentId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate diagnostic',
        error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('diagnostic/analyze')
  async analyzeDiagnostic(@Body() data: any) {
    if (!data.student_id || !data.responses) {
      throw new HttpException(
        'student_id and responses are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.aiTutorService.analyzeDiagnostic(data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to analyze diagnostic',
        error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('path/adaptive/:studentId')
  async getAdaptivePath(
    @Param('studentId') studentId: string,
    @Query('course_id') courseId?: string,
  ) {
    try {
      return await this.aiTutorService.getAdaptivePath(studentId, courseId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate adaptive path',
        error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('feedback/realtime')
  async generateFeedback(@Body() data: any) {
    if (!data.student_id || !data.activity_data) {
      throw new HttpException(
        'student_id and activity_data are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.aiTutorService.generateFeedback(data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate feedback',
        error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('students/:studentId/profile')
  async getStudentProfile(@Param('studentId') studentId: string) {
    try {
      return await this.aiTutorService.getStudentProfile(studentId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get student profile',
        error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}