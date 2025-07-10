import { ValidationPipe } from '@nestjs/common';

// Global test setup for integration tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  
  // Mock external service URLs for testing
  process.env.AI_TUTOR_URL = 'http://localhost:5001';
  process.env.PROGRESS_TRACKING_URL = 'http://localhost:5004';
  process.env.ASSESSMENT_URL = 'http://localhost:5005';
  
  console.log('🧪 Integration test environment configured');
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('🧹 Integration test cleanup completed');
});

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global validation pipe configuration for tests
export const createAppValidationPipe = () => {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
};