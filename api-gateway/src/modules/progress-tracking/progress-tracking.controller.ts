import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, Res, HttpStatus } from '@nestjs/common';
import { ProgressTrackingService } from './progress-tracking.service';
import { Request, Response } from 'express';

@Controller('progress')
export class ProgressTrackingController {
  constructor(private readonly progressTrackingService: ProgressTrackingService) {}

  @Get('health')
  async getHealth(@Res() res: Response) {
    try {
      const response = await this.progressTrackingService.checkHealth();
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        error: 'Progress Tracking Service unavailable',
        message: error.message
      });
    }
  }

  @Post('update')
  async updateProgress(@Body() progressData: any, @Res() res: Response) {
    try {
      const response = await this.progressTrackingService.updateProgress(progressData);
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update progress',
        message: error.message
      });
    }
  }

  @Get('student/:studentId/course/:courseId')
  async getStudentProgress(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
    @Res() res: Response
  ) {
    try {
      const response = await this.progressTrackingService.getStudentProgress(studentId, courseId);
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get student progress',
        message: error.message
      });
    }
  }

  @Get('student/:studentId/summary')
  async getStudentSummary(
    @Param('studentId') studentId: string,
    @Res() res: Response
  ) {
    try {
      const response = await this.progressTrackingService.getStudentSummary(studentId);
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get student summary',
        message: error.message
      });
    }
  }
}