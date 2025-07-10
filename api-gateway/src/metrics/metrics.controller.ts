import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('Monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Prometheus Metrics',
    description: 'Returns all system metrics in Prometheus format for monitoring and alerting'
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics successfully retrieved',
    schema: {
      type: 'string',
      example: `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200",service="api-gateway"} 42`
    }
  })
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}