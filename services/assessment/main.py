#!/usr/bin/env python3
"""
Assessment Service - Adaptive Learning Ecosystem
EbroValley Digital - ToñoAdPAOS & Claudio Supreme

Servicio para evaluaciones y ejercicios adaptativos
- Generación de evaluaciones personalizadas
- Corrección automática y manual
- Análisis de rendimiento
- Integración con AI-Tutor para recomendaciones
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Union
import sqlite3
import json
import os
import logging
import random
import uuid

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicialización de FastAPI
app = FastAPI(
    title="📝 Assessment Service - Adaptive Learning Ecosystem",
    description="""
    # 🎯 Assessment Service - Intelligent Evaluation System
    
    **EbroValley Digital** - Educational Excellence Platform
    
    ## Overview
    This service provides comprehensive assessment and evaluation capabilities with adaptive
    questioning algorithms. Features include personalized quizzes, automatic grading,
    performance analysis, and intelligent difficulty adjustment.
    
    ## Key Features
    - 🧠 **Adaptive Assessments**: Dynamic difficulty adjustment based on performance
    - 🔄 **Multiple Question Types**: Multiple choice, short answer, essay, coding challenges
    - ⚙️ **Automatic Grading**: Instant feedback and scoring with detailed explanations
    - 📊 **Performance Analytics**: Detailed analysis of strengths and weaknesses
    - 🕰️ **Timed Assessments**: Flexible time limits and progress tracking
    - 🎯 **Learning Objectives**: Aligned with curriculum standards and goals
    
    ## Assessment Types
    - **Diagnostic**: Initial skill level assessment
    - **Formative**: Ongoing progress evaluation
    - **Summative**: Comprehensive knowledge testing
    - **Practice**: Skills reinforcement and review
    - **Adaptive**: Real-time difficulty adjustment
    
    ## Integration
    Seamlessly integrates with AI-Tutor for personalized question selection
    and Progress Tracking for comprehensive learning analytics.
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
        {"url": "http://localhost:5005", "description": "Development Server"},
        {"url": "https://staging-assessment.adaptivelearning.com", "description": "Staging Server"},
        {"url": "https://assessment.adaptivelearning.com", "description": "Production Server"}
    ],
    tags_metadata=[
        {"name": "Health", "description": "Service health and monitoring"},
        {"name": "Assessments", "description": "Assessment creation and management"},
        {"name": "Questions", "description": "Question bank and generation"},
        {"name": "Submissions", "description": "Answer submission and grading"},
        {"name": "Analytics", "description": "Performance analysis and insights"},
        {"name": "Adaptive", "description": "Adaptive assessment algorithms"}
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
class QuestionModel(BaseModel):
    id: str
    question_text: str
    question_type: str  # multiple_choice, true_false, short_answer, essay, code
    options: Optional[List[str]] = None
    correct_answer: Union[str, int, List[str]]
    difficulty_level: str  # beginner, intermediate, advanced
    topic: str
    learning_objective: str
    max_points: float = 10.0
    time_limit_seconds: Optional[int] = None

class AssessmentModel(BaseModel):
    id: str
    title: str
    description: str
    course_id: str
    lesson_id: Optional[str] = None
    questions: List[QuestionModel]
    total_points: float
    time_limit_minutes: Optional[int] = None
    difficulty_level: str
    assessment_type: str  # quiz, exam, practice, diagnostic
    created_at: datetime
    is_adaptive: bool = True

class StudentAnswerModel(BaseModel):
    question_id: str
    student_answer: Union[str, int, List[str]]
    time_taken_seconds: int
    is_correct: Optional[bool] = None
    points_earned: Optional[float] = None

class AssessmentSubmissionModel(BaseModel):
    student_id: str
    assessment_id: str
    answers: List[StudentAnswerModel]
    started_at: datetime
    submitted_at: Optional[datetime] = None
    total_time_seconds: int
    auto_submit: bool = False

class AssessmentResultModel(BaseModel):
    submission_id: str
    student_id: str
    assessment_id: str
    total_score: float
    percentage_score: float
    passed: bool
    detailed_results: List[StudentAnswerModel]
    feedback: str
    recommendations: List[str]
    completed_at: datetime

# Base de preguntas por defecto para generación automática
DEFAULT_QUESTIONS_POOL = {
    "intro_ai": {
        "beginner": [
            {
                "question_text": "¿Qué es la Inteligencia Artificial?",
                "question_type": "multiple_choice",
                "options": [
                    "Un programa que simula la inteligencia humana",
                    "Un robot físico avanzado",
                    "Solo algoritmos matemáticos",
                    "Una base de datos muy grande"
                ],
                "correct_answer": 0,
                "topic": "conceptos_basicos",
                "learning_objective": "Definir qué es la IA"
            },
            {
                "question_text": "¿Cuál es la diferencia entre Machine Learning y Deep Learning?",
                "question_type": "short_answer",
                "correct_answer": "Machine Learning es un subconjunto de IA que permite a las máquinas aprender sin programación explícita. Deep Learning es un subconjunto de ML que usa redes neuronales artificiales.",
                "topic": "tipos_ia",
                "learning_objective": "Distinguir entre ML y DL"
            }
        ],
        "intermediate": [
            {
                "question_text": "¿Qué algoritmo es mejor para clasificación de texto?",
                "question_type": "multiple_choice",
                "options": [
                    "Linear Regression",
                    "Naive Bayes",
                    "K-Means",
                    "DBSCAN"
                ],
                "correct_answer": 1,
                "topic": "algoritmos_ml",
                "learning_objective": "Seleccionar algoritmos apropiados"
            }
        ]
    }
}

# Endpoints

@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "assessment-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "capabilities": [
            "adaptive_assessments",
            "auto_grading",
            "personalized_feedback",
            "difficulty_adjustment"
        ]
    }

@app.post("/assessments/generate")
async def generate_assessment(
    course_id: str,
    difficulty_level: str = "intermediate",
    num_questions: int = 5,
    assessment_type: str = "quiz",
    lesson_id: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """Generar evaluación adaptativa basada en el perfil del estudiante"""
    try:
        logger.info(f"Generating assessment for course: {course_id}, difficulty: {difficulty_level}")
        
        # Obtener preguntas del pool
        questions_pool = DEFAULT_QUESTIONS_POOL.get(course_id, {}).get(difficulty_level, [])
        
        if not questions_pool:
            logger.warning(f"No questions found for course {course_id} at {difficulty_level} level")
            # Crear preguntas por defecto
            questions_pool = DEFAULT_QUESTIONS_POOL["intro_ai"]["beginner"]
        
        # Seleccionar preguntas aleatoriamente
        selected_questions = random.sample(
            questions_pool, 
            min(num_questions, len(questions_pool))
        )
        
        # Crear objetos de pregunta con IDs únicos
        questions = []
        total_points = 0
        for q in selected_questions:
            question_id = str(uuid.uuid4())
            question = QuestionModel(
                id=question_id,
                question_text=q["question_text"],
                question_type=q["question_type"],
                options=q.get("options"),
                correct_answer=q["correct_answer"],
                difficulty_level=difficulty_level,
                topic=q["topic"],
                learning_objective=q["learning_objective"],
                max_points=10.0
            )
            questions.append(question)
            total_points += question.max_points
        
        # Crear assessment
        assessment_id = str(uuid.uuid4())
        assessment = AssessmentModel(
            id=assessment_id,
            title=f"Evaluación {assessment_type.title()} - {course_id}",
            description=f"Evaluación adaptativa de nivel {difficulty_level}",
            course_id=course_id,
            lesson_id=lesson_id,
            questions=questions,
            total_points=total_points,
            time_limit_minutes=num_questions * 3,  # 3 minutos por pregunta
            difficulty_level=difficulty_level,
            assessment_type=assessment_type,
            created_at=datetime.utcnow(),
            is_adaptive=True
        )
        
        # Guardar en base de datos
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO assessments 
            (id, title, description, course_id, lesson_id, questions_json, 
             total_points, time_limit_minutes, difficulty_level, assessment_type, 
             created_at, is_adaptive)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            assessment.id, assessment.title, assessment.description,
            assessment.course_id, assessment.lesson_id, 
            json.dumps([q.dict() for q in assessment.questions]),
            assessment.total_points, assessment.time_limit_minutes,
            assessment.difficulty_level, assessment.assessment_type,
            assessment.created_at, assessment.is_adaptive
        ))
        
        db.commit()
        
        logger.info(f"Assessment {assessment_id} generated successfully with {len(questions)} questions")
        
        return {
            "assessment_id": assessment_id,
            "assessment": assessment.dict(),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating assessment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating assessment: {str(e)}")

@app.post("/assessments/{assessment_id}/submit")
async def submit_assessment(
    assessment_id: str,
    submission: AssessmentSubmissionModel,
    db: sqlite3.Connection = Depends(get_db)
):
    """Enviar respuestas de evaluación para corrección automática"""
    try:
        logger.info(f"Processing submission for assessment {assessment_id} by student {submission.student_id}")
        
        # Obtener assessment
        cursor = db.cursor()
        cursor.execute("SELECT * FROM assessments WHERE id = ?", (assessment_id,))
        assessment_row = cursor.fetchone()
        
        if not assessment_row:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        assessment_data = dict(assessment_row)
        questions = json.loads(assessment_data['questions_json'])
        
        # Crear diccionario de respuestas correctas
        correct_answers = {}
        for q in questions:
            correct_answers[q['id']] = q['correct_answer']
        
        # Evaluar respuestas
        detailed_results = []
        total_score = 0
        max_possible_score = 0
        
        for answer in submission.answers:
            question = next((q for q in questions if q['id'] == answer.question_id), None)
            if not question:
                continue
                
            max_possible_score += question['max_points']
            
            # Evaluación automática
            is_correct = False
            points_earned = 0
            
            if question['question_type'] == 'multiple_choice':
                is_correct = answer.student_answer == correct_answers[answer.question_id]
                points_earned = question['max_points'] if is_correct else 0
                
            elif question['question_type'] == 'true_false':
                is_correct = answer.student_answer == correct_answers[answer.question_id]
                points_earned = question['max_points'] if is_correct else 0
                
            elif question['question_type'] == 'short_answer':
                # Evaluación básica por palabras clave
                correct_answer = str(correct_answers[answer.question_id]).lower()
                student_answer = str(answer.student_answer).lower()
                
                # Puntuación parcial basada en palabras clave encontradas
                keywords = correct_answer.split()
                found_keywords = sum(1 for keyword in keywords if keyword in student_answer)
                
                if found_keywords > 0:
                    points_earned = (found_keywords / len(keywords)) * question['max_points']
                    is_correct = points_earned >= question['max_points'] * 0.7  # 70% para considerarse correcto
            
            total_score += points_earned
            
            # Actualizar respuesta del estudiante
            answer.is_correct = is_correct
            answer.points_earned = points_earned
            detailed_results.append(answer)
        
        # Calcular porcentaje y determinar si aprobó
        percentage_score = (total_score / max_possible_score) * 100 if max_possible_score > 0 else 0
        passed = percentage_score >= 70  # 70% para aprobar
        
        # Generar feedback y recomendaciones
        feedback = generate_feedback(percentage_score, detailed_results, questions)
        recommendations = generate_recommendations(detailed_results, questions, assessment_data['course_id'])
        
        # Crear resultado
        submission_id = str(uuid.uuid4())
        result = AssessmentResultModel(
            submission_id=submission_id,
            student_id=submission.student_id,
            assessment_id=assessment_id,
            total_score=total_score,
            percentage_score=percentage_score,
            passed=passed,
            detailed_results=detailed_results,
            feedback=feedback,
            recommendations=recommendations,
            completed_at=datetime.utcnow()
        )
        
        # Guardar resultado en base de datos
        cursor.execute("""
            INSERT INTO assessment_results
            (id, student_id, assessment_id, total_score, percentage_score, 
             passed, detailed_results_json, feedback, recommendations_json, 
             completed_at, submission_time_seconds)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            submission_id, result.student_id, result.assessment_id,
            result.total_score, result.percentage_score, result.passed,
            json.dumps([r.dict() for r in result.detailed_results]),
            result.feedback, json.dumps(result.recommendations),
            result.completed_at, submission.total_time_seconds
        ))
        
        db.commit()
        
        logger.info(f"Assessment submitted successfully. Score: {percentage_score:.1f}%, Passed: {passed}")
        
        return {
            "submission_id": submission_id,
            "result": result.dict(),
            "auto_graded": True
        }
        
    except Exception as e:
        logger.error(f"Error processing assessment submission: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing submission: {str(e)}")

@app.get("/assessments/{assessment_id}")
async def get_assessment(
    assessment_id: str,
    include_answers: bool = False,
    db: sqlite3.Connection = Depends(get_db)
):
    """Obtener detalles de una evaluación"""
    try:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM assessments WHERE id = ?", (assessment_id,))
        assessment_row = cursor.fetchone()
        
        if not assessment_row:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        assessment_data = dict(assessment_row)
        questions = json.loads(assessment_data['questions_json'])
        
        # Remover respuestas correctas si no se solicitan explícitamente
        if not include_answers:
            for q in questions:
                q.pop('correct_answer', None)
        
        assessment_data['questions'] = questions
        assessment_data.pop('questions_json', None)
        
        return {
            "assessment": assessment_data,
            "retrieved_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error retrieving assessment: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving assessment: {str(e)}")

def generate_feedback(percentage_score: float, detailed_results: List[StudentAnswerModel], questions: List[dict]) -> str:
    """Generar feedback personalizado basado en el rendimiento"""
    if percentage_score >= 90:
        feedback = "¡Excelente trabajo! Has demostrado un dominio sobresaliente del tema."
    elif percentage_score >= 80:
        feedback = "¡Muy bien! Tu comprensión del tema es sólida."
    elif percentage_score >= 70:
        feedback = "Buen trabajo. Has alcanzado el nivel mínimo requerido."
    elif percentage_score >= 60:
        feedback = "Tu comprensión es parcial. Te recomiendo repasar algunos conceptos."
    else:
        feedback = "Necesitas revisar y practicar más los conceptos fundamentales."
    
    # Agregar detalles específicos
    incorrect_topics = []
    for result in detailed_results:
        if not result.is_correct:
            question = next((q for q in questions if q['id'] == result.question_id), None)
            if question:
                incorrect_topics.append(question['topic'])
    
    if incorrect_topics:
        unique_topics = list(set(incorrect_topics))
        feedback += f" Enfócate especialmente en: {', '.join(unique_topics)}."
    
    return feedback

def generate_recommendations(detailed_results: List[StudentAnswerModel], questions: List[dict], course_id: str) -> List[str]:
    """Generar recomendaciones personalizadas"""
    recommendations = []
    
    # Analizar áreas de debilidad
    weak_topics = {}
    for result in detailed_results:
        if not result.is_correct:
            question = next((q for q in questions if q['id'] == result.question_id), None)
            if question:
                topic = question['topic']
                weak_topics[topic] = weak_topics.get(topic, 0) + 1
    
    # Generar recomendaciones específicas
    for topic, errors in weak_topics.items():
        if errors >= 2:
            recommendations.append(f"Revisar material adicional sobre {topic}")
            recommendations.append(f"Practicar ejercicios específicos de {topic}")
    
    # Recomendaciones generales
    total_correct = sum(1 for r in detailed_results if r.is_correct)
    total_questions = len(detailed_results)
    
    if total_correct / total_questions < 0.7:
        recommendations.append("Revisar los conceptos fundamentales del curso")
        recommendations.append("Solicitar sesión de tutoría personalizada")
    
    if not recommendations:
        recommendations.append("Continuar con el siguiente módulo del curso")
        recommendations.append("Considerar ejercicios de práctica avanzada")
    
    return recommendations

if __name__ == "__main__":
    import uvicorn
    
    # Crear tablas si no existen
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Tabla de evaluaciones
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                course_id TEXT NOT NULL,
                lesson_id TEXT,
                questions_json TEXT NOT NULL,
                total_points REAL NOT NULL,
                time_limit_minutes INTEGER,
                difficulty_level TEXT NOT NULL,
                assessment_type TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                is_adaptive BOOLEAN DEFAULT TRUE
            )
        """)
        
        # Tabla de resultados
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS assessment_results (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                assessment_id TEXT NOT NULL,
                total_score REAL NOT NULL,
                percentage_score REAL NOT NULL,
                passed BOOLEAN NOT NULL,
                detailed_results_json TEXT NOT NULL,
                feedback TEXT,
                recommendations_json TEXT,
                completed_at TIMESTAMP NOT NULL,
                submission_time_seconds INTEGER,
                FOREIGN KEY (assessment_id) REFERENCES assessments (id)
            )
        """)
        
        conn.commit()
        conn.close()
        
        logger.info("✅ Database tables for Assessment Service created/verified")
    
    logger.info("🚀 Starting Assessment Service on port 5005")
    uvicorn.run(app, host="0.0.0.0", port=5005)