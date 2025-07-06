import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS configuration para desarrollo
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // API prefix
  app.setGlobalPrefix('api/v1');
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log('🚀 Adaptive Learning API Gateway running on port', port);
  console.log('🎓 EbroValley Digital - Educational Excellence');
  console.log('📍 Health check: http://localhost:' + port + '/api/v1/health');
}

bootstrap();