#!/usr/bin/env python3
"""
Crear base de datos SQLite para desarrollo local
Adaptive Learning Ecosystem - EbroValley Digital
"""

import sqlite3
import os
from datetime import datetime
import hashlib

def create_sqlite_db():
    """Crear base de datos SQLite con schema educativo"""
    
    db_path = os.path.join(os.path.dirname(__file__), 'adaptive_learning.db')
    
    # Eliminar DB existente si existe
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🗄️ Creando schema educativo en SQLite...")
    
    # Tabla usuarios
    cursor.execute('''
    CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin', 'institution_admin')),
        institution_id TEXT NULL,
        learning_style TEXT DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading_writing', 'multimodal')),
        timezone TEXT DEFAULT 'UTC',
        language TEXT DEFAULT 'en',
        is_active INTEGER DEFAULT 1,
        email_verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Tabla instituciones
    cursor.execute('''
    CREATE TABLE institutions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('university', 'school', 'corporate', 'bootcamp')),
        subscription_plan TEXT DEFAULT 'starter',
        max_students INTEGER DEFAULT 100,
        settings TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Tabla cursos
    cursor.execute('''
    CREATE TABLE courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        instructor_id TEXT NOT NULL,
        institution_id TEXT,
        category TEXT NOT NULL,
        difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        estimated_duration_hours INTEGER DEFAULT 10,
        price REAL DEFAULT 0.00,
        is_published INTEGER DEFAULT 0,
        tags TEXT DEFAULT '',
        metadata TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES users(id),
        FOREIGN KEY (institution_id) REFERENCES institutions(id)
    )
    ''')
    
    # Tabla módulos de curso
    cursor.execute('''
    CREATE TABLE course_modules (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL,
        is_published INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id)
    )
    ''')
    
    # Tabla lecciones
    cursor.execute('''
    CREATE TABLE lessons (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'interactive', 'quiz', 'assignment')),
        order_index INTEGER NOT NULL,
        estimated_duration_minutes INTEGER DEFAULT 15,
        multimedia_url TEXT,
        is_published INTEGER DEFAULT 0,
        ai_generated INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES course_modules(id)
    )
    ''')
    
    # Tabla inscripciones
    cursor.execute('''
    CREATE TABLE enrollments (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        enrollment_date TEXT DEFAULT CURRENT_TIMESTAMP,
        completion_date TEXT NULL,
        progress_percentage REAL DEFAULT 0.00,
        last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        UNIQUE(student_id, course_id),
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
    )
    ''')
    
    # Tabla progreso por lección
    cursor.execute('''
    CREATE TABLE lesson_progress (
        id TEXT PRIMARY KEY,
        enrollment_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
        time_spent_seconds INTEGER DEFAULT 0,
        completion_percentage REAL DEFAULT 0.00,
        started_at TEXT NULL,
        completed_at TEXT NULL,
        last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(enrollment_id, lesson_id),
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    )
    ''')
    
    # Tabla actividades de aprendizaje
    cursor.execute('''
    CREATE TABLE learning_activities (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        start_time TEXT DEFAULT CURRENT_TIMESTAMP,
        end_time TEXT NULL,
        time_spent_seconds INTEGER DEFAULT 0,
        completion_percentage REAL DEFAULT 0.00,
        interactions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_attempts INTEGER DEFAULT 0,
        difficulty_adjustments INTEGER DEFAULT 0,
        help_requests INTEGER DEFAULT 0,
        engagement_score REAL DEFAULT 0.0,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    )
    ''')
    
    # Tabla perfiles de aprendizaje
    cursor.execute('''
    CREATE TABLE student_learning_profiles (
        id TEXT PRIMARY KEY,
        student_id TEXT UNIQUE NOT NULL,
        learning_style TEXT NOT NULL,
        learning_style_confidence REAL NOT NULL,
        preferred_pace TEXT NOT NULL,
        current_difficulty_level TEXT NOT NULL,
        interests TEXT DEFAULT '',
        strengths TEXT DEFAULT '',
        weaknesses TEXT DEFAULT '',
        attention_span_minutes INTEGER DEFAULT 30,
        preferred_session_length INTEGER DEFAULT 25,
        optimal_study_times TEXT DEFAULT 'morning,afternoon',
        motivation_factors TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id)
    )
    ''')
    
    print("✅ Schema creado exitosamente")
    
    # Datos de prueba
    print("📊 Insertando datos de prueba...")
    
    # Institución
    cursor.execute('''
    INSERT INTO institutions (id, name, domain, type) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'EbroValley Digital Academy', 'ebrovalley.edu', 'university')
    ''')
    
    # Usuarios
    password_hash = hashlib.sha256('password123'.encode()).hexdigest()
    cursor.execute('''
    INSERT INTO users (id, email, password_hash, first_name, last_name, role, institution_id, learning_style) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'admin@ebrovalley.edu', ?, 'Admin', 'EbroValley', 'admin', '550e8400-e29b-41d4-a716-446655440000', 'visual'),
    ('550e8400-e29b-41d4-a716-446655440002', 'instructor@ebrovalley.edu', ?, 'Carlos', 'Instructor', 'instructor', '550e8400-e29b-41d4-a716-446655440000', 'auditory'),
    ('550e8400-e29b-41d4-a716-446655440003', 'student@ebrovalley.edu', ?, 'Ana', 'Estudiante', 'student', '550e8400-e29b-41d4-a716-446655440000', 'kinesthetic')
    ''', (password_hash, password_hash, password_hash))
    
    # Curso
    cursor.execute('''
    INSERT INTO courses (id, title, description, instructor_id, institution_id, category, difficulty_level, is_published) VALUES 
    ('550e8400-e29b-41d4-a716-446655440010', 'Introducción a la IA Adaptativa', 'Curso fundamental sobre sistemas de aprendizaje adaptativos con inteligencia artificial', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Technology', 'beginner', 1)
    ''')
    
    # Módulo del curso
    cursor.execute('''
    INSERT INTO course_modules (id, course_id, title, description, order_index, is_published) VALUES 
    ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'Fundamentos de IA', 'Conceptos básicos de inteligencia artificial', 1, 1)
    ''')
    
    # Lecciones
    lessons_data = [
        ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '¿Qué es la IA?', 'Introducción a conceptos fundamentales', 'video', 1, 15),
        ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440020', 'Machine Learning Básico', 'Conceptos de aprendizaje automático', 'interactive', 2, 25),
        ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440020', 'Redes Neuronales', 'Introducción a redes neuronales', 'text', 3, 30)
    ]
    
    for lesson in lessons_data:
        cursor.execute('''
        INSERT INTO lessons (id, module_id, title, content, content_type, order_index, estimated_duration_minutes, is_published) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ''', lesson)
    
    # Inscripción de estudiante
    cursor.execute('''
    INSERT INTO enrollments (id, student_id, course_id, progress_percentage) VALUES 
    ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 25.0)
    ''')
    
    # Perfil de aprendizaje del estudiante
    cursor.execute('''
    INSERT INTO student_learning_profiles (id, student_id, learning_style, learning_style_confidence, preferred_pace, current_difficulty_level, interests, strengths, weaknesses, attention_span_minutes) VALUES 
    ('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440003', 'kinesthetic', 0.85, 'normal', 'beginner', 'practical_applications,creative_projects', 'hands_on_learning,experiential_learning', 'theoretical_concepts', 35)
    ''')
    
    # Actividades de aprendizaje simuladas
    activities_data = [
        ('activity_001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440030', 'video_watching', 900, 100.0, 15, 8, 10, 0, 2, 0.85),
        ('activity_002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440031', 'interactive_exercise', 1500, 75.0, 25, 6, 8, 1, 3, 0.70),
        ('activity_003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440032', 'reading', 1800, 60.0, 12, 4, 7, 0, 5, 0.55)
    ]
    
    for activity in activities_data:
        cursor.execute('''
        INSERT INTO learning_activities (id, student_id, lesson_id, activity_type, time_spent_seconds, completion_percentage, interactions, correct_answers, total_attempts, difficulty_adjustments, help_requests, engagement_score) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', activity)
    
    conn.commit()
    conn.close()
    
    print(f"✅ Base de datos SQLite creada: {db_path}")
    print("✅ Datos de prueba insertados exitosamente")
    
    return db_path

if __name__ == "__main__":
    create_sqlite_db()
    print("\n🎉 Base de datos lista para desarrollo!")