# 🔌 API REFERENCE - ADAPTIVE LEARNING ECOSYSTEM

## 📊 Overview

Este documento describe todas las APIs disponibles en el Adaptive Learning Ecosystem. El sistema utiliza una arquitectura de microservicios con un API Gateway como punto de entrada único.

**Base URL**: `http://localhost:4000`  
**Autenticación**: JWT Bearer Token  
**Content-Type**: `application/json`

---

## 🔐 Autenticación

### POST /auth/login
Autenticar usuario y obtener tokens JWT.

**Request:**
```json
{
  "username": "ana_estudiante",
  "password": "demo123"
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "username": "ana_estudiante",
    "email": "ana@ebrovalley.com",
    "role": "student"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "Login successful"
}
```

**Status Codes:**
- `200 OK`: Login exitoso
- `401 Unauthorized`: Credenciales inválidas
- `429 Too Many Requests`: Rate limit excedido

### POST /auth/refresh
Renovar tokens de acceso usando refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "Tokens refreshed successfully"
}
```

### POST /auth/logout
Cerrar sesión e invalidar tokens.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### GET /auth/verify
Verificar validez del token de acceso.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "sub": "550e8400-e29b-41d4-a716-446655440003",
    "username": "ana_estudiante",
    "email": "ana@ebrovalley.com",
    "role": "student"
  },
  "message": "Token is valid"
}
```

### POST /auth/demo-token
Generar token de demostración para testing.

**Response:**
```json
{
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "username": "ana_estudiante",
    "email": "ana@ebrovalley.com",
    "role": "student"
  },
  "message": "Demo token generated successfully"
}
```

---

## 🤖 AI-Tutor Service

### GET /api/v1/ai-tutor/health
Health check del servicio AI-Tutor.

**Response:**
```json
{
  "status": "healthy",
  "service": "AI-Tutor",
  "timestamp": "2025-01-07T15:30:00Z",
  "version": "1.0.0"
}
```

### POST /api/v1/ai-tutor/diagnostic
Realizar diagnóstico inicial del estudiante.

**Request:**
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440003",
  "subject": "mathematics",
  "responses": [
    {
      "question_id": "q1",
      "answer": "x = 5",
      "time_spent": 45
    }
  ]
}
```

**Response:**
```json
{
  "diagnostic_id": "diag_12345",
  "student_level": "intermediate",
  "strengths": ["algebra", "basic_equations"],
  "weaknesses": ["geometry", "trigonometry"],
  "recommended_path": {
    "starting_lesson": "algebra_foundations",
    "difficulty": "medium",
    "estimated_duration": 120
  },
  "confidence_score": 0.85
}
```

### POST /api/v1/ai-tutor/adaptive-path
Generar ruta de aprendizaje adaptativa.

**Request:**
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440003",
  "current_performance": {
    "accuracy": 0.75,
    "speed": 0.80,
    "engagement": 0.90
  },
  "learning_preferences": {
    "style": "visual",
    "pace": "medium",
    "difficulty": "adaptive"
  }
}
```

**Response:**
```json
{
  "path_id": "path_67890",
  "lessons": [
    {
      "lesson_id": "lesson_001",
      "title": "Linear Equations",
      "order": 1,
      "estimated_time": 30,
      "difficulty": "medium",
      "prerequisites": []
    },
    {
      "lesson_id": "lesson_002",
      "title": "Quadratic Equations",
      "order": 2,
      "estimated_time": 45,
      "difficulty": "medium",
      "prerequisites": ["lesson_001"]
    }
  ],
  "adaptation_reason": "Based on strong algebra foundation, medium difficulty recommended"
}
```

### POST /api/v1/ai-tutor/realtime-feedback
Obtener feedback en tiempo real durante el aprendizaje.

**Request:**
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440003",
  "lesson_id": "lesson_001",
  "current_answer": "x = 3",
  "context": {
    "attempt_number": 2,
    "time_spent": 120,
    "hint_used": false
  }
}
```

**Response:**
```json
{
  "feedback_type": "encouragement",
  "message": "Great approach! You're on the right track. Try checking your arithmetic in the second step.",
  "hints": [
    "Remember to distribute the coefficient",
    "Check your signs when moving terms"
  ],
  "confidence": 0.92,
  "next_suggestion": "continue"
}
```

---

## 📈 Progress Tracking Service

### GET /api/v1/progress/health
Health check del servicio de progreso.

**Response:**
```json
{
  "status": "healthy",
  "service": "Progress-Tracking",
  "timestamp": "2025-01-07T15:30:00Z",
  "version": "1.0.0"
}
```

### GET /api/v1/progress/student/{student_id}
Obtener progreso completo del estudiante.

**Response:**
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440003",
  "overall_progress": {
    "completion_percentage": 67.5,
    "lessons_completed": 15,
    "lessons_total": 23,
    "average_score": 85.2,
    "time_invested": 1847,
    "streak_days": 7
  },
  "courses": [
    {
      "course_id": "math_101",
      "title": "Algebra Fundamentals",
      "progress_percentage": 80.0,
      "status": "in_progress",
      "last_accessed": "2025-01-07T14:30:00Z"
    }
  ],
  "recent_activity": [
    {
      "activity_type": "lesson_completed",
      "lesson_title": "Linear Equations",
      "score": 92,
      "timestamp": "2025-01-07T14:30:00Z"
    }
  ]
}
```

### POST /api/v1/progress/update
Actualizar progreso del estudiante.

**Request:**
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440003",
  "lesson_id": "lesson_001",
  "course_id": "math_101",
  "status": "completed",
  "progress_percentage": 100.0,
  "time_spent": 1800,
  "score": 88.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress updated successfully",
  "new_achievements": [
    {
      "type": "lesson_master",
      "title": "Lesson Master",
      "description": "Completed lesson with 85%+ score"
    }
  ],
  "gamification_update": {
    "points_earned": 50,
    "new_level": 8,
    "total_points": 897
  }
}
```

### GET /api/v1/progress/analytics/{student_id}
Obtener analytics detallados del estudiante.

**Response:**
```json
{
  "performance_trends": {
    "daily_scores": [85, 87, 83, 90, 88, 92, 89],
    "weekly_time": [120, 135, 98, 156, 143],
    "engagement_score": 0.87
  },
  "learning_patterns": {
    "best_performance_time": "14:00-16:00",
    "preferred_session_length": 45,
    "difficulty_preference": "medium-hard"
  },
  "recommendations": [
    "Consider increasing difficulty for math topics",
    "Schedule sessions during peak performance hours"
  ]
}
```

---

## 📝 Assessment Service

### GET /api/v1/assessments/health
Health check del servicio de evaluaciones.

**Response:**
```json
{
  "status": "healthy",
  "service": "Assessment",
  "timestamp": "2025-01-07T15:30:00Z",
  "version": "1.0.0"
}
```

### GET /api/v1/assessments/available
Obtener evaluaciones disponibles para el estudiante.

**Query Parameters:**
- `student_id`: ID del estudiante
- `course_id`: ID del curso (opcional)
- `difficulty`: Nivel de dificultad (opcional)

**Response:**
```json
{
  "assessments": [
    {
      "id": "assessment_001",
      "title": "Algebra Fundamentals Quiz",
      "description": "Test your knowledge of basic algebra concepts",
      "difficulty_level": "intermediate",
      "estimated_duration": 30,
      "question_count": 15,
      "max_attempts": 3,
      "passing_score": 70.0,
      "available_until": "2025-02-01T23:59:59Z"
    }
  ]
}
```

### POST /api/v1/assessments/start
Iniciar una evaluación.

**Request:**
```json
{
  "assessment_id": "assessment_001",
  "student_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Response:**
```json
{
  "session_id": "session_12345",
  "assessment": {
    "id": "assessment_001",
    "title": "Algebra Fundamentals Quiz",
    "time_limit_minutes": 30,
    "question_count": 15
  },
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Solve for x: 2x + 5 = 13",
      "options": ["x = 3", "x = 4", "x = 5", "x = 6"],
      "points": 10
    }
  ],
  "started_at": "2025-01-07T15:30:00Z"
}
```

### POST /api/v1/assessments/submit
Enviar respuestas de evaluación.

**Request:**
```json
{
  "session_id": "session_12345",
  "answers": [
    {
      "question_id": "q1",
      "answer": "x = 4",
      "time_spent": 45
    },
    {
      "question_id": "q2",
      "answer": "option_b",
      "time_spent": 32
    }
  ]
}
```

**Response:**
```json
{
  "result_id": "result_67890",
  "score": 85.5,
  "percentage_score": 85.5,
  "passed": true,
  "total_questions": 15,
  "correct_answers": 13,
  "time_taken": 1247,
  "feedback": {
    "overall": "Excellent work! You demonstrated strong understanding of algebra fundamentals.",
    "strengths": ["Linear equations", "Basic operations"],
    "areas_for_improvement": ["Word problems", "Complex fractions"]
  },
  "detailed_results": [
    {
      "question_id": "q1",
      "correct": true,
      "points_earned": 10,
      "explanation": "Correct! 2x + 5 = 13, so 2x = 8, therefore x = 4"
    }
  ]
}
```

---

## 🔄 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'Bearer <access_token>'
  }
});
```

### Events

#### progress_update
Actualización de progreso en tiempo real.

**Payload:**
```json
{
  "type": "progress_update",
  "student_id": "550e8400-e29b-41d4-a716-446655440003",
  "data": {
    "lesson_completed": true,
    "new_score": 88,
    "points_earned": 50,
    "achievements": ["lesson_master"]
  }
}
```

#### realtime_feedback
Feedback instantáneo durante el aprendizaje.

**Payload:**
```json
{
  "type": "realtime_feedback",
  "student_id": "550e8400-e29b-41d4-a716-446655440003",
  "feedback": {
    "message": "Great job! You're improving quickly.",
    "type": "encouragement",
    "confidence": 0.9
  }
}
```

#### system_notification
Notificaciones del sistema.

**Payload:**
```json
{
  "type": "system_notification",
  "priority": "high",
  "message": "New assessment available: Advanced Calculus",
  "action_url": "/assessments/calc_advanced"
}
```

---

## ⚠️ Manejo de Errores

### Estructura de Error Estándar
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Username or password is incorrect",
    "details": "Authentication failed for user: ana_estudiante",
    "timestamp": "2025-01-07T15:30:00Z",
    "request_id": "req_12345"
  }
}
```

### Códigos de Error Comunes

| Código | Status | Descripción |
|--------|--------|-------------|
| `INVALID_TOKEN` | 401 | Token JWT inválido o expirado |
| `INSUFFICIENT_PERMISSIONS` | 403 | Permisos insuficientes para la acción |
| `RESOURCE_NOT_FOUND` | 404 | Recurso solicitado no encontrado |
| `VALIDATION_ERROR` | 422 | Error en validación de datos |
| `RATE_LIMIT_EXCEEDED` | 429 | Límite de requests excedido |
| `INTERNAL_SERVER_ERROR` | 500 | Error interno del servidor |
| `SERVICE_UNAVAILABLE` | 503 | Servicio temporalmente no disponible |

---

## 🔄 Rate Limiting

### Límites por Endpoint

| Endpoint | Límite | Ventana |
|----------|---------|----------|
| `/auth/login` | 5 requests | 1 minuto |
| `/auth/refresh` | 10 requests | 1 minuto |
| `/api/v1/**` | 100 requests | 1 minuto |
| `/assessments/submit` | 3 requests | 1 hora |

### Headers de Rate Limit
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1641571800
```

---

## 🔍 Testing

### Ambiente de Testing
**Base URL**: `http://localhost:4000`  
**Credenciales Demo**:
- Username: `ana_estudiante`
- Password: `demo123`

### Ejemplo con cURL
```bash
# 1. Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ana_estudiante","password":"demo123"}'

# 2. Usar token
curl -X GET http://localhost:4000/api/v1/progress/student/550e8400-e29b-41d4-a716-446655440003 \
  -H "Authorization: Bearer <token>"
```

### Collection de Postman
Disponible en: `/docs/postman/adaptive-learning-ecosystem.json`

---

**Última actualización**: Enero 2025  
**Versión API**: v1.0.0  
**Mantenido por**: EbroValley Digital Team