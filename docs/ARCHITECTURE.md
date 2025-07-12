# 🏗️ ARQUITECTURA DEL SISTEMA - ADAPTIVE LEARNING ECOSYSTEM

## 📊 Visión General

**Adaptive Learning Ecosystem** es una plataforma de aprendizaje adaptativo construida con arquitectura de microservicios, diseñada para escalar horizontalmente y proporcionar experiencias de aprendizaje personalizadas utilizando IA y ML.

### 🎯 Principios Arquitectónicos

1. **Microservicios**: Servicios independientes con responsabilidades específicas
2. **API Gateway Pattern**: Punto único de entrada para clientes
3. **Event-Driven**: Comunicación asíncrona entre servicios
4. **Database per Service**: Cada servicio gestiona sus propios datos
5. **Container-First**: Todo dockerizado para portabilidad
6. **Security by Design**: JWT + RBAC + Encryption

---

## 🌐 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                        │
│                               Port: 3000                                 │
│  ┌────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐  │
│  │ Dashboard  │ │ Assessments  │ │ Progress    │ │ Gamification     │  │
│  └────────────┘ └──────────────┘ └─────────────┘ └──────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS/WSS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (NestJS)                              │
│                            Port: 4000                                    │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────────────┐  │
│  │ Auth Module │ │ Rate Limiter │ │ WebSocket │ │ Circuit Breaker  │  │
│  │    (JWT)    │ │  (Throttle)  │ │  Gateway  │ │                  │  │
│  └─────────────┘ └──────────────┘ └───────────┘ └──────────────────┘  │
└────────┬──────────────────┬─────────────────┬──────────────────────────┘
         │                  │                 │
         ▼                  ▼                 ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  AI-TUTOR SERVICE│ │ PROGRESS TRACKING│ │ ASSESSMENT       │
│   (FastAPI)      │ │    (FastAPI)     │ │   (FastAPI)      │
│   Port: 5001     │ │   Port: 5004     │ │   Port: 5005     │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ • ML Models      │ │ • Analytics      │ │ • Quiz Engine    │
│ • Adaptation     │ │ • Reporting      │ │ • Evaluation     │
│ • Recommendation │ │ • Metrics        │ │ • Feedback       │
│ • NLP Processing │ │ • Achievements   │ │ • Scoring        │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────────┐
         │          DATA LAYER                      │
         │  ┌─────────────┐  ┌─────────────────┐  │
         │  │ PostgreSQL  │  │     Redis       │  │
         │  │ Port: 5432  │  │   Port: 6379    │  │
         │  │             │  │                 │  │
         │  │ • Users     │  │ • Sessions      │  │
         │  │ • Courses   │  │ • Cache         │  │
         │  │ • Progress  │  │ • Pub/Sub       │  │
         │  │ • Analytics │  │ • Rate Limiting │  │
         │  └─────────────┘  └─────────────────┘  │
         └─────────────────────────────────────────┘
```

---

## 🔧 Componentes del Sistema

### 1. Frontend Layer

**Tecnologías**: React 19.1.0, Vite 7.0, TypeScript 5.8.3, Tailwind CSS

**Responsabilidades**:
- Interfaz de usuario responsive y accesible
- State management con Context API
- Real-time updates via WebSocket
- PWA capabilities
- Client-side routing

**Componentes Clave**:
```typescript
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── pages/          # Páginas principales
│   ├── services/       # API y Auth services
│   ├── contexts/       # State management
│   └── utils/          # Utilidades
```

### 2. API Gateway

**Tecnologías**: NestJS 10.x, TypeScript, Socket.io

**Responsabilidades**:
- Routing y load balancing
- Authentication/Authorization (JWT)
- Rate limiting y throttling
- Request/Response transformation
- WebSocket management
- Circuit breaker pattern

**Módulos**:
```typescript
├── src/
│   ├── auth/           # JWT authentication
│   ├── modules/        # Service proxies
│   ├── guards/         # Auth guards
│   ├── interceptors/   # Request interceptors
│   └── realtime/       # WebSocket gateway
```

### 3. Microservicios

#### AI-Tutor Service (Port 5001)
**Responsabilidades**:
- Diagnóstico de nivel inicial
- Generación de rutas de aprendizaje adaptativas
- Ajuste dinámico del ritmo de aprendizaje
- Feedback en tiempo real
- Adaptación del estilo de enseñanza

**ML Models**:
- Random Forest para predicción de rendimiento
- Redes Neuronales para procesamiento NLP
- Algoritmos de recomendación colaborativa

#### Progress Tracking Service (Port 5004)
**Responsabilidades**:
- Tracking de progreso del estudiante
- Generación de analytics y reportes
- Cálculo de métricas de rendimiento
- Sistema de logros y gamificación
- Exportación de datos

#### Assessment Service (Port 5005)
**Responsabilidades**:
- Gestión de evaluaciones y quizzes
- Motor de preguntas adaptativas
- Scoring y evaluación automática
- Generación de feedback detallado
- Banco de preguntas

### 4. Data Layer

#### PostgreSQL
**Uso**: Base de datos principal
**Esquema**: 12 tablas normalizadas
- users
- courses
- lessons
- student_progress
- assessments
- assessment_results
- learning_profiles
- adaptations
- student_interactions
- ml_models
- gamification
- system_config

#### Redis
**Uso**: Cache y mensajería
- Session storage
- API response caching
- Pub/Sub para eventos en tiempo real
- Rate limiting counters
- Temporary data storage

---

## 🔄 Flujos de Datos

### 1. Flujo de Autenticación
```
Usuario → Frontend → API Gateway → Auth Module → JWT Generation
                                   ↓
                              PostgreSQL (users)
                                   ↓
                              Redis (session)
```

### 2. Flujo de Aprendizaje Adaptativo
```
Estudiante → Assessment → AI-Tutor → Learning Path Generation
                ↓            ↓              ↓
           PostgreSQL    ML Models    Progress Tracking
                             ↓              ↓
                        Adaptation     Real-time Updates
```

### 3. Flujo de Real-time Updates
```
Service Event → Redis Pub/Sub → API Gateway WebSocket → Frontend
                     ↓
              Other Services (subscribers)
```

---

## 🔐 Seguridad

### Capas de Seguridad

1. **Network Level**
   - Docker network isolation
   - Firewall rules
   - HTTPS/TLS encryption

2. **Application Level**
   - JWT tokens con refresh mechanism
   - RBAC (Role-Based Access Control)
   - Rate limiting
   - Input validation
   - SQL injection prevention

3. **Data Level**
   - Encryption at rest
   - Encryption in transit
   - Secure password hashing (bcrypt)
   - PII data protection

### Autenticación y Autorización

```typescript
// JWT Token Structure
{
  "sub": "user-uuid",
  "username": "ana_estudiante",
  "email": "ana@example.com",
  "role": "student",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 📈 Escalabilidad

### Estrategias de Escalado

1. **Horizontal Scaling**
   - Microservicios stateless
   - Load balancing con nginx
   - Auto-scaling groups

2. **Vertical Scaling**
   - Resource limits configurables
   - Memory y CPU optimization

3. **Database Scaling**
   - Read replicas para PostgreSQL
   - Redis cluster para alta disponibilidad
   - Connection pooling

### Performance Optimizations

- **Caching Strategy**: Redis para respuestas frecuentes
- **Lazy Loading**: Carga diferida de componentes
- **Code Splitting**: Bundles optimizados
- **CDN**: Assets estáticos
- **Database Indexes**: Queries optimizadas

---

## 🚀 Deployment Architecture

### Desarrollo
```yaml
Environment: Local Docker Compose
Services: All services in single host
Database: Local PostgreSQL + Redis
Monitoring: Basic health checks
```

### Staging
```yaml
Environment: Cloud VMs
Services: Docker Swarm
Database: Managed PostgreSQL
Monitoring: Prometheus + Grafana
```

### Producción
```yaml
Environment: Kubernetes Cluster
Services: Auto-scaled pods
Database: RDS PostgreSQL + ElastiCache
Monitoring: Full observability stack
CDN: CloudFront
Backup: Automated daily
```

---

## 🔍 Monitoreo y Observabilidad

### Métricas Clave

1. **Business Metrics**
   - Active users
   - Course completion rate
   - Assessment scores
   - Learning progress

2. **Technical Metrics**
   - Response time (p50, p95, p99)
   - Error rate
   - Throughput (req/s)
   - Resource utilization

3. **Health Checks**
   - Service availability
   - Database connections
   - Cache hit rate
   - Queue depth

### Stack de Monitoreo

```
Services → Metrics → Prometheus → Grafana
    ↓         ↓          ↓           ↓
  Logs → Loki/ELK → Dashboards → Alerts
```

---

## 🛠️ Tecnologías y Versiones

### Frontend
- React: 19.1.0
- Vite: 7.0.2
- TypeScript: 5.8.3
- Tailwind CSS: 3.5.7
- Axios: 1.10.0

### Backend
- NestJS: 10.0.0
- FastAPI: 0.104.1
- Node.js: 20.x
- Python: 3.11

### Data
- PostgreSQL: 15
- Redis: 7
- SQLAlchemy: 2.0.23

### Infrastructure
- Docker: 24.x
- Docker Compose: 3.8
- Nginx: Alpine

---

## 🔄 CI/CD Pipeline

```
Git Push → GitHub Actions → Build → Test → Docker Build → Registry Push
                              ↓       ↓          ↓              ↓
                         Lint Check  Unit   Security Scan   Deploy
```

---

## 🎯 Decisiones Arquitectónicas

### 1. Microservicios vs Monolito
**Decisión**: Microservicios
**Razón**: Escalabilidad independiente, desarrollo paralelo, tecnologías específicas por dominio

### 2. REST vs GraphQL
**Decisión**: REST
**Razón**: Simplicidad, caching efectivo, mejor para microservicios

### 3. SQL vs NoSQL
**Decisión**: PostgreSQL (SQL) + Redis (NoSQL)
**Razón**: Datos estructurados para el core, Redis para cache y real-time

### 4. Sync vs Async Communication
**Decisión**: Híbrido
**Razón**: Sync para requests críticos, async para eventos y notificaciones

---

## 📚 Referencias y Estándares

- **API Design**: RESTful API standards
- **Code Style**: ESLint + Prettier + Black
- **Git Flow**: Feature branches + PR reviews
- **Documentation**: OpenAPI 3.0
- **Testing**: TDD approach con >80% coverage

---

**Última actualización**: Enero 2025  
**Mantenido por**: EbroValley Digital Team