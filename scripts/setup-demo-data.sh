#!/bin/bash

# Setup Demo Data Script - Adaptive Learning Ecosystem
# Configura datos de demostración para el sistema
# Autor: Claude & Toño - EbroValley Digital

echo "🎓 Configurando datos de demostración..."
echo "================================================"

# Verificar que el directorio es correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Crear datos demo en memoria (sin base de datos real)
echo "📝 Creando datos de demostración..."

# Crear archivos JSON con datos demo para los servicios
mkdir -p ./demo-data

# Usuarios demo
cat > ./demo-data/users.json << 'EOF'
{
  "users": [
    {
      "id": "admin-001",
      "email": "admin@demo.com",
      "name": "Administrador Demo",
      "role": "admin",
      "password": "demo123",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "prof-001",
      "email": "maria.gonzalez@demo.com",
      "name": "Prof. María González",
      "role": "teacher",
      "password": "demo123",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "stud-001",
      "email": "juan.perez@demo.com",
      "name": "Juan Pérez",
      "role": "student",
      "password": "demo123",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "stud-002",
      "email": "lucia.sanchez@demo.com",
      "name": "Lucía Sánchez",
      "role": "student",
      "password": "demo123",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
EOF

# Cursos demo
cat > ./demo-data/courses.json << 'EOF'
{
  "courses": [
    {
      "id": "course-001",
      "title": "Introducción a la Inteligencia Artificial",
      "description": "Curso completo sobre los fundamentos de la IA y machine learning",
      "instructor_id": "prof-001",
      "category": "Technology",
      "difficulty": "beginner",
      "duration_hours": 40,
      "students_enrolled": 15,
      "completion_rate": 78.5
    },
    {
      "id": "course-002",
      "title": "Desarrollo Web Full Stack",
      "description": "Aprende React, Node.js, PostgreSQL y mejores prácticas",
      "instructor_id": "prof-001",
      "category": "Programming",
      "difficulty": "intermediate",
      "duration_hours": 60,
      "students_enrolled": 22,
      "completion_rate": 65.2
    },
    {
      "id": "course-003",
      "title": "Marketing Digital Avanzado",
      "description": "Estrategias modernas de marketing digital y analytics",
      "instructor_id": "prof-001",
      "category": "Business",
      "difficulty": "advanced",
      "duration_hours": 35,
      "students_enrolled": 18,
      "completion_rate": 82.1
    }
  ]
}
EOF

# Datos de analytics demo
cat > ./demo-data/analytics.json << 'EOF'
{
  "metrics": {
    "active_users": 148,
    "total_courses": 25,
    "course_completions": 34,
    "avg_engagement_score": 85.7,
    "total_study_hours": 2847,
    "user_growth_rate": 12.5
  },
  "weekly_data": [
    {"date": "2024-12-01", "active_users": 125, "completions": 8},
    {"date": "2024-12-02", "active_users": 132, "completions": 12},
    {"date": "2024-12-03", "active_users": 138, "completions": 15},
    {"date": "2024-12-04", "active_users": 142, "completions": 18},
    {"date": "2024-12-05", "active_users": 145, "completions": 22},
    {"date": "2024-12-06", "active_users": 148, "completions": 25},
    {"date": "2024-12-07", "active_users": 152, "completions": 28}
  ]
}
EOF

# Progreso de estudiantes demo
cat > ./demo-data/progress.json << 'EOF'
{
  "student_progress": [
    {
      "user_id": "stud-001",
      "course_id": "course-001",
      "progress_percentage": 75,
      "current_lesson": "Redes Neuronales Artificiales",
      "avg_score": 91.7,
      "time_spent_hours": 12.5,
      "last_activity": "2024-12-07T15:30:00Z"
    },
    {
      "user_id": "stud-002",
      "course_id": "course-001",
      "progress_percentage": 60,
      "current_lesson": "Machine Learning Básico",
      "avg_score": 87.5,
      "time_spent_hours": 10.2,
      "last_activity": "2024-12-06T11:20:00Z"
    }
  ]
}
EOF

echo "✅ Datos de demostración creados exitosamente"
echo ""
echo "📊 Resumen de datos demo:"
echo "   - 4 usuarios (1 admin, 1 profesor, 2 estudiantes)"
echo "   - 3 cursos con contenido realista"
echo "   - Métricas de analytics con datos históricos"
echo "   - Progreso de estudiantes con scores"
echo ""
echo "🔐 Credenciales de acceso demo:"
echo "   - Admin: admin@demo.com / demo123"
echo "   - Profesor: maria.gonzalez@demo.com / demo123"
echo "   - Estudiante: juan.perez@demo.com / demo123"
echo ""
echo "🌐 URLs de acceso:"
echo "   - Frontend: http://localhost:3000"
echo "   - API Gateway: http://localhost:4000"
echo "   - API Docs: http://localhost:4000/docs"
echo ""
echo "🎯 El sistema está listo para demostraciones!"
echo "================================================"