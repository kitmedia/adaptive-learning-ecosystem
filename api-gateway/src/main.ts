import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware - must be applied early
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
  }));

  // CORS configuration - restrictive for production
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://adaptivelearning.com',
          'https://app.adaptivelearning.com',
          'https://admin.adaptivelearning.com'
        ]
      : ['http://localhost:3000', 'http://localhost:5173'], // Development origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  });

  // VALIDATION DISABLED FOR DEBUGGING
  // app.useGlobalPipes(new ValidationPipe({
  //   transform: true,
  //   whitelist: false, // No filtrar propiedades
  //   forbidNonWhitelisted: false, // No rechazar propiedades
  //   disableErrorMessages: false, // Mostrar errores completos
  //   validateCustomDecorators: false, // Desactivar validación personalizada
  //   transformOptions: {
  //     enableImplicitConversion: true, // Conversión automática
  //   },
  // }));
  
  // API prefix
  app.setGlobalPrefix('api/v1');
  
  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Adaptive Learning Ecosystem API')
    .setDescription(`
      # 🎓 Adaptive Learning Ecosystem - API Documentation
      
      **EbroValley Digital** - Educational Excellence Platform
      
      ## Overview
      This API provides comprehensive endpoints for an adaptive learning platform with AI-powered personalization,
      real-time progress tracking, and advanced assessment capabilities.
      
      ## Features
      - 🤖 **AI-Tutor Service**: Personalized learning paths with ML algorithms
      - 📊 **Progress Tracking**: Real-time analytics and performance metrics  
      - 📝 **Assessment Engine**: Adaptive quizzes and evaluations
      - 🔐 **JWT Authentication**: Secure token-based authentication with refresh
      - 🚀 **Real-time Updates**: WebSocket support for live interactions
      - 🏆 **Gamification**: Points, badges, and achievement system
      
      ## Authentication
      Most endpoints require JWT authentication. Include the token in the Authorization header:
      \`\`\`
      Authorization: Bearer <your_jwt_token>
      \`\`\`
      
      ## Rate Limiting
      - Login endpoints: 5 requests per minute
      - General API: 100 requests per minute
      - Assessment submissions: 3 per hour
      
      ## Support
      For technical support: support@ebrovalley.com
    `)
    .setVersion('1.0.0')
    .setContact(
      'EbroValley Digital Team',
      'https://ebrovalley.com',
      'support@ebrovalley.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:4000', 'Development Server')
    .addServer('https://staging-api.adaptivelearning.com', 'Staging Server')
    .addServer('https://api.adaptivelearning.com', 'Production Server')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token for user authentication',
      in: 'header',
    }, 'JWT')
    .addApiKey({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      description: 'API Key for service-to-service authentication',
    }, 'ApiKey')
    .addTag('Authentication', 'User authentication and session management')
    .addTag('AI-Tutor', 'Artificial intelligence tutoring services')
    .addTag('Progress Tracking', 'Learning progress and analytics')
    .addTag('Assessment', 'Testing and evaluation systems')
    .addTag('Security & API Keys', 'API key management and security controls')
    .addTag('Monitoring', 'System health and metrics')
    .addTag('Health', 'Service health checks and status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Enhance document with additional info
  document.info.termsOfService = 'https://ebrovalley.com/terms';
  document.externalDocs = {
    description: 'Full Documentation',
    url: 'https://docs.adaptivelearning.com'
  };
  
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Adaptive Learning API',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { background-color: #1f2937; }
      .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjMwIiB2aWV3Qm94PSIwIDAgMTAwIDMwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1IiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzM0ODNmNCI+RWJyb1ZhbGxleTwvdGV4dD4KPC9zdmc+'); }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      tryItOutEnabled: true,
    },
    customJs: `
      window.onload = function() {
        window.ui.preauthorizeApiKey('JWT-auth', 'Bearer demo_token_here');
      }
    `
  });
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log('🚀 Adaptive Learning API Gateway running on port', port);
  console.log('🎓 EbroValley Digital - Educational Excellence');
  console.log('📍 Health check: http://localhost:' + port + '/api/v1/health');
  console.log('📚 API Documentation: http://localhost:' + port + '/docs');
  console.log('🔍 OpenAPI JSON: http://localhost:' + port + '/docs-json');
}

bootstrap();