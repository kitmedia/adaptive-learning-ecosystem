import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth + AI-Tutor Integration (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same configuration as main.ts
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    app.setGlobalPrefix('api/v1');
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should login successfully and return JWT tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'ana_estudiante',
          password: 'demo123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      
      // Store token for next tests
      accessToken = response.body.tokens.accessToken;
      
      expect(accessToken).toBeDefined();
      expect(response.body.user.username).toBe('ana_estudiante');
    });

    it('should generate demo token successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/demo-token')
        .expect(200);

      expect(response.body).toHaveProperty('tokens');
      expect(response.body).toHaveProperty('user');
      expect(response.body.tokens.accessToken).toBeDefined();
    });

    it('should verify token successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
    });
  });

  describe('AI-Tutor Integration with Auth', () => {
    it('should access AI-Tutor health with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai-tutor/health')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });

    it('should generate diagnostic with authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai-tutor/diagnostic/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          student_id: '550e8400-e29b-41d4-a716-446655440003',
          subject: 'mathematics'
        })
        .expect(200);

      expect(response.body).toHaveProperty('student_id');
      expect(response.body).toHaveProperty('assessment');
    });

    it('should get student profile with valid authentication', async () => {
      const studentId = '550e8400-e29b-41d4-a716-446655440003';
      
      const response = await request(app.getHttpServer())
        .get(`/api/v1/ai-tutor/students/${studentId}/profile`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('student_id');
      expect(response.body.student_id).toBe(studentId);
    });

    it('should reject unauthorized access to AI-Tutor endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ai-tutor/health')
        .expect(401);
    });

    it('should reject access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ai-tutor/health')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Progress Tracking Integration with Auth', () => {
    it('should access progress health with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/progress/health')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });

    it('should update progress with authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/progress/update')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          student_id: '550e8400-e29b-41d4-a716-446655440003',
          lesson_id: 'lesson_001',
          course_id: 'math_101',
          action: 'start'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });
  });

  describe('Assessment Integration with Auth', () => {
    it('should access assessment health with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/assessments/health')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });

    it('should generate assessment with authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/assessments/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          student_id: '550e8400-e29b-41d4-a716-446655440003',
          course_id: 'math_101',
          difficulty_level: 'intermediate',
          question_count: 5
        })
        .expect(200);

      expect(response.body).toHaveProperty('assessment_id');
      expect(response.body).toHaveProperty('questions');
    });
  });

  describe('Full Student Learning Flow', () => {
    it('should complete a full learning session flow', async () => {
      const studentId = '550e8400-e29b-41d4-a716-446655440003';
      
      // 1. Generate diagnostic
      const diagnosticResponse = await request(app.getHttpServer())
        .post('/api/v1/ai-tutor/diagnostic/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          student_id: studentId,
          subject: 'mathematics'
        })
        .expect(200);

      expect(diagnosticResponse.body.assessment).toBeDefined();

      // 2. Start lesson progress
      const progressResponse = await request(app.getHttpServer())
        .post('/api/v1/progress/update')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          student_id: studentId,
          lesson_id: 'lesson_001',
          course_id: 'math_101',
          action: 'start'
        })
        .expect(200);

      expect(progressResponse.body.success).toBe(true);

      // 3. Generate assessment
      const assessmentResponse = await request(app.getHttpServer())
        .post('/api/v1/assessments/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          student_id: studentId,
          course_id: 'math_101',
          difficulty_level: 'intermediate',
          question_count: 3
        })
        .expect(200);

      expect(assessmentResponse.body.assessment_id).toBeDefined();

      // 4. Complete lesson progress
      const completeResponse = await request(app.getHttpServer())
        .post('/api/v1/progress/update')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          student_id: studentId,
          lesson_id: 'lesson_001',
          course_id: 'math_101',
          action: 'complete',
          score: 85.5,
          time_spent_seconds: 1800
        })
        .expect(200);

      expect(completeResponse.body.success).toBe(true);
    });
  });
});