-- Demo Data Setup - Adaptive Learning Ecosystem
-- Datos realistas para demostraciones y beta testing
-- Autor: Claude & Toño - EbroValley Digital

-- =====================================================
-- DEMO USERS - Usuarios de ejemplo para testing
-- =====================================================

-- Profesores demo
INSERT INTO users (id, email, password_hash, name, role, created_at, is_active) VALUES
('prof-001', 'maria.gonzalez@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Prof. María González', 'teacher', NOW(), true),
('prof-002', 'carlos.martinez@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Dr. Carlos Martínez', 'teacher', NOW(), true),
('prof-003', 'ana.rodriguez@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Dra. Ana Rodríguez', 'teacher', NOW(), true);

-- Estudiantes demo
INSERT INTO users (id, email, password_hash, name, role, created_at, is_active) VALUES
('stud-001', 'juan.perez@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Juan Pérez', 'student', NOW(), true),
('stud-002', 'lucia.sanchez@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Lucía Sánchez', 'student', NOW(), true),
('stud-003', 'pedro.lopez@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Pedro López', 'student', NOW(), true),
('stud-004', 'sofia.torres@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Sofía Torres', 'student', NOW(), true),
('stud-005', 'diego.morales@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Diego Morales', 'student', NOW(), true);

-- Administradores demo
INSERT INTO users (id, email, password_hash, name, role, created_at, is_active) VALUES
('admin-001', 'admin@demo.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Administrador Demo', 'admin', NOW(), true),
('admin-002', 'toño@ebrovalley.com', '$2b$12$Demo.Hash.For.Testing.Only', 'Toño EbroValley', 'admin', NOW(), true);

-- =====================================================
-- DEMO COURSES - Cursos de ejemplo realistas
-- =====================================================

INSERT INTO courses (id, title, description, instructor_id, category, difficulty_level, duration_hours, created_at, is_active) VALUES
('course-001', 'Introducción a la Inteligencia Artificial', 'Curso completo sobre los fundamentos de la IA, machine learning y sus aplicaciones prácticas en la industria moderna.', 'prof-001', 'Technology', 'beginner', 40, NOW(), true),
('course-002', 'Desarrollo Web Full Stack', 'Aprende a crear aplicaciones web completas usando React, Node.js, PostgreSQL y las mejores prácticas de desarrollo.', 'prof-002', 'Programming', 'intermediate', 60, NOW(), true),
('course-003', 'Marketing Digital Avanzado', 'Estrategias modernas de marketing digital, SEO, SEM, social media y analytics para hacer crecer tu negocio.', 'prof-003', 'Business', 'advanced', 35, NOW(), true),
('course-004', 'Ciencia de Datos con Python', 'Análisis de datos, visualización, machine learning y estadística usando Python, pandas, numpy y scikit-learn.', 'prof-001', 'Data Science', 'intermediate', 50, NOW(), true);

-- =====================================================
-- DEMO LESSONS - Lecciones por curso
-- =====================================================

-- Lecciones para Curso IA
INSERT INTO lessons (id, course_id, title, content, order_index, duration_minutes, lesson_type, created_at) VALUES
('lesson-001', 'course-001', 'Historia y Evolución de la IA', 'Contenido sobre la evolución histórica de la inteligencia artificial desde sus inicios hasta la actualidad.', 1, 45, 'video', NOW()),
('lesson-002', 'course-001', 'Tipos de Inteligencia Artificial', 'Explicación detallada de IA débil, fuerte, supervisada, no supervisada y por refuerzo.', 2, 60, 'interactive', NOW()),
('lesson-003', 'course-001', 'Machine Learning Básico', 'Introducción práctica al aprendizaje automático con ejemplos reales y ejercicios.', 3, 90, 'hands-on', NOW()),
('lesson-004', 'course-001', 'Redes Neuronales Artificiales', 'Fundamentos de las redes neuronales y su aplicación en reconocimiento de patrones.', 4, 120, 'video', NOW());

-- Lecciones para Curso Web Development
INSERT INTO lessons (id, course_id, title, content, order_index, duration_minutes, lesson_type, created_at) VALUES
('lesson-005', 'course-002', 'Fundamentos de HTML5 y CSS3', 'Base sólida de desarrollo frontend con las últimas tecnologías web.', 1, 60, 'hands-on', NOW()),
('lesson-006', 'course-002', 'JavaScript Moderno (ES6+)', 'Características avanzadas de JavaScript para desarrollo profesional.', 2, 90, 'interactive', NOW()),
('lesson-007', 'course-002', 'React.js y Componentes', 'Desarrollo de interfaces de usuario modernas con React y hooks.', 3, 120, 'hands-on', NOW()),
('lesson-008', 'course-002', 'Backend con Node.js', 'Creación de APIs REST con Node.js, Express y mejores prácticas.', 4, 100, 'video', NOW());

-- =====================================================
-- DEMO ENROLLMENTS - Inscripciones realistas
-- =====================================================

INSERT INTO enrollments (id, user_id, course_id, enrolled_at, status, progress_percentage) VALUES
('enroll-001', 'stud-001', 'course-001', NOW() - INTERVAL '15 days', 'active', 75),
('enroll-002', 'stud-001', 'course-002', NOW() - INTERVAL '10 days', 'active', 45),
('enroll-003', 'stud-002', 'course-001', NOW() - INTERVAL '12 days', 'active', 60),
('enroll-004', 'stud-002', 'course-003', NOW() - INTERVAL '8 days', 'active', 30),
('enroll-005', 'stud-003', 'course-002', NOW() - INTERVAL '20 days', 'completed', 100),
('enroll-006', 'stud-003', 'course-004', NOW() - INTERVAL '5 days', 'active', 25),
('enroll-007', 'stud-004', 'course-001', NOW() - INTERVAL '18 days', 'active', 85),
('enroll-008', 'stud-005', 'course-003', NOW() - INTERVAL '3 days', 'active', 15);

-- =====================================================
-- DEMO ASSESSMENTS - Evaluaciones de ejemplo
-- =====================================================

INSERT INTO assessments (id, course_id, title, description, assessment_type, max_score, time_limit_minutes, created_at) VALUES
('assess-001', 'course-001', 'Examen Fundamentos de IA', 'Evaluación comprensiva de los conceptos básicos de inteligencia artificial.', 'exam', 100, 60, NOW()),
('assess-002', 'course-001', 'Quiz Rápido Machine Learning', 'Evaluación rápida de conocimientos sobre ML supervisado y no supervisado.', 'quiz', 50, 15, NOW()),
('assess-003', 'course-002', 'Proyecto Final Full Stack', 'Desarrollo completo de una aplicación web usando las tecnologías del curso.', 'project', 200, 480, NOW()),
('assess-004', 'course-003', 'Caso de Estudio Marketing', 'Análisis de caso real de estrategia de marketing digital exitosa.', 'case_study', 150, 90, NOW());

-- =====================================================
-- DEMO PROGRESS - Progreso de estudiantes
-- =====================================================

INSERT INTO progress (id, user_id, course_id, lesson_id, completed_at, score, time_spent_minutes) VALUES
('prog-001', 'stud-001', 'course-001', 'lesson-001', NOW() - INTERVAL '14 days', 95, 50),
('prog-002', 'stud-001', 'course-001', 'lesson-002', NOW() - INTERVAL '13 days', 88, 65),
('prog-003', 'stud-001', 'course-001', 'lesson-003', NOW() - INTERVAL '11 days', 92, 95),
('prog-004', 'stud-002', 'course-001', 'lesson-001', NOW() - INTERVAL '11 days', 85, 55),
('prog-005', 'stud-002', 'course-001', 'lesson-002', NOW() - INTERVAL '9 days', 90, 70),
('prog-006', 'stud-003', 'course-002', 'lesson-005', NOW() - INTERVAL '19 days', 100, 65),
('prog-007', 'stud-003', 'course-002', 'lesson-006', NOW() - INTERVAL '17 days', 95, 95),
('prog-008', 'stud-003', 'course-002', 'lesson-007', NOW() - INTERVAL '15 days', 98, 125);

-- =====================================================
-- DEMO ANALYTICS EVENTS - Eventos para analytics
-- =====================================================

INSERT INTO analytics_events (id, user_id, event_type, event_data, created_at) VALUES
('event-001', 'stud-001', 'lesson_started', '{"course_id": "course-001", "lesson_id": "lesson-001"}', NOW() - INTERVAL '14 days'),
('event-002', 'stud-001', 'lesson_completed', '{"course_id": "course-001", "lesson_id": "lesson-001", "score": 95}', NOW() - INTERVAL '14 days'),
('event-003', 'stud-001', 'assessment_started', '{"assessment_id": "assess-001", "course_id": "course-001"}', NOW() - INTERVAL '10 days'),
('event-004', 'stud-002', 'course_enrolled', '{"course_id": "course-001"}', NOW() - INTERVAL '12 days'),
('event-005', 'stud-003', 'course_completed', '{"course_id": "course-002", "final_score": 96}', NOW() - INTERVAL '2 days'),
('event-006', 'stud-004', 'lesson_started', '{"course_id": "course-001", "lesson_id": "lesson-001"}', NOW() - INTERVAL '18 days'),
('event-007', 'stud-005', 'course_enrolled', '{"course_id": "course-003"}', NOW() - INTERVAL '3 days');

-- =====================================================
-- DEMO LEARNING ANALYTICS - Métricas de aprendizaje
-- =====================================================

INSERT INTO learning_analytics (id, user_id, course_id, engagement_score, completion_rate, avg_score, study_time_hours, last_activity, created_at) VALUES
('analytics-001', 'stud-001', 'course-001', 85.5, 75.0, 91.7, 12.5, NOW() - INTERVAL '2 days', NOW()),
('analytics-002', 'stud-001', 'course-002', 72.3, 45.0, 87.2, 8.3, NOW() - INTERVAL '1 day', NOW()),
('analytics-003', 'stud-002', 'course-001', 78.9, 60.0, 87.5, 10.2, NOW() - INTERVAL '3 days', NOW()),
('analytics-004', 'stud-003', 'course-002', 95.2, 100.0, 97.7, 25.8, NOW() - INTERVAL '1 day', NOW()),
('analytics-005', 'stud-004', 'course-001', 88.4, 85.0, 93.1, 15.7, NOW() - INTERVAL '1 day', NOW());

-- =====================================================
-- DEMO NOTIFICATIONS - Notificaciones del sistema
-- =====================================================

INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
('notif-001', 'stud-001', 'Nuevo curso disponible', 'El curso "Ciencia de Datos con Python" ya está disponible para inscripción.', 'course_announcement', false, NOW() - INTERVAL '1 day'),
('notif-002', 'stud-001', 'Recordatorio de tarea', 'Tienes una tarea pendiente en el curso de Desarrollo Web Full Stack.', 'assignment_reminder', false, NOW() - INTERVAL '2 hours'),
('notif-003', 'stud-002', 'Felicitaciones', '¡Has completado el 60% del curso de Introducción a la IA!', 'achievement', true, NOW() - INTERVAL '3 days'),
('notif-004', 'stud-003', 'Curso completado', 'Felicitaciones por completar el curso de Desarrollo Web Full Stack.', 'course_completion', true, NOW() - INTERVAL '2 days'),
('notif-005', 'prof-001', 'Nuevo estudiante', 'Diego Morales se ha inscrito en tu curso de Introducción a la IA.', 'enrollment_notification', false, NOW() - INTERVAL '3 days');

-- =====================================================
-- DEMO SYSTEM SETTINGS - Configuración del sistema
-- =====================================================

INSERT INTO system_settings (key, value, description, category, created_at) VALUES
('platform_name', 'Adaptive Learning Ecosystem', 'Nombre de la plataforma educativa', 'general', NOW()),
('max_students_per_course', '500', 'Máximo número de estudiantes por curso', 'limits', NOW()),
('session_timeout_minutes', '60', 'Tiempo de expiración de sesión en minutos', 'security', NOW()),
('enable_notifications', 'true', 'Habilitar sistema de notificaciones', 'features', NOW()),
('analytics_retention_days', '365', 'Días de retención de datos analytics', 'data', NOW()),
('demo_mode', 'true', 'Modo demo activado', 'system', NOW());

-- =====================================================
-- DEMO PERFORMANCE DATA - Datos de rendimiento
-- =====================================================

-- Generar datos de rendimiento históricos para gráficas
INSERT INTO performance_metrics (date, metric_name, metric_value, category) VALUES
(NOW() - INTERVAL '30 days', 'active_users', 45, 'users'),
(NOW() - INTERVAL '29 days', 'active_users', 52, 'users'),
(NOW() - INTERVAL '28 days', 'active_users', 48, 'users'),
(NOW() - INTERVAL '27 days', 'active_users', 61, 'users'),
(NOW() - INTERVAL '26 days', 'active_users', 57, 'users'),
(NOW() - INTERVAL '25 days', 'active_users', 64, 'users'),
(NOW() - INTERVAL '24 days', 'active_users', 69, 'users'),
(NOW() - INTERVAL '23 days', 'active_users', 72, 'users'),
(NOW() - INTERVAL '22 days', 'active_users', 78, 'users'),
(NOW() - INTERVAL '21 days', 'active_users', 75, 'users'),
(NOW() - INTERVAL '20 days', 'active_users', 82, 'users'),
(NOW() - INTERVAL '19 days', 'active_users', 88, 'users'),
(NOW() - INTERVAL '18 days', 'active_users', 91, 'users'),
(NOW() - INTERVAL '17 days', 'active_users', 95, 'users'),
(NOW() - INTERVAL '16 days', 'active_users', 92, 'users'),
(NOW() - INTERVAL '15 days', 'active_users', 98, 'users'),
(NOW() - INTERVAL '14 days', 'active_users', 102, 'users'),
(NOW() - INTERVAL '13 days', 'active_users', 105, 'users'),
(NOW() - INTERVAL '12 days', 'active_users', 108, 'users'),
(NOW() - INTERVAL '11 days', 'active_users', 112, 'users'),
(NOW() - INTERVAL '10 days', 'active_users', 115, 'users'),
(NOW() - INTERVAL '9 days', 'active_users', 118, 'users'),
(NOW() - INTERVAL '8 days', 'active_users', 122, 'users'),
(NOW() - INTERVAL '7 days', 'active_users', 125, 'users'),
(NOW() - INTERVAL '6 days', 'active_users', 128, 'users'),
(NOW() - INTERVAL '5 days', 'active_users', 132, 'users'),
(NOW() - INTERVAL '4 days', 'active_users', 135, 'users'),
(NOW() - INTERVAL '3 days', 'active_users', 138, 'users'),
(NOW() - INTERVAL '2 days', 'active_users', 142, 'users'),
(NOW() - INTERVAL '1 day', 'active_users', 145, 'users'),
(NOW(), 'active_users', 148, 'users');

-- Datos de completitud de cursos
INSERT INTO performance_metrics (date, metric_name, metric_value, category) VALUES
(NOW() - INTERVAL '7 days', 'course_completions', 12, 'courses'),
(NOW() - INTERVAL '6 days', 'course_completions', 15, 'courses'),
(NOW() - INTERVAL '5 days', 'course_completions', 18, 'courses'),
(NOW() - INTERVAL '4 days', 'course_completions', 22, 'courses'),
(NOW() - INTERVAL '3 days', 'course_completions', 25, 'courses'),
(NOW() - INTERVAL '2 days', 'course_completions', 28, 'courses'),
(NOW() - INTERVAL '1 day', 'course_completions', 31, 'courses'),
(NOW(), 'course_completions', 34, 'courses');

-- =====================================================
-- DEMO CREDENTIALS - Credenciales de acceso
-- =====================================================

-- Crear vista para credenciales demo
CREATE OR REPLACE VIEW demo_credentials AS
SELECT 
    'Demo User Access' as title,
    'admin@demo.com' as admin_email,
    'maria.gonzalez@demo.com' as teacher_email,
    'juan.perez@demo.com' as student_email,
    'demo123' as password,
    'JWT configured' as authentication,
    'All users use password: demo123' as note;

-- =====================================================
-- CONFIRMATION
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Demo data successfully loaded into Adaptive Learning Ecosystem!';
    RAISE NOTICE 'Total users: %, Total courses: %, Total lessons: %', 
        (SELECT COUNT(*) FROM users),
        (SELECT COUNT(*) FROM courses),
        (SELECT COUNT(*) FROM lessons);
END $$;