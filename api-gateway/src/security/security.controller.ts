import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  BadRequestException 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiKeyService, ApiKey } from './api-key.service';
import { ApiKeyGuard, RequireApiKeyPermission } from './api-key.guard';

class CreateApiKeyDto {
  name: string;
  permissions: string[];
  rateLimit?: {
    requests: number;
    period: number;
  };
  expiresAt?: string; // ISO date string
}

class UpdateRateLimitDto {
  requests: number;
  period: number;
}

@ApiTags('Security & API Keys')
@Controller('security')
@UseGuards(JwtAuthGuard) // Require authentication for all security endpoints
@ApiBearerAuth()
export class SecurityController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('api-keys')
  @ApiOperation({
    summary: 'Create New API Key',
    description: 'Generate a new API key with specified permissions and rate limits'
  })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        key: { type: 'string' },
        permissions: { type: 'array', items: { type: 'string' } },
        rateLimit: {
          type: 'object',
          properties: {
            requests: { type: 'number' },
            period: { type: 'number' }
          }
        }
      }
    }
  })
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto) {
    const { name, permissions, rateLimit, expiresAt } = createApiKeyDto;
    
    if (!name || !permissions || permissions.length === 0) {
      throw new BadRequestException('Name and permissions are required');
    }

    const expirationDate = expiresAt ? new Date(expiresAt) : undefined;
    
    const apiKey = this.apiKeyService.createApiKey(
      name,
      permissions,
      rateLimit || { requests: 100, period: 3600 },
      expirationDate
    );

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key, // Only returned once during creation
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt
    };
  }

  @Get('api-keys')
  @ApiOperation({
    summary: 'List All API Keys',
    description: 'Get all API keys (without exposing the actual keys)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of API keys retrieved successfully'
  })
  async getAllApiKeys() {
    const apiKeys = this.apiKeyService.getAllApiKeys();
    
    return {
      count: apiKeys.length,
      apiKeys: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        usageCount: key.usageCount,
        lastUsed: key.lastUsed,
        isActive: key.isActive,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt
      }))
    };
  }

  @Get('api-keys/:keyId/usage')
  @ApiOperation({
    summary: 'Get API Key Usage Statistics',
    description: 'Retrieve detailed usage statistics for a specific API key'
  })
  @ApiParam({ name: 'keyId', description: 'API Key ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of usage records' })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved successfully'
  })
  async getApiKeyUsage(
    @Param('keyId') keyId: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    
    const usage = this.apiKeyService.getApiKeyUsage(keyId, limitNum);
    const stats = this.apiKeyService.getUsageStats(keyId);

    return {
      keyId,
      statistics: stats,
      recentUsage: usage
    };
  }

  @Get('usage-overview')
  @ApiOperation({
    summary: 'Get Overall Usage Statistics',
    description: 'Get aggregated usage statistics across all API keys'
  })
  @ApiResponse({
    status: 200,
    description: 'Overall usage statistics retrieved successfully'
  })
  async getUsageOverview() {
    const overallStats = this.apiKeyService.getUsageStats();
    const recentUsage = this.apiKeyService.getApiKeyUsage(undefined, 50);

    return {
      overallStatistics: overallStats,
      recentActivity: recentUsage,
      timestamp: new Date().toISOString()
    };
  }

  @Put('api-keys/:keyId/rate-limit')
  @ApiOperation({
    summary: 'Update API Key Rate Limit',
    description: 'Modify the rate limit for a specific API key'
  })
  @ApiParam({ name: 'keyId', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: 'Rate limit updated successfully'
  })
  async updateRateLimit(
    @Param('keyId') keyId: string,
    @Body() updateRateLimitDto: UpdateRateLimitDto
  ) {
    const { requests, period } = updateRateLimitDto;
    
    if (requests <= 0 || period <= 0) {
      throw new BadRequestException('Requests and period must be positive numbers');
    }

    const updated = this.apiKeyService.updateApiKeyRateLimit(keyId, { requests, period });
    
    if (!updated) {
      throw new BadRequestException('API key not found');
    }

    return {
      success: true,
      message: 'Rate limit updated successfully',
      newRateLimit: { requests, period }
    };
  }

  @Delete('api-keys/:keyId')
  @ApiOperation({
    summary: 'Deactivate API Key',
    description: 'Deactivate (disable) an API key without deleting usage history'
  })
  @ApiParam({ name: 'keyId', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: 'API key deactivated successfully'
  })
  async deactivateApiKey(@Param('keyId') keyId: string) {
    const deactivated = this.apiKeyService.deactivateApiKey(keyId);
    
    if (!deactivated) {
      throw new BadRequestException('API key not found');
    }

    return {
      success: true,
      message: 'API key deactivated successfully'
    };
  }

  // Demonstration endpoint that requires API key with specific permission
  @Get('protected-demo')
  @UseGuards(ApiKeyGuard)
  @RequireApiKeyPermission('admin')
  @ApiOperation({
    summary: 'Protected Demo Endpoint',
    description: 'Demonstration endpoint that requires API key with admin permission'
  })
  @ApiResponse({
    status: 200,
    description: 'Access granted to protected resource'
  })
  async protectedDemo(@Request() req: any) {
    return {
      message: 'Access granted to protected resource',
      apiKey: {
        id: req.apiKey?.id,
        name: req.apiKey?.name,
        permissions: req.apiKey?.permissions
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('rate-limit-test')
  @UseGuards(ApiKeyGuard)
  @RequireApiKeyPermission('read')
  @ApiOperation({
    summary: 'Rate Limit Test Endpoint',
    description: 'Test endpoint to verify rate limiting functionality'
  })
  @ApiResponse({
    status: 200,
    description: 'Request processed successfully'
  })
  async rateLimitTest(@Request() req: any) {
    const stats = this.apiKeyService.getUsageStats(req.apiKey?.id);
    
    return {
      message: 'Rate limit test successful',
      requestCount: stats.requestsLastHour,
      limit: req.apiKey?.rateLimit.requests,
      remaining: Math.max(0, req.apiKey?.rateLimit.requests - stats.requestsLastHour),
      timestamp: new Date().toISOString()
    };
  }
}