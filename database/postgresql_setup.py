#!/usr/bin/env python3
"""
PostgreSQL Database Setup and Migration Script
Adaptive Learning Ecosystem - EbroValley Digital
Author: ToñoAdPAOS & Claudio Supreme
"""

import os
import psycopg2
import sqlite3
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
from datetime import datetime

# PostgreSQL Configuration
POSTGRES_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'adaptive_learning'),
    'user': os.getenv('POSTGRES_USER', 'adaptive_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'adaptive_password_2024')
}

SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), 'adaptive_learning.db')

def create_postgresql_database():
    """
    Acción específica: Crear base de datos PostgreSQL
    Razón: Necesaria para entorno de producción empresarial
    """
    try:
        # Conectar a PostgreSQL sin especificar database
        conn = psycopg2.connect(
            host=POSTGRES_CONFIG['host'],
            port=POSTGRES_CONFIG['port'],
            user=POSTGRES_CONFIG['user'],
            password=POSTGRES_CONFIG['password']
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Crear database si no existe
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{POSTGRES_CONFIG['database']}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f"CREATE DATABASE {POSTGRES_CONFIG['database']}")
            print(f"✅ Base de datos '{POSTGRES_CONFIG['database']}' creada exitosamente")
        else:
            print(f"ℹ️  Base de datos '{POSTGRES_CONFIG['database']}' ya existe")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Error creando base de datos PostgreSQL: {e}")
        return False

def create_postgresql_schema():
    """
    Acción específica: Crear esquema de tablas en PostgreSQL
    Razón: Replicar estructura SQLite en PostgreSQL con mejoras empresariales
    """
    schema_sql = """
    -- Tabla de usuarios/estudiantes
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

    -- Tabla de cursos
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

    -- Tabla de lecciones
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

    -- Tabla de progreso del estudiante
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

    -- Tabla de evaluaciones
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

    -- Tabla de resultados de evaluaciones
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

    -- Tabla de perfiles de aprendizaje
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

    -- Tabla de adaptaciones del sistema
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

    -- Tabla de interacciones del estudiante
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

    -- Tabla de modelos ML
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

    -- Tabla de gamificación
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

    -- Tabla de configuración del sistema
    CREATE TABLE IF NOT EXISTS system_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value JSONB NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Índices para optimización
    CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
    CREATE INDEX IF NOT EXISTS idx_student_progress_course_id ON student_progress(course_id);
    CREATE INDEX IF NOT EXISTS idx_student_progress_lesson_id ON student_progress(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_student_progress_status ON student_progress(status);
    CREATE INDEX IF NOT EXISTS idx_assessment_results_student_id ON assessment_results(student_id);
    CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);
    CREATE INDEX IF NOT EXISTS idx_student_interactions_student_id ON student_interactions(student_id);
    CREATE INDEX IF NOT EXISTS idx_student_interactions_timestamp ON student_interactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_gamification_student_id ON gamification(student_id);

    -- Triggers para updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_courses_updated_at') THEN
            CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lessons_updated_at') THEN
            CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_student_progress_updated_at') THEN
            CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END $$;
    """
    
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✅ Esquema PostgreSQL creado exitosamente")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Error creando esquema PostgreSQL: {e}")
        return False

def migrate_sqlite_to_postgresql():
    """
    Acción específica: Migrar datos de SQLite a PostgreSQL
    Razón: Preservar datos existentes del desarrollo
    """
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"⚠️  No se encontró base de datos SQLite en {SQLITE_DB_PATH}")
        return True
    
    try:
        # Conectar a SQLite
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_cursor = sqlite_conn.cursor()
        
        # Conectar a PostgreSQL
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Migrar usuarios
        sqlite_cursor.execute("SELECT * FROM users")
        users = sqlite_cursor.fetchall()
        
        if users:
            for user in users:
                pg_cursor.execute("""
                    INSERT INTO users (id, username, email, full_name, password_hash, profile_data, learning_preferences, created_at, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, user)
            print(f"✅ Migrados {len(users)} usuarios")
        
        # Migrar cursos
        sqlite_cursor.execute("SELECT * FROM courses")
        courses = sqlite_cursor.fetchall()
        
        if courses:
            for course in courses:
                pg_cursor.execute("""
                    INSERT INTO courses (id, title, description, difficulty_level, estimated_duration, course_data, created_at, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, course)
            print(f"✅ Migrados {len(courses)} cursos")
        
        # Migrar progreso de estudiantes
        sqlite_cursor.execute("SELECT * FROM student_progress")
        progress = sqlite_cursor.fetchall()
        
        if progress:
            for prog in progress:
                pg_cursor.execute("""
                    INSERT INTO student_progress (id, student_id, lesson_id, course_id, status, progress_percentage, time_spent, score, last_accessed, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (student_id, lesson_id) DO UPDATE SET
                    progress_percentage = EXCLUDED.progress_percentage,
                    time_spent = EXCLUDED.time_spent,
                    score = EXCLUDED.score,
                    last_accessed = EXCLUDED.last_accessed,
                    updated_at = CURRENT_TIMESTAMP
                """, prog)
            print(f"✅ Migrados {len(progress)} registros de progreso")
        
        pg_conn.commit()
        
        sqlite_cursor.close()
        sqlite_conn.close()
        pg_cursor.close()
        pg_conn.close()
        
        print("✅ Migración de datos completada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        return False

def insert_demo_data():
    """
    Acción específica: Insertar datos de demostración
    Razón: Datos necesarios para que el sistema funcione inmediatamente
    """
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()
        
        # Insertar usuario demo
        cursor.execute("""
            INSERT INTO users (id, username, email, full_name, password_hash, is_active, role)
            VALUES ('550e8400-e29b-41d4-a716-446655440003', 'ana_estudiante', 'ana@ebrovalley.com', 'Ana Estudiante', 'hashed_password_demo', TRUE, 'student')
            ON CONFLICT (id) DO NOTHING
        """)
        
        # Insertar cursos demo
        cursor.execute("""
            INSERT INTO courses (id, title, description, difficulty_level, estimated_duration, is_active)
            VALUES 
            ('intro_ai', 'Introducción a IA Adaptativa', 'Fundamentos de inteligencia artificial y aprendizaje adaptativo', 'beginner', 600, TRUE),
            ('web_dev', 'Desarrollo Web Moderno', 'React, TypeScript y arquitecturas modernas', 'intermediate', 900, TRUE),
            ('data_science', 'Data Science con Python', 'Análisis de datos y machine learning', 'advanced', 1200, TRUE)
            ON CONFLICT (id) DO NOTHING
        """)
        
        # Insertar lecciones demo
        cursor.execute("""
            INSERT INTO lessons (course_id, title, content, lesson_type, order_index, duration_minutes, difficulty_level)
            VALUES 
            ('intro_ai', 'Fundamentos de IA', 'Introducción a los conceptos básicos de inteligencia artificial', 'content', 1, 30, 'beginner'),
            ('intro_ai', 'Machine Learning Básico', 'Conceptos fundamentales de aprendizaje automático', 'content', 2, 45, 'beginner'),
            ('intro_ai', 'Sistemas Adaptativos', 'Cómo funcionan los sistemas de aprendizaje adaptativo', 'content', 3, 40, 'intermediate'),
            ('web_dev', 'React Fundamentals', 'Componentes, props y estado en React', 'content', 1, 60, 'intermediate'),
            ('web_dev', 'TypeScript Avanzado', 'Tipos avanzados y patrones en TypeScript', 'content', 2, 50, 'advanced'),
            ('data_science', 'Pandas y NumPy', 'Manipulación de datos con Python', 'content', 1, 70, 'intermediate')
            ON CONFLICT DO NOTHING
        """)
        
        # Insertar progreso demo
        cursor.execute("""
            INSERT INTO student_progress (student_id, lesson_id, course_id, status, progress_percentage, time_spent, score, last_accessed)
            SELECT 
                '550e8400-e29b-41d4-a716-446655440003',
                l.id,
                l.course_id,
                CASE 
                    WHEN l.order_index <= 2 THEN 'completed'
                    WHEN l.order_index = 3 THEN 'in_progress'
                    ELSE 'not_started'
                END,
                CASE 
                    WHEN l.order_index <= 2 THEN 100.0
                    WHEN l.order_index = 3 THEN 45.0
                    ELSE 0.0
                END,
                CASE 
                    WHEN l.order_index <= 2 THEN l.duration_minutes * 60
                    WHEN l.order_index = 3 THEN l.duration_minutes * 27
                    ELSE 0
                END,
                CASE 
                    WHEN l.order_index <= 2 THEN 85.0 + (RANDOM() * 10)
                    ELSE NULL
                END,
                CURRENT_TIMESTAMP - INTERVAL '1 day' * (4 - l.order_index)
            FROM lessons l
            ON CONFLICT (student_id, lesson_id) DO NOTHING
        """)
        
        # Insertar gamificación demo
        cursor.execute("""
            INSERT INTO gamification (student_id, total_points, level, badges, achievements, streak_days)
            VALUES ('550e8400-e29b-41d4-a716-446655440003', 847, 8, 
                    '["first_lesson", "fast_learner", "perfectionist", "dedicated_student", "streak_master"]',
                    '["bronze_learner", "silver_scholar"]', 7)
            ON CONFLICT (student_id) DO UPDATE SET
            total_points = EXCLUDED.total_points,
            level = EXCLUDED.level,
            badges = EXCLUDED.badges,
            achievements = EXCLUDED.achievements,
            streak_days = EXCLUDED.streak_days,
            updated_at = CURRENT_TIMESTAMP
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Datos de demostración insertados exitosamente")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Error insertando datos demo: {e}")
        return False

def main():
    """
    Función principal de configuración PostgreSQL
    """
    print("🚀 Iniciando configuración PostgreSQL...")
    print(f"📊 Configuración: {POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}/{POSTGRES_CONFIG['database']}")
    
    # Paso 1: Crear base de datos
    if not create_postgresql_database():
        sys.exit(1)
    
    # Paso 2: Crear esquema
    if not create_postgresql_schema():
        sys.exit(1)
    
    # Paso 3: Migrar datos existentes
    if not migrate_sqlite_to_postgresql():
        print("⚠️  Continuando sin migración de datos...")
    
    # Paso 4: Insertar datos demo
    if not insert_demo_data():
        print("⚠️  Continuando sin datos demo...")
    
    print("\n✅ CONFIGURACIÓN POSTGRESQL COMPLETADA")
    print("🎯 Base de datos lista para producción")
    print(f"📝 Cadena de conexión: postgresql://{POSTGRES_CONFIG['user']}:***@{POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}/{POSTGRES_CONFIG['database']}")

if __name__ == "__main__":
    main()