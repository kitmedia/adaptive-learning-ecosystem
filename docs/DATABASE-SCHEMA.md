# 🗄️ DATABASE SCHEMA - ADAPTIVE LEARNING ECOSYSTEM

## 📊 Overview

El Adaptive Learning Ecosystem utiliza **PostgreSQL 15** como base de datos principal con un esquema normalizado diseñado para escalabilidad y rendimiento. El esquema incluye **12 tablas principales** con triggers, índices optimizados y constraints para garantizar integridad de datos.

**Database**: `adaptive_learning`  
**User**: `adaptive_user`  
**Port**: `5432`

---

## 🏗️ Diagrama ER

```
                    ┌─────────────────────────┐
                    │         USERS            │
                    │  PK: id (UUID)           │
                    │  username (UNIQUE)       │
                    │  email (UNIQUE)          │
                    │  password_hash           │
                    │  role                    │
                    └───────────┬──────────────┘
                                 │
                ┌────────────────┴──────────────────────────────────────────────────────────────────┐
                │                                                                                        │
   ┌────────────────────┴──────────────────────────────────────────────────────────────────┴──────────────────────────┐
   │                                                                                        │                         │
┌──┬───────────────────────────┐ ┌────────────────────────────────────────────────────────┐ │          GAMIFICATION      │
│  │      COURSES            │ │                        LESSONS                          │ │  PK: id (UUID)           │
│  │  PK: id (UUID)         │ │  PK: id (UUID)                                        │ │  FK: student_id          │
│  │  title                 │ │  FK: course_id → courses.id                         │ │  total_points            │
│  │  difficulty_level      │ │  title, content                                       │ │  level, badges           │
│  └────────┬──────────────────┘ └────────────┬──────────────────────────────────────────┘ └──────────────────────────┘
       │                                  │
       └──────────────────────────────────────────────────────────────────────────────────────────┐
                                                                                                   │
                        ┌────────────────────────────────────────────────────────────────────────────────────────┴──────────────────────────┐
                        │                                                                                   │
                        │                        STUDENT_PROGRESS                                     │
                        │  PK: id (UUID)                                                                │
                        │  FK: student_id → users.id                                                 │
                        │  FK: lesson_id → lessons.id                                                │
                        │  FK: course_id → courses.id                                                │
                        │  status, progress_percentage, score                                           │
                        │  UNIQUE(student_id, lesson_id)                                               │
                        └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Tablas Principales

### 1. USERS
Tabla principal de usuarios del sistema.

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_data JSONB DEFAULT '{}',
    learning_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'student'
);
```

**Campos**:
- `id`: Identificador único UUID
- `username`: Nombre de usuario único
- `email`: Email único del usuario
- `password_hash`: Hash bcrypt de la contraseña
- `profile_data`: Datos adicionales del perfil (JSONB)
- `learning_preferences`: Preferencias de aprendizaje (JSONB)
- `role`: Rol del usuario (`student`, `teacher`, `admin`)

**Índices**:
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2. COURSES
Cursos disponibles en la plataforma.

```sql
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(20) DEFAULT 'intermediate',
    estimated_duration INTEGER, -- en minutos
    course_data JSONB DEFAULT '{}',
    prerequisites JSONB DEFAULT '[]',
    learning_objectives JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Campos**:
- `difficulty_level`: `beginner`, `intermediate`, `advanced`
- `estimated_duration`: Duración estimada en minutos
- `prerequisites`: Lista de cursos prerequisitos (JSONB array)
- `learning_objectives`: Objetivos de aprendizaje (JSONB array)

### 3. LESSONS
Lecciones dentro de cada curso.

```sql
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    lesson_type VARCHAR(50) DEFAULT 'content',
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    difficulty_level VARCHAR(20) DEFAULT 'intermediate',
    learning_objectives JSONB DEFAULT '[]',
    resources JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Campos**:
- `lesson_type`: `content`, `exercise`, `quiz`, `video`
- `order_index`: Orden de la lección en el curso
- `resources`: Recursos adicionales (links, archivos) (JSONB)

**Índices**:
```sql
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, order_index);
```

### 4. STUDENT_PROGRESS
Progreso del estudiante en lecciones y cursos.

```sql
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent INTEGER DEFAULT 0, -- en segundos
    score DECIMAL(5,2),
    attempts INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lesson_id)
);
```

**Campos**:
- `status`: `not_started`, `in_progress`, `completed`, `paused`
- `progress_percentage`: Porcentaje de completado (0.00-100.00)
- `time_spent`: Tiempo invertido en segundos
- `score`: Puntuación obtenida (0.00-100.00)

**Índices Optimizados**:
```sql
CREATE INDEX idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_student_progress_course_id ON student_progress(course_id);
CREATE INDEX idx_student_progress_lesson_id ON student_progress(lesson_id);
CREATE INDEX idx_student_progress_status ON student_progress(status);
```

### 5. ASSESSMENTS
Evaluaciones y quizzes.

```sql
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) DEFAULT 'quiz',
    difficulty_level VARCHAR(20) DEFAULT 'intermediate',
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    questions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Campos**:
- `assessment_type`: `quiz`, `exam`, `diagnostic`, `practice`
- `questions`: Array de preguntas con opciones (JSONB)
- `passing_score`: Puntuación mínima para aprobar

### 6. ASSESSMENT_RESULTS
Resultados de las evaluaciones.

```sql
CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    percentage_score DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    time_taken INTEGER, -- en segundos
    answers JSONB NOT NULL DEFAULT '[]',
    feedback TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Índices**:
```sql
CREATE INDEX idx_assessment_results_student_id ON assessment_results(student_id);
CREATE INDEX idx_assessment_results_assessment_id ON assessment_results(assessment_id);
```

### 7. LEARNING_PROFILES
Perfiles de aprendizaje personalizados.

```sql
CREATE TABLE IF NOT EXISTS learning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    learning_style JSONB DEFAULT '{}',
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    preferred_pace VARCHAR(20) DEFAULT 'medium',
    difficulty_preference VARCHAR(20) DEFAULT 'adaptive',
    goal_preferences JSONB DEFAULT '{}',
    last_analysis TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Campos**:
- `learning_style`: Estilo de aprendizaje preferido (JSONB)
- `preferred_pace`: `slow`, `medium`, `fast`
- `difficulty_preference`: `easy`, `medium`, `hard`, `adaptive`

### 8. ADAPTATIONS
Adaptaciones del sistema basadas en IA.

```sql
CREATE TABLE IF NOT EXISTS adaptations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    adaptation_type VARCHAR(50) NOT NULL,
    context JSONB DEFAULT '{}',
    recommendation TEXT,
    confidence_score DECIMAL(5,2),
    applied BOOLEAN DEFAULT FALSE,
    effectiveness_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMPTZ,
    feedback_at TIMESTAMPTZ
);
```

**Campos**:
- `adaptation_type`: `difficulty`, `pace`, `content`, `style`
- `confidence_score`: Confianza del modelo ML (0.00-1.00)
- `effectiveness_score`: Efectividad medida post-aplicación

### 9. STUDENT_INTERACTIONS
Interacciones del estudiante para analytics.

```sql
CREATE TABLE IF NOT EXISTS student_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    interaction_type VARCHAR(50) NOT NULL,
    content_id VARCHAR(100),
    interaction_data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    success_rate DECIMAL(5,2)
);
```

**Índices para Analytics**:
```sql
CREATE INDEX idx_student_interactions_student_id ON student_interactions(student_id);
CREATE INDEX idx_student_interactions_timestamp ON student_interactions(timestamp);
CREATE INDEX idx_student_interactions_type ON student_interactions(interaction_type);
```

### 10. GAMIFICATION
Sistema de gamificación y logros.

```sql
CREATE TABLE IF NOT EXISTS gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id)
);
```

**Índices**:
```sql
CREATE INDEX idx_gamification_student_id ON gamification(student_id);
CREATE INDEX idx_gamification_level ON gamification(level);
```

### 11. ML_MODELS
Metadatos de modelos de Machine Learning.

```sql
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    parameters JSONB DEFAULT '{}',
    training_data_hash VARCHAR(64),
    accuracy_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_trained TIMESTAMPTZ,
    UNIQUE(model_name, version)
);
```

### 12. SYSTEM_CONFIG
Configuración del sistema.

```sql
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Triggers y Functions

### Update Timestamp Trigger
Trigger automático para actualizar `updated_at`.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a tablas principales
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at 
    BEFORE UPDATE ON lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at 
    BEFORE UPDATE ON student_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📊 Queries Optimizadas

### Dashboard del Estudiante
```sql
-- Progreso completo del estudiante
SELECT 
    sp.*,
    l.title as lesson_title,
    l.difficulty_level,
    c.title as course_title,
    c.difficulty_level as course_difficulty
FROM student_progress sp
JOIN lessons l ON sp.lesson_id = l.id
JOIN courses c ON sp.course_id = c.id
WHERE sp.student_id = $1
ORDER BY c.title, l.order_index;
```

### Resumen Ejecutivo
```sql
-- KPIs del estudiante
SELECT 
    COUNT(DISTINCT sp.course_id) as active_courses,
    COUNT(CASE WHEN sp.status = 'completed' THEN 1 END) as completed_lessons,
    COUNT(*) as total_lessons,
    COALESCE(AVG(sp.score), 0) as overall_avg_score,
    COALESCE(SUM(sp.time_spent), 0) as total_time,
    MAX(sp.last_accessed) as last_activity
FROM student_progress sp
WHERE sp.student_id = $1;
```

### Analytics Avanzados
```sql
-- Tendencias de rendimiento
SELECT 
    DATE(sp.last_accessed) as date,
    AVG(sp.score) as avg_score,
    SUM(sp.time_spent) as total_time,
    COUNT(*) as lessons_worked
FROM student_progress sp
WHERE sp.student_id = $1 
    AND sp.last_accessed >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sp.last_accessed)
ORDER BY date;
```

---

## 🔍 Performance y Optimización

### Connection Pooling
```python
# Configuración de pool de conexiones
CONNECTION_POOL_SETTINGS = {
    'minconn': 1,
    'maxconn': 20,
    'host': 'localhost',
    'port': 5432,
    'database': 'adaptive_learning',
    'user': 'adaptive_user'
}
```

### Índices Compuestos Críticos
```sql
-- Para queries de dashboard
CREATE INDEX idx_progress_student_status 
    ON student_progress(student_id, status) 
    WHERE status IN ('in_progress', 'completed');

-- Para analytics temporales
CREATE INDEX idx_interactions_student_timestamp 
    ON student_interactions(student_id, timestamp DESC);

-- Para gamificación
CREATE INDEX idx_gamification_leaderboard 
    ON gamification(total_points DESC, level DESC);
```

### Particionado (Para escala)
```sql
-- Particionar student_interactions por fecha
CREATE TABLE student_interactions_partitioned (
    LIKE student_interactions INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Particiones mensuales
CREATE TABLE student_interactions_2025_01 
    PARTITION OF student_interactions_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## 🛠️ Mantenimiento

### Backup Strategy
```bash
# Backup completo diario
pg_dump -U adaptive_user -h localhost adaptive_learning \
    | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup incremental (WAL)
archive_command = 'cp %p /backup/wal/%f'
```

### Vacuum y Analyze
```sql
-- Mantenimiento automatizado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Vacuum diario
SELECT cron.schedule('vacuum-tables', '0 2 * * *', 'VACUUM ANALYZE;');

-- Reindex semanal
SELECT cron.schedule('reindex-tables', '0 3 * * 0', 'REINDEX DATABASE adaptive_learning;');
```

### Monitoring Queries
```sql
-- Conexiones activas
SELECT count(*), state FROM pg_stat_activity 
WHERE datname = 'adaptive_learning' GROUP BY state;

-- Queries lentas
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

-- Tamaño de tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔐 Seguridad

### Row Level Security (RLS)
```sql
-- Habilitar RLS para student_progress
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Política: estudiantes solo ven su progreso
CREATE POLICY student_progress_policy ON student_progress
    FOR ALL TO app_user
    USING (student_id = current_setting('app.current_user_id')::UUID);
```

### Auditoría
```sql
-- Tabla de auditoría
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger de auditoría
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, 
            CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
            current_setting('app.current_user_id', true)::UUID);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Data Warehouse (Futuro)

### Tablas de Hechos y Dimensiones
```sql
-- Fact table para analytics
CREATE TABLE fact_learning_sessions (
    session_id UUID PRIMARY KEY,
    student_id UUID,
    course_id UUID,
    lesson_id UUID,
    date_id INTEGER, -- YYYYMMDD
    duration_seconds INTEGER,
    score DECIMAL(5,2),
    interactions_count INTEGER,
    created_at TIMESTAMPTZ
);

-- Dimension tiempo
CREATE TABLE dim_date (
    date_id INTEGER PRIMARY KEY, -- YYYYMMDD
    full_date DATE,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    day_of_week INTEGER,
    is_weekend BOOLEAN
);
```

---

**Última actualización**: Enero 2025  
**Versión Schema**: v1.0.0  
**Mantenido por**: EbroValley Digital Team