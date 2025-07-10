import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContentIntelligenceService } from './content-intelligence.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('content-intelligence')
@Controller('api/content-intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ContentIntelligenceController {
  constructor(private readonly contentIntelligenceService: ContentIntelligenceService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check content intelligence service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealth() {
    return this.contentIntelligenceService.getHealth();
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze content comprehensively' })
  @ApiResponse({ status: 200, description: 'Content analysis completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid content data' })
  async analyzeContent(
    @Body() analysisData: any,
    @Headers() headers: any,
  ) {
    return this.contentIntelligenceService.analyzeContent(analysisData);
  }

  @Post('generate-questions')
  @ApiOperation({ summary: 'Generate questions from content' })
  @ApiResponse({ status: 200, description: 'Questions generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid question generation data' })
  async generateQuestions(
    @Body() questionData: any,
    @Headers() headers: any,
  ) {
    return this.contentIntelligenceService.generateQuestions(questionData);
  }

  @Post('improve')
  @ApiOperation({ summary: 'Get content improvement suggestions' })
  @ApiResponse({ status: 200, description: 'Content improvement suggestions generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid improvement request data' })
  async improveContent(
    @Body() improvementData: any,
    @Headers() headers: any,
  ) {
    return this.contentIntelligenceService.improveContent(improvementData);
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate content to target language' })
  @ApiResponse({ status: 200, description: 'Content translated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid translation request data' })
  async translateContent(
    @Body() translationData: any,
    @Headers() headers: any,
  ) {
    return this.contentIntelligenceService.translateContent(translationData);
  }
}