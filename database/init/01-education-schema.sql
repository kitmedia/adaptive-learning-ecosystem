-- Adaptive Learning Ecosystem - Schema Principal
-- Creado para EbroValley Digital por ToñoAdPAOS & Claudio Supreme

-- Crear database adaptive_learning (si no existe)
CREATE DATABASE IF NOT EXISTS adaptive_learning;

-- Crear schema principal educativo
CREATE SCHEMA IF NOT EXISTS education;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla usuarios (estudiantes, instructores, administradores)
CREATE TABLE education.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'admin', 'institution_admin')),
    institution_id UUID NULL,
    learning_style VARCHAR(50) DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla instituciones educativas
CREATE TABLE education.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('university', 'school', 'corporate', 'bootcamp')),
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    max_students INTEGER DEFAULT 100,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla cursos
CREATE TABLE education.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL REFERENCES education.users(id),
    institution_id UUID REFERENCES education.institutions(id),
    category VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration_hours INTEGER DEFAULT 10,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_published BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla módulos de curso
CREATE TABLE education.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES education.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla lecciones
CREATE TABLE education.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES education.course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'interactive', 'quiz', 'assignment')),
    order_index INTEGER NOT NULL,
    estimated_duration_minutes INTEGER DEFAULT 15,
    multimedia_url TEXT,
    is_published BOOLEAN DEFAULT false,
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla inscripciones
CREATE TABLE education.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES education.users(id),
    course_id UUID NOT NULL REFERENCES education.courses(id),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, course_id)
);

-- Tabla progreso por lección
CREATE TABLE education.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES education.enrollments(id),
    lesson_id UUID NOT NULL REFERENCES education.lessons(id),
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    time_spent_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, lesson_id)
);

-- Tabla evaluaciones/quizzes
CREATE TABLE education.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES education.lessons(id),
    course_id UUID REFERENCES education.courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) DEFAULT 'quiz' CHECK (assessment_type IN ('quiz', 'assignment', 'project', 'exam')),
    questions JSONB NOT NULL DEFAULT '[]',
    max_attempts INTEGER DEFAULT 3,
    time_limit_minutes INTEGER NULL,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    is_adaptive BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla intentos de evaluación
CREATE TABLE education.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES education.assessments(id),
    student_id UUID NOT NULL REFERENCES education.users(id),
    attempt_number INTEGER NOT NULL DEFAULT 1,
    answers JSONB NOT NULL DEFAULT '{}',
    score DECIMAL(5,2) NULL,
    max_score DECIMAL(5,2) NOT NULL,
    time_taken_seconds INTEGER NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    auto_graded BOOLEAN DEFAULT true,
    feedback TEXT
);

-- Tabla grupos de estudio colaborativo
CREATE TABLE education.study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES education.courses(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES education.users(id),
    max_members INTEGER DEFAULT 6,
    is_public BOOLEAN DEFAULT true,
    room_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla miembros de grupos de estudio
CREATE TABLE education.study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES education.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES education.users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('creator', 'moderator', 'member')),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(group_id, user_id)
);

-- Tabla recomendaciones de IA
CREATE TABLE education.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES education.users(id),
    course_id UUID REFERENCES education.courses(id),
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('content', 'study_group', 'schedule', 'resource')),
    content_data JSONB NOT NULL DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    reason TEXT,
    is_displayed BOOLEAN DEFAULT false,
    is_accepted BOOLEAN NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL
);

-- Tabla notificaciones
CREATE TABLE education.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES education.users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('achievement', 'reminder', 'social', 'system', 'recommendation')),
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    delivery_method VARCHAR(20) DEFAULT 'in_app' CHECK (delivery_method IN ('in_app', 'email', 'push', 'sms')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL
);

-- Índices para optimización de consultas
CREATE INDEX idx_users_email ON education.users(email);
CREATE INDEX idx_users_role ON education.users(role);
CREATE INDEX idx_users_institution ON education.users(institution_id);

CREATE INDEX idx_courses_instructor ON education.courses(instructor_id);
CREATE INDEX idx_courses_institution ON education.courses(institution_id);
CREATE INDEX idx_courses_category ON education.courses(category);

CREATE INDEX idx_enrollments_student ON education.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON education.enrollments(course_id);
CREATE INDEX idx_enrollments_active ON education.enrollments(is_active);

CREATE INDEX idx_lesson_progress_enrollment ON education.lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON education.lesson_progress(lesson_id);

CREATE INDEX idx_ai_recommendations_student ON education.ai_recommendations(student_id);
CREATE INDEX idx_ai_recommendations_type ON education.ai_recommendations(recommendation_type);

CREATE INDEX idx_notifications_user ON education.notifications(user_id);
CREATE INDEX idx_notifications_unread ON education.notifications(user_id, is_read);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION education.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON education.users
    FOR EACH ROW EXECUTE FUNCTION education.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON education.courses
    FOR EACH ROW EXECUTE FUNCTION education.update_updated_at_column();

-- Datos de prueba básicos
INSERT INTO education.institutions (id, name, domain, type) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'EbroValley Digital Academy', 'ebrovalley.edu', 'university');

INSERT INTO education.users (id, email, password_hash, first_name, last_name, role, institution_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'admin@ebrovalley.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LEJWqpqiM1MwkfS4u', 'Admin', 'EbroValley', 'admin', '550e8400-e29b-41d4-a716-446655440000'),
    ('550e8400-e29b-41d4-a716-446655440002', 'instructor@ebrovalley.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LEJWqpqiM1MwkfS4u', 'Carlos', 'Instructor', 'instructor', '550e8400-e29b-41d4-a716-446655440000'),
    ('550e8400-e29b-41d4-a716-446655440003', 'student@ebrovalley.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LEJWqpqiM1MwkfS4u', 'Ana', 'Estudiante', 'student', '550e8400-e29b-41d4-a716-446655440000');

-- Insertar curso de prueba
INSERT INTO education.courses (id, title, description, instructor_id, institution_id, category, difficulty_level) VALUES 
    ('550e8400-e29b-41d4-a716-446655440010', 'Introducción a la IA Adaptativa', 'Curso fundamental sobre sistemas de aprendizaje adaptativos con inteligencia artificial', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Technology', 'beginner');

COMMIT;