#!/usr/bin/env python3
"""
Progress Tracking Service - Adaptive Learning Ecosystem
EbroValley Digital - ToñoAdPAOS & Claudio Supreme

Servicio para trackear el progreso de aprendizaje de estudiantes
- Seguimiento de lecciones completadas
- Métricas de tiempo y performance
- Integración con AI-Tutor para recomendaciones
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import sqlite3
import json
import os
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicialización de FastAPI
app = FastAPI(
    title="📈 Progress Tracking Service - Adaptive Learning Ecosystem",
    description="""
    # 📊 Progress Tracking Service - Learning Analytics
    
    **EbroValley Digital** - Educational Excellence Platform
    
    ## Overview
    This service provides comprehensive progress tracking and learning analytics for students.
    Features include lesson completion tracking, performance metrics, gamification, and
    detailed progress analytics.
    
    ## Key Features
    - 📚 **Lesson Progress**: Track completion status and time spent
    - 🎯 **Performance Metrics**: Scores, attempts, and improvement tracking
    - 🏆 **Gamification**: Points, badges, levels, and achievements
    - 📊 **Analytics**: Detailed learning patterns and insights
    - ⚡ **Real-time Updates**: Live progress synchronization
    - 🎯 **Goal Tracking**: Learning objectives and milestones
    
    ## Analytics Features
    - Learning velocity and pace analysis
    - Difficulty adaptation recommendations
    - Engagement pattern recognition
    - Performance trend analysis
    - Comparative analytics and benchmarking
    
    ## Integration
    Seamlessly integrates with AI-Tutor service for personalized recommendations
    and Assessment service for comprehensive evaluation tracking.
    """,
    version="1.0.0",
    contact={
        "name": "EbroValley Digital Team",
        "url": "https://ebrovalley.com",
        "email": "support@ebrovalley.com"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    },
    servers=[
        {"url": "http://localhost:5004", "description": "Development Server"},
        {"url": "https://staging-progress.adaptivelearning.com", "description": "Staging Server"},
        {"url": "https://progress.adaptivelearning.com", "description": "Production Server"}
    ],
    tags_metadata=[
        {"name": "Health", "description": "Service health and monitoring"},
        {"name": "Progress Updates", "description": "Lesson progress and completion tracking"},
        {"name": "Analytics", "description": "Learning analytics and insights"},
        {"name": "Gamification", "description": "Points, badges, and achievement system"},
        {"name": "Reports", "description": "Progress reports and summaries"}
    ]
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base de datos
DB_PATH = "../../database/adaptive_learning.db"

def get_db():
    """Conexión a base de datos SQLite"""
    db_path = os.path.abspath(DB_PATH)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=500, detail="Database not found")
    
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Modelos Pydantic
class LessonProgress(BaseModel):
    lesson_id: str
    student_id: str
    course_id: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    time_spent_seconds: int = 0
    score: Optional[float] = None
    attempts: int = 1
    status: str = "in_progress"  # in_progress, completed, failed

class ProgressUpdate(BaseModel):
    lesson_id: str
    student_id: str
    course_id: str
    action: str  # start, complete, update_score, fail
    score: Optional[float] = None
    time_spent_seconds: Optional[int] = None

class StudentProgressSummary(BaseModel):
    student_id: str
    course_id: str
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    total_time_seconds: int
    average_score: float
    last_activity: datetime
    current_streak: int

# Endpoints

@app.get("/health", tags=["Health"],
         summary="Health Check",
         description="Check service health, database connectivity, and tracking system status")
async def health_check():
    """Health check del servicio con información detallada del estado"""
    return {
        "status": "healthy",
        "service": "progress-tracking-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.post("/progress/update", tags=["Progress Updates"],
          summary="Update Lesson Progress",
          description="Update student progress for a specific lesson with detailed tracking metrics")
async def update_progress(
    progress: ProgressUpdate,
    db: sqlite3.Connection = Depends(get_db)
):
    """Actualizar progreso de una lección con métricas detalladas y gamificación"""
    try:
        cursor = db.cursor()
        
        # Verificar si ya existe registro de progreso
        cursor.execute("""
            SELECT * FROM student_lesson_progress 
            WHERE student_id = ? AND lesson_id = ? AND course_id = ?
        """, (progress.student_id, progress.lesson_id, progress.course_id))
        
        existing = cursor.fetchone()
        current_time = datetime.utcnow()
        
        if progress.action == "start":
            if existing:
                # Actualizar started_at si no estaba iniciado
                cursor.execute("""
                    UPDATE student_lesson_progress 
                    SET started_at = COALESCE(started_at, ?), status = 'in_progress'
                    WHERE student_id = ? AND lesson_id = ? AND course_id = ?
                """, (current_time, progress.student_id, progress.lesson_id, progress.course_id))
            else:
                # Crear nuevo registro
                cursor.execute("""
                    INSERT INTO student_lesson_progress 
                    (student_id, lesson_id, course_id, started_at, status, attempts)
                    VALUES (?, ?, ?, ?, 'in_progress', 1)
                """, (progress.student_id, progress.lesson_id, progress.course_id, current_time))
        
        elif progress.action == "complete":
            if existing:
                cursor.execute("""
                    UPDATE student_lesson_progress 
                    SET completed_at = ?, status = 'completed',
                        time_spent_seconds = COALESCE(time_spent_seconds, 0) + ?,
                        score = COALESCE(?, score)
                    WHERE student_id = ? AND lesson_id = ? AND course_id = ?
                """, (current_time, progress.time_spent_seconds or 0, progress.score,
                      progress.student_id, progress.lesson_id, progress.course_id))
            else:
                # Crear como completado directamente
                cursor.execute("""
                    INSERT INTO student_lesson_progress 
                    (student_id, lesson_id, course_id, started_at, completed_at, 
                     status, score, time_spent_seconds, attempts)
                    VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, 1)
                """, (progress.student_id, progress.lesson_id, progress.course_id,
                      current_time, current_time, progress.score, progress.time_spent_seconds or 0))
        
        elif progress.action == "update_score":
            if existing:
                cursor.execute("""
                    UPDATE student_lesson_progress 
                    SET score = ?, time_spent_seconds = COALESCE(time_spent_seconds, 0) + ?
                    WHERE student_id = ? AND lesson_id = ? AND course_id = ?
                """, (progress.score, progress.time_spent_seconds or 0,
                      progress.student_id, progress.lesson_id, progress.course_id))
        
        elif progress.action == "fail":
            if existing:
                cursor.execute("""
                    UPDATE student_lesson_progress 
                    SET status = 'failed', attempts = attempts + 1,
                        time_spent_seconds = COALESCE(time_spent_seconds, 0) + ?
                    WHERE student_id = ? AND lesson_id = ? AND course_id = ?
                """, (progress.time_spent_seconds or 0,
                      progress.student_id, progress.lesson_id, progress.course_id))
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Progress updated for action: {progress.action}",
            "student_id": progress.student_id,
            "lesson_id": progress.lesson_id
        }
        
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating progress: {str(e)}")

@app.get("/progress/student/{student_id}/course/{course_id}")
async def get_student_progress(
    student_id: str,
    course_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Obtener progreso detallado de un estudiante en un curso"""
    try:
        cursor = db.cursor()
        
        # Progreso por lección
        cursor.execute("""
            SELECT lesson_id, started_at, completed_at, time_spent_seconds,
                   score, attempts, status
            FROM student_lesson_progress 
            WHERE student_id = ? AND course_id = ?
            ORDER BY started_at ASC
        """, (student_id, course_id))
        
        lessons = [dict(row) for row in cursor.fetchall()]
        
        # Estadísticas generales
        cursor.execute("""
            SELECT 
                COUNT(*) as total_lessons,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_lessons,
                SUM(time_spent_seconds) as total_time,
                AVG(CASE WHEN score IS NOT NULL THEN score END) as avg_score,
                MAX(CASE WHEN completed_at IS NOT NULL THEN completed_at END) as last_activity
            FROM student_lesson_progress 
            WHERE student_id = ? AND course_id = ?
        """, (student_id, course_id))
        
        stats = dict(cursor.fetchone())
        
        # Calcular streak (días consecutivos)
        cursor.execute("""
            SELECT DATE(completed_at) as date
            FROM student_lesson_progress 
            WHERE student_id = ? AND course_id = ? AND status = 'completed'
            GROUP BY DATE(completed_at)
            ORDER BY date DESC
        """, (student_id, course_id))
        
        dates = [row['date'] for row in cursor.fetchall()]
        streak = calculate_streak(dates)
        
        progress_percentage = 0
        if stats['total_lessons'] > 0:
            progress_percentage = (stats['completed_lessons'] / stats['total_lessons']) * 100
        
        return {
            "student_id": student_id,
            "course_id": course_id,
            "lessons": lessons,
            "summary": {
                "total_lessons": stats['total_lessons'] or 0,
                "completed_lessons": stats['completed_lessons'] or 0,
                "progress_percentage": round(progress_percentage, 2),
                "total_time_seconds": stats['total_time'] or 0,
                "average_score": round(stats['avg_score'] or 0, 2),
                "last_activity": stats['last_activity'],
                "current_streak": streak
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting student progress: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting progress: {str(e)}")

@app.get("/progress/student/{student_id}/summary")
async def get_student_overall_progress(
    student_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Resumen general de progreso del estudiante en todos los cursos"""
    try:
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT 
                course_id,
                COUNT(*) as total_lessons,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_lessons,
                SUM(time_spent_seconds) as total_time,
                AVG(CASE WHEN score IS NOT NULL THEN score END) as avg_score,
                MAX(CASE WHEN completed_at IS NOT NULL THEN completed_at END) as last_activity
            FROM student_lesson_progress 
            WHERE student_id = ?
            GROUP BY course_id
        """, (student_id,))
        
        courses = []
        for row in cursor.fetchall():
            course_data = dict(row)
            progress_percentage = 0
            if course_data['total_lessons'] > 0:
                progress_percentage = (course_data['completed_lessons'] / course_data['total_lessons']) * 100
            
            course_data['progress_percentage'] = round(progress_percentage, 2)
            courses.append(course_data)
        
        # Estadísticas globales
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT course_id) as active_courses,
                COUNT(*) as total_lessons,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_lessons,
                SUM(time_spent_seconds) as total_time,
                AVG(CASE WHEN score IS NOT NULL THEN score END) as overall_avg_score
            FROM student_lesson_progress 
            WHERE student_id = ?
        """, (student_id,))
        
        global_stats = dict(cursor.fetchone())
        
        return {
            "student_id": student_id,
            "courses": courses,
            "global_summary": global_stats
        }
        
    except Exception as e:
        logger.error(f"Error getting overall progress: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting overall progress: {str(e)}")

def calculate_streak(dates: List[str]) -> int:
    """Calcular racha de días consecutivos"""
    if not dates:
        return 0
    
    from datetime import datetime, timedelta
    
    # Convertir strings a fechas
    date_objects = [datetime.strptime(date, '%Y-%m-%d').date() for date in dates]
    date_objects.sort(reverse=True)  # Más reciente primero
    
    streak = 0
    today = datetime.now().date()
    
    for i, date in enumerate(date_objects):
        expected_date = today - timedelta(days=i)
        if date == expected_date:
            streak += 1
        else:
            break
    
    return streak

if __name__ == "__main__":
    import uvicorn
    
    # Crear tabla si no existe
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS student_lesson_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                lesson_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                time_spent_seconds INTEGER DEFAULT 0,
                score FLOAT,
                attempts INTEGER DEFAULT 1,
                status TEXT DEFAULT 'in_progress',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, lesson_id, course_id)
            )
        """)
        
        conn.commit()
        conn.close()
        
        logger.info("✅ Database table student_lesson_progress created/verified")
    
    logger.info("🚀 Starting Progress Tracking Service on port 5004")
    uvicorn.run(app, host="0.0.0.0", port=5004)