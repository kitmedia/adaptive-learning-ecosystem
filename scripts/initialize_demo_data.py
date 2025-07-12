#!/usr/bin/env python3
"""
🚀 Adaptive Learning Ecosystem - Demo Data Initializer
Inicializador de datos demo para entorno de demostración comercial

Este script popula la base de datos con datos realistas y llamativos para demos de ventas:
- 3 organizaciones demo con diferentes perfiles (Universidad, Corporativo, Bootcamp)
- Usuarios demo con diferentes roles y permisos
- Cursos con contenido variado y progreso realista
- Métricas de analytics pre-pobladas
- Datos de rendimiento y engagement
"""

import sqlite3
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
import os
import hashlib

# Configuración del entorno demo
DATABASE_PATH = "/app/database/demo.db"
DEMO_DATA_PATH = "/app/demo-data"

class DemoDataInitializer:
    def __init__(self):
        self.db_path = DATABASE_PATH
        self.demo_data_path = DEMO_DATA_PATH
        self.conn = None
        
    def connect_database(self):
        """Conectar a la base de datos SQLite"""
        try:
            # Crear directorio si no existe
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            
            self.conn = sqlite3.connect(self.db_path)
            self.conn.execute("PRAGMA foreign_keys = ON")
            print("✅ Conexión a base de datos establecida")
            return True
        except Exception as e:
            print(f"❌ Error conectando a base de datos: {e}")
            return False
    
    def create_tables(self):
        """Crear tablas del esquema de base de datos"""
        schema_sql = """
        -- Organizaciones (Tenants)
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            domain TEXT UNIQUE NOT NULL,
            plan TEXT NOT NULL DEFAULT 'starter',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            settings JSON,
            active BOOLEAN DEFAULT TRUE
        );

        -- Usuarios
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            organization_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (organization_id) REFERENCES organizations (id)
        );

        -- Cursos
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            organization_id INTEGER,
            instructor_id INTEGER,
            category TEXT,
            difficulty_level TEXT DEFAULT 'intermediate',
            total_modules INTEGER DEFAULT 0,
            estimated_hours INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            published BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (organization_id) REFERENCES organizations (id),
            FOREIGN KEY (instructor_id) REFERENCES users (id)
        );

        -- Inscripciones
        CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            course_id INTEGER,
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            progress_percentage REAL DEFAULT 0,
            completion_date TIMESTAMP,
            grade REAL,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id)
        );

        -- Módulos del curso
        CREATE TABLE IF NOT EXISTS course_modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            order_index INTEGER,
            content_type TEXT DEFAULT 'text',
            duration_minutes INTEGER DEFAULT 30,
            FOREIGN KEY (course_id) REFERENCES courses (id)
        );

        -- Progreso del estudiante
        CREATE TABLE IF NOT EXISTS student_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            course_id INTEGER,
            module_id INTEGER,
            completed BOOLEAN DEFAULT FALSE,
            completion_date TIMESTAMP,
            time_spent_minutes INTEGER DEFAULT 0,
            score REAL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id),
            FOREIGN KEY (module_id) REFERENCES course_modules (id)
        );

        -- Assessments
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            assessment_type TEXT DEFAULT 'quiz',
            max_score REAL DEFAULT 100,
            time_limit_minutes INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses (id)
        );

        -- Resultados de assessments
        CREATE TABLE IF NOT EXISTS assessment_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assessment_id INTEGER,
            user_id INTEGER,
            score REAL,
            max_score REAL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            time_taken_minutes INTEGER,
            answers JSON,
            FOREIGN KEY (assessment_id) REFERENCES assessments (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        -- Analytics de aprendizaje
        CREATE TABLE IF NOT EXISTS learning_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            course_id INTEGER,
            session_date DATE,
            time_spent_minutes INTEGER,
            modules_completed INTEGER DEFAULT 0,
            engagement_score REAL,
            learning_velocity REAL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id)
        );

        -- Métricas del sistema
        CREATE TABLE IF NOT EXISTS system_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_date DATE,
            organization_id INTEGER,
            active_users INTEGER DEFAULT 0,
            total_sessions INTEGER DEFAULT 0,
            total_learning_hours REAL DEFAULT 0,
            completion_rate REAL DEFAULT 0,
            engagement_score REAL DEFAULT 0,
            FOREIGN KEY (organization_id) REFERENCES organizations (id)
        );

        -- Interacciones con AI Tutor
        CREATE TABLE IF NOT EXISTS ai_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            course_id INTEGER,
            interaction_type TEXT,
            prompt TEXT,
            response TEXT,
            satisfaction_rating INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id)
        );
        """
        
        try:
            self.conn.executescript(schema_sql)
            self.conn.commit()
            print("✅ Esquema de base de datos creado exitosamente")
            return True
        except Exception as e:
            print(f"❌ Error creando esquema: {e}")
            return False
    
    def hash_password(self, password):
        """Hash de contraseña simple para demo"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_demo_organizations(self):
        """Crear organizaciones demo"""
        organizations = [
            {
                'name': 'Demo University',
                'domain': 'demo-university.edu',
                'plan': 'enterprise',
                'settings': json.dumps({
                    'branding': {'color': '#1e40af', 'logo': 'university-logo.png'},
                    'features': ['ai_tutor', 'advanced_analytics', 'collaboration'],
                    'limits': {'users': 2500, 'courses': 100, 'storage_gb': 500}
                })
            },
            {
                'name': 'TechCorp Training',
                'domain': 'techcorp.com',
                'plan': 'professional',
                'settings': json.dumps({
                    'branding': {'color': '#059669', 'logo': 'techcorp-logo.png'},
                    'features': ['ai_tutor', 'basic_analytics', 'assessments'],
                    'limits': {'users': 850, 'courses': 50, 'storage_gb': 200}
                })
            },
            {
                'name': 'CodeBootcamp Pro',
                'domain': 'codebootcamp.io',
                'plan': 'starter',
                'settings': json.dumps({
                    'branding': {'color': '#dc2626', 'logo': 'bootcamp-logo.png'},
                    'features': ['ai_tutor', 'basic_analytics'],
                    'limits': {'users': 120, 'courses': 20, 'storage_gb': 50}
                })
            }
        ]
        
        try:
            for org in organizations:
                self.conn.execute("""
                    INSERT INTO organizations (name, domain, plan, settings)
                    VALUES (?, ?, ?, ?)
                """, (org['name'], org['domain'], org['plan'], org['settings']))
            
            self.conn.commit()
            print(f"✅ Creadas {len(organizations)} organizaciones demo")
            return True
        except Exception as e:
            print(f"❌ Error creando organizaciones: {e}")
            return False
    
    def create_demo_users(self):
        """Crear usuarios demo"""
        users = [
            # Demo University
            {'email': 'admin@demo.com', 'password': 'AdminDemo2024!', 'first_name': 'Sarah', 'last_name': 'Administrator', 'role': 'admin', 'org_id': 1},
            {'email': 'instructor@demo.com', 'password': 'InstructorDemo2024!', 'first_name': 'Dr. Michael', 'last_name': 'Professor', 'role': 'instructor', 'org_id': 1},
            {'email': 'student@demo.com', 'password': 'StudentDemo2024!', 'first_name': 'Emily', 'last_name': 'Student', 'role': 'student', 'org_id': 1},
            
            # TechCorp Training
            {'email': 'admin@techcorp.com', 'password': 'TechAdmin2024!', 'first_name': 'James', 'last_name': 'TechLead', 'role': 'admin', 'org_id': 2},
            {'email': 'trainer@techcorp.com', 'password': 'Trainer2024!', 'first_name': 'Lisa', 'last_name': 'Corporate', 'role': 'instructor', 'org_id': 2},
            {'email': 'employee@techcorp.com', 'password': 'Employee2024!', 'first_name': 'Alex', 'last_name': 'Developer', 'role': 'student', 'org_id': 2},
            
            # CodeBootcamp Pro
            {'email': 'admin@codebootcamp.io', 'password': 'BootAdmin2024!', 'first_name': 'Maria', 'last_name': 'Director', 'role': 'admin', 'org_id': 3},
            {'email': 'mentor@codebootcamp.io', 'password': 'Mentor2024!', 'first_name': 'Carlos', 'last_name': 'Mentor', 'role': 'instructor', 'org_id': 3},
            {'email': 'coder@codebootcamp.io', 'password': 'Coder2024!', 'first_name': 'Ana', 'last_name': 'Coder', 'role': 'student', 'org_id': 3},
        ]
        
        # Generar usuarios adicionales para demo realista
        additional_users = []
        first_names = ['John', 'Jane', 'Robert', 'Emma', 'William', 'Olivia', 'David', 'Sophia']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
        
        # Universidad - más estudiantes
        for i in range(15):
            first = random.choice(first_names)
            last = random.choice(last_names)
            additional_users.append({
                'email': f'{first.lower()}.{last.lower()}{i}@demo-university.edu',
                'password': 'DemoStudent2024!',
                'first_name': first,
                'last_name': f'{last}{i}',
                'role': 'student',
                'org_id': 1
            })
        
        # TechCorp - empleados
        for i in range(10):
            first = random.choice(first_names)
            last = random.choice(last_names)
            additional_users.append({
                'email': f'{first.lower()}.{last.lower()}{i}@techcorp.com',
                'password': 'TechEmployee2024!',
                'first_name': first,
                'last_name': f'{last}{i}',
                'role': 'student',
                'org_id': 2
            })
        
        # Bootcamp - estudiantes
        for i in range(8):
            first = random.choice(first_names)
            last = random.choice(last_names)
            additional_users.append({
                'email': f'{first.lower()}.{last.lower()}{i}@codebootcamp.io',
                'password': 'BootStudent2024!',
                'first_name': first,
                'last_name': f'{last}{i}',
                'role': 'student',
                'org_id': 3
            })
        
        all_users = users + additional_users
        
        try:
            for user in all_users:
                password_hash = self.hash_password(user['password'])
                last_login = datetime.now() - timedelta(days=random.randint(0, 30))
                
                self.conn.execute("""
                    INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id, last_login)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (user['email'], password_hash, user['first_name'], user['last_name'], 
                     user['role'], user['org_id'], last_login))
            
            self.conn.commit()
            print(f"✅ Creados {len(all_users)} usuarios demo")
            return True
        except Exception as e:
            print(f"❌ Error creando usuarios: {e}")
            return False
    
    def create_demo_courses(self):
        """Crear cursos demo realistas"""
        courses = [
            # Demo University
            {
                'title': 'Introduction to Machine Learning',
                'description': 'Comprehensive introduction to ML algorithms, supervised and unsupervised learning',
                'org_id': 1, 'instructor_id': 2, 'category': 'Computer Science',
                'difficulty': 'intermediate', 'modules': 12, 'hours': 40
            },
            {
                'title': 'Advanced Data Structures',
                'description': 'Deep dive into complex data structures and algorithm optimization',
                'org_id': 1, 'instructor_id': 2, 'category': 'Computer Science',
                'difficulty': 'advanced', 'modules': 8, 'hours': 35
            },
            {
                'title': 'Digital Marketing Strategy',
                'description': 'Modern digital marketing techniques and campaign optimization',
                'org_id': 1, 'instructor_id': 2, 'category': 'Business',
                'difficulty': 'beginner', 'modules': 10, 'hours': 25
            },
            
            # TechCorp Training
            {
                'title': 'Cybersecurity Fundamentals',
                'description': 'Essential cybersecurity practices for corporate environments',
                'org_id': 2, 'instructor_id': 5, 'category': 'Security',
                'difficulty': 'intermediate', 'modules': 6, 'hours': 20
            },
            {
                'title': 'Agile Project Management',
                'description': 'Scrum and Kanban methodologies for effective team management',
                'org_id': 2, 'instructor_id': 5, 'category': 'Management',
                'difficulty': 'beginner', 'modules': 8, 'hours': 15
            },
            {
                'title': 'Cloud Architecture AWS',
                'description': 'Design and implement scalable cloud solutions with AWS',
                'org_id': 2, 'instructor_id': 5, 'category': 'Technology',
                'difficulty': 'advanced', 'modules': 14, 'hours': 50
            },
            
            # CodeBootcamp Pro
            {
                'title': 'Full-Stack JavaScript Development',
                'description': 'Complete web development with Node.js, React, and MongoDB',
                'org_id': 3, 'instructor_id': 8, 'category': 'Programming',
                'difficulty': 'intermediate', 'modules': 16, 'hours': 80
            },
            {
                'title': 'Python for Data Science',
                'description': 'Data analysis and visualization with Python, Pandas, and Matplotlib',
                'org_id': 3, 'instructor_id': 8, 'category': 'Data Science',
                'difficulty': 'beginner', 'modules': 12, 'hours': 45
            },
        ]
        
        try:
            for course in courses:
                self.conn.execute("""
                    INSERT INTO courses (title, description, organization_id, instructor_id, 
                                       category, difficulty_level, total_modules, estimated_hours)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (course['title'], course['description'], course['org_id'], 
                     course['instructor_id'], course['category'], course['difficulty'],
                     course['modules'], course['hours']))
            
            self.conn.commit()
            print(f"✅ Creados {len(courses)} cursos demo")
            return True
        except Exception as e:
            print(f"❌ Error creando cursos: {e}")
            return False
    
    def create_course_modules(self):
        """Crear módulos para cada curso"""
        try:
            # Obtener todos los cursos
            courses = self.conn.execute("SELECT id, title, total_modules FROM courses").fetchall()
            
            modules_created = 0
            for course_id, course_title, total_modules in courses:
                for i in range(1, total_modules + 1):
                    module_title = f"Module {i}: {course_title} - Part {i}"
                    duration = random.randint(20, 60)
                    content_types = ['video', 'text', 'interactive', 'quiz']
                    content_type = random.choice(content_types)
                    
                    self.conn.execute("""
                        INSERT INTO course_modules (course_id, title, description, order_index, 
                                                  content_type, duration_minutes)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (course_id, module_title, f"Learning objectives for {module_title}",
                         i, content_type, duration))
                    modules_created += 1
            
            self.conn.commit()
            print(f"✅ Creados {modules_created} módulos de curso")
            return True
        except Exception as e:
            print(f"❌ Error creando módulos: {e}")
            return False
    
    def create_enrollments_and_progress(self):
        """Crear inscripciones y progreso realista"""
        try:
            # Obtener estudiantes y cursos
            students = self.conn.execute("""
                SELECT id, organization_id FROM users WHERE role = 'student'
            """).fetchall()
            
            courses = self.conn.execute("""
                SELECT id, organization_id, total_modules FROM courses
            """).fetchall()
            
            enrollments_created = 0
            
            for student_id, student_org_id in students:
                # Cada estudiante se inscribe en 2-4 cursos de su organización
                org_courses = [c for c in courses if c[1] == student_org_id]
                num_enrollments = min(random.randint(2, 4), len(org_courses))
                enrolled_courses = random.sample(org_courses, num_enrollments)
                
                for course_id, _, total_modules in enrolled_courses:
                    # Crear inscripción
                    enrolled_date = datetime.now() - timedelta(days=random.randint(1, 90))
                    progress = random.randint(10, 95)
                    
                    completion_date = None
                    grade = None
                    status = 'active'
                    
                    if progress >= 90:
                        completion_date = enrolled_date + timedelta(days=random.randint(15, 60))
                        grade = random.uniform(70, 98)
                        status = 'completed'
                    
                    self.conn.execute("""
                        INSERT INTO enrollments (user_id, course_id, enrolled_at, progress_percentage,
                                               completion_date, grade, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (student_id, course_id, enrolled_date, progress, completion_date, grade, status))
                    
                    # Crear progreso de módulos
                    modules = self.conn.execute("""
                        SELECT id, duration_minutes FROM course_modules WHERE course_id = ?
                    """, (course_id,)).fetchall()
                    
                    completed_modules = int((progress / 100) * len(modules))
                    
                    for i, (module_id, duration) in enumerate(modules):
                        if i < completed_modules:
                            completion_date_mod = enrolled_date + timedelta(days=i*2)
                            time_spent = random.randint(duration, duration*2)
                            score = random.uniform(60, 95)
                            
                            self.conn.execute("""
                                INSERT INTO student_progress (user_id, course_id, module_id, completed,
                                                             completion_date, time_spent_minutes, score)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            """, (student_id, course_id, module_id, True, completion_date_mod, 
                                 time_spent, score))
                    
                    enrollments_created += 1
            
            self.conn.commit()
            print(f"✅ Creadas {enrollments_created} inscripciones con progreso")
            return True
        except Exception as e:
            print(f"❌ Error creando inscripciones: {e}")
            return False
    
    def create_analytics_data(self):
        """Crear datos de analytics realistas"""
        try:
            # Obtener organizaciones
            orgs = self.conn.execute("SELECT id FROM organizations").fetchall()
            
            analytics_records = 0
            
            for org_id, in orgs:
                # Crear datos para los últimos 30 días
                for days_ago in range(30):
                    date = datetime.now().date() - timedelta(days=days_ago)
                    
                    # Datos base según el tamaño de la organización
                    if org_id == 1:  # Universidad grande
                        base_users = random.randint(180, 220)
                        base_sessions = random.randint(300, 400)
                        base_hours = random.uniform(800, 1200)
                    elif org_id == 2:  # TechCorp mediano
                        base_users = random.randint(60, 90)
                        base_sessions = random.randint(100, 150)
                        base_hours = random.uniform(200, 400)
                    else:  # Bootcamp pequeño
                        base_users = random.randint(20, 35)
                        base_sessions = random.randint(40, 70)
                        base_hours = random.uniform(80, 150)
                    
                    completion_rate = random.uniform(75, 92)
                    engagement_score = random.uniform(7.5, 9.2)
                    
                    self.conn.execute("""
                        INSERT INTO system_metrics (metric_date, organization_id, active_users,
                                                   total_sessions, total_learning_hours, 
                                                   completion_rate, engagement_score)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (date, org_id, base_users, base_sessions, base_hours,
                         completion_rate, engagement_score))
                    
                    analytics_records += 1
            
            self.conn.commit()
            print(f"✅ Creados {analytics_records} registros de analytics")
            return True
        except Exception as e:
            print(f"❌ Error creando analytics: {e}")
            return False
    
    def create_ai_interactions(self):
        """Crear interacciones con AI Tutor"""
        try:
            students = self.conn.execute("""
                SELECT u.id, e.course_id FROM users u
                JOIN enrollments e ON u.id = e.user_id
                WHERE u.role = 'student'
            """).fetchall()
            
            interaction_types = ['question', 'help_request', 'explanation', 'feedback']
            prompts = [
                "Can you explain this concept in simpler terms?",
                "I'm struggling with this problem, can you help?",
                "What's the best way to approach this topic?",
                "Can you provide an example?",
                "I don't understand the relationship between these concepts"
            ]
            
            responses = [
                "Let me break this down into smaller parts...",
                "Here's a step-by-step approach to solve this...",
                "Think of it this way: imagine you have...",
                "The key concept here is...",
                "Great question! This relates to what we learned earlier..."
            ]
            
            interactions_created = 0
            
            for student_id, course_id in students:
                # Cada estudiante tiene 3-8 interacciones por curso
                num_interactions = random.randint(3, 8)
                
                for _ in range(num_interactions):
                    interaction_date = datetime.now() - timedelta(days=random.randint(1, 30))
                    interaction_type = random.choice(interaction_types)
                    prompt = random.choice(prompts)
                    response = random.choice(responses)
                    satisfaction = random.randint(3, 5)  # 3-5 stars
                    
                    self.conn.execute("""
                        INSERT INTO ai_interactions (user_id, course_id, interaction_type,
                                                   prompt, response, satisfaction_rating, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (student_id, course_id, interaction_type, prompt, response,
                         satisfaction, interaction_date))
                    
                    interactions_created += 1
            
            self.conn.commit()
            print(f"✅ Creadas {interactions_created} interacciones con AI")
            return True
        except Exception as e:
            print(f"❌ Error creando interacciones AI: {e}")
            return False
    
    def generate_summary_report(self):
        """Generar reporte resumen de datos demo"""
        try:
            # Estadísticas por organización
            stats = self.conn.execute("""
                SELECT 
                    o.name,
                    o.plan,
                    COUNT(DISTINCT u.id) as total_users,
                    COUNT(DISTINCT c.id) as total_courses,
                    COUNT(DISTINCT e.id) as total_enrollments,
                    AVG(e.progress_percentage) as avg_progress,
                    COUNT(DISTINCT ai.id) as ai_interactions
                FROM organizations o
                LEFT JOIN users u ON o.id = u.organization_id
                LEFT JOIN courses c ON o.id = c.organization_id
                LEFT JOIN enrollments e ON u.id = e.user_id
                LEFT JOIN ai_interactions ai ON u.id = ai.user_id
                GROUP BY o.id, o.name, o.plan
            """).fetchall()
            
            print("\n" + "="*80)
            print("🎯 RESUMEN DE DATOS DEMO GENERADOS")
            print("="*80)
            
            for stat in stats:
                name, plan, users, courses, enrollments, avg_progress, ai_interactions = stat
                print(f"\n📊 {name} ({plan.upper()})")
                print(f"   👥 Usuarios: {users}")
                print(f"   📚 Cursos: {courses}")
                print(f"   📝 Inscripciones: {enrollments}")
                print(f"   📈 Progreso Promedio: {avg_progress:.1f}%")
                print(f"   🤖 Interacciones IA: {ai_interactions}")
            
            # Métricas globales
            total_stats = self.conn.execute("""
                SELECT 
                    COUNT(DISTINCT o.id) as organizations,
                    COUNT(DISTINCT u.id) as users,
                    COUNT(DISTINCT c.id) as courses,
                    COUNT(DISTINCT e.id) as enrollments,
                    COUNT(DISTINCT cm.id) as modules,
                    COUNT(DISTINCT ai.id) as ai_interactions
                FROM organizations o
                LEFT JOIN users u ON o.id = u.organization_id
                LEFT JOIN courses c ON o.id = c.organization_id
                LEFT JOIN enrollments e ON u.id = e.user_id
                LEFT JOIN course_modules cm ON c.id = cm.course_id
                LEFT JOIN ai_interactions ai ON u.id = ai.user_id
            """).fetchone()
            
            print(f"\n🌟 TOTALES GENERALES:")
            print(f"   🏢 Organizaciones: {total_stats[0]}")
            print(f"   👥 Usuarios Total: {total_stats[1]}")
            print(f"   📚 Cursos Total: {total_stats[2]}")
            print(f"   📝 Inscripciones: {total_stats[3]}")
            print(f"   📖 Módulos: {total_stats[4]}")
            print(f"   🤖 Interacciones IA: {total_stats[5]}")
            
            print("\n" + "="*80)
            print("✅ ENTORNO DEMO LISTO PARA COMERCIALIZACIÓN")
            print("="*80)
            
            return True
        except Exception as e:
            print(f"❌ Error generando reporte: {e}")
            return False
    
    def run_initialization(self):
        """Ejecutar todo el proceso de inicialización"""
        print("🚀 Iniciando creación de datos demo para comercialización...")
        print("="*80)
        
        if not self.connect_database():
            return False
        
        steps = [
            ("Creando esquema de base de datos", self.create_tables),
            ("Creando organizaciones demo", self.create_demo_organizations),
            ("Creando usuarios demo", self.create_demo_users),
            ("Creando cursos demo", self.create_demo_courses),
            ("Creando módulos de cursos", self.create_course_modules),
            ("Generando inscripciones y progreso", self.create_enrollments_and_progress),
            ("Creando datos de analytics", self.create_analytics_data),
            ("Generando interacciones IA", self.create_ai_interactions),
            ("Generando reporte resumen", self.generate_summary_report)
        ]
        
        for step_name, step_function in steps:
            print(f"\n⏳ {step_name}...")
            if not step_function():
                print(f"❌ Error en: {step_name}")
                return False
        
        if self.conn:
            self.conn.close()
        
        print("\n🎉 ¡INICIALIZACIÓN DEMO COMPLETADA CON ÉXITO!")
        print("🚀 El entorno está listo para demostraciones comerciales")
        
        return True

if __name__ == "__main__":
    initializer = DemoDataInitializer()
    success = initializer.run_initialization()
    exit(0 if success else 1)