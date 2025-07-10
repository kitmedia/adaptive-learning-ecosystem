import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, Res, HttpStatus } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { Request, Response } from 'express';

@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Get('health')
  async getHealth(@Res() res: Response) {
    try {
      const response = await this.assessmentService.checkHealth();
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        error: 'Assessment Service unavailable',
        message: error.message
      });
    }
  }

  @Post('generate')
  async generateAssessment(
    @Query('course_id') courseId: string,
    @Query('difficulty_level') difficultyLevel: string = 'intermediate',
    @Query('num_questions') numQuestions: number = 5,
    @Query('assessment_type') assessmentType: string = 'quiz',
    @Query('lesson_id') lessonId: string,
    @Res() res: Response
  ) {
    try {
      const response = await this.assessmentService.generateAssessment({
        course_id: courseId,
        difficulty_level: difficultyLevel,
        num_questions: numQuestions,
        assessment_type: assessmentType,
        lesson_id: lessonId
      });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to generate assessment',
        message: error.message
      });
    }
  }

  @Get(':assessmentId')
  async getAssessment(
    @Param('assessmentId') assessmentId: string,
    @Query('include_answers') includeAnswers: boolean = false,
    @Res() res: Response
  ) {
    try {
      const response = await this.assessmentService.getAssessment(assessmentId, includeAnswers);
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get assessment',
        message: error.message
      });
    }
  }

  @Post(':assessmentId/submit')
  async submitAssessment(
    @Param('assessmentId') assessmentId: string,
    @Body() submissionData: any,
    @Res() res: Response
  ) {
    try {
      const response = await this.assessmentService.submitAssessment(assessmentId, submissionData);
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to submit assessment',
        message: error.message
      });
    }
  }
}