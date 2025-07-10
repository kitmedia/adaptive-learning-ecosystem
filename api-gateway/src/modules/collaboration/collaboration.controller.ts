import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('collaboration')
@Controller('api/collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check collaboration service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealth() {
    return this.collaborationService.getHealth();
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new collaboration session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid session data' })
  async createSession(
    @Body() sessionData: any,
    @Headers() headers: any,
  ) {
    return this.collaborationService.createSession(sessionData);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get collaboration session details' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.collaborationService.getSession(sessionId);
  }

  @Post('sessions/:sessionId/join')
  @ApiOperation({ summary: 'Join a collaboration session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Joined session successfully' })
  @ApiResponse({ status: 403, description: 'Access denied or session full' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async joinSession(
    @Param('sessionId') sessionId: string,
    @Body() joinData: any,
    @Headers() headers: any,
  ) {
    return this.collaborationService.joinSession(sessionId, joinData);
  }

  @Get('websocket-url')
  @ApiOperation({ summary: 'Get WebSocket URL for real-time collaboration' })
  @ApiResponse({ status: 200, description: 'WebSocket URL retrieved successfully' })
  async getWebSocketUrl() {
    const wsUrl = await this.collaborationService.getWebSocketUrl();
    return { websocket_url: wsUrl };
  }
}