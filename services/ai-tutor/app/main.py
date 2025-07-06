from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import logging
import os
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI-Tutor Service",
    description="Intelligent tutoring system for adaptive learning - EbroValley Digital",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de datos
class StudentProfile(BaseModel):
    student_id: str
    learning_style: str = "visual"  # visual, auditory, kinesthetic, reading
    current_level: str = "beginner"  # beginner, intermediate, advanced
    interests: List[str] = []
    learning_pace: str = "normal"  # slow, normal, fast
    preferred_difficulty: str = "adaptive"

class LearningRecommendation(BaseModel):
    content_id: str
    content_type: str  # video, text, interactive, quiz, assignment
    title: str
    description: str
    estimated_duration_minutes: int
    difficulty_level: str
    priority: str  # low, medium, high, urgent
    reason: str
    confidence_score: float

class ProgressData(BaseModel):
    student_id: str
    course_id: str
    lesson_id: str
    time_spent_seconds: int
    completion_percentage: float
    quiz_scores: List[float] = []
    timestamp: datetime

class AdaptivePathRequest(BaseModel):
    student_id: str
    course_id: str
    current_lesson_id: Optional[str] = None
    performance_data: Dict[str, Any] = {}

# Simulador básico de motor de recomendaciones IA
class AITutorEngine:
    def __init__(self):
        self.student_profiles = {}
        self.learning_patterns = {}
        
    async def analyze_student_profile(self, student_id: str) -> StudentProfile:
        """Analiza y retorna el perfil de aprendizaje del estudiante"""
        # En producción, esto consultaría la base de datos y modelos ML
        if student_id not in self.student_profiles:
            # Perfil por defecto para nuevos estudiantes
            self.student_profiles[student_id] = StudentProfile(
                student_id=student_id,
                learning_style="visual",
                current_level="beginner",
                interests=["technology", "programming"],
                learning_pace="normal"
            )
        
        return self.student_profiles[student_id]
    
    async def generate_recommendations(self, student_id: str, course_id: str) -> List[LearningRecommendation]:
        """Genera recomendaciones personalizadas usando IA"""
        profile = await self.analyze_student_profile(student_id)
        
        # Lógica simulada de recomendaciones basada en IA
        recommendations = []
        
        if profile.learning_style == "visual":
            recommendations.append(LearningRecommendation(
                content_id="video_001",
                content_type="video",
                title="Introduction to Adaptive Learning (Visual)",
                description="Visual explanation with diagrams and animations",
                estimated_duration_minutes=15,
                difficulty_level=profile.current_level,
                priority="high",
                reason="Matches your visual learning preference",
                confidence_score=0.92
            ))
        
        if profile.current_level == "beginner":
            recommendations.append(LearningRecommendation(
                content_id="interactive_001",
                content_type="interactive",
                title="Hands-on Basic Concepts",
                description="Interactive exercises for foundational understanding",
                estimated_duration_minutes=20,
                difficulty_level="beginner",
                priority="medium",
                reason="Perfect for building foundational knowledge",
                confidence_score=0.87
            ))
        
        # Recomendación de quiz adaptativo
        recommendations.append(LearningRecommendation(
            content_id="quiz_adaptive_001",
            content_type="quiz",
            title="Adaptive Knowledge Check",
            description="Quiz that adjusts difficulty based on your responses",
            estimated_duration_minutes=10,
            difficulty_level="adaptive",
            priority="medium",
            reason="Helps assess your current understanding",
            confidence_score=0.78
        ))
        
        return recommendations
    
    async def calculate_adaptive_path(self, request: AdaptivePathRequest) -> Dict[str, Any]:
        """Calcula la ruta de aprendizaje adaptativa"""
        profile = await self.analyze_student_profile(request.student_id)
        
        # Lógica de adaptación basada en performance
        next_lessons = []
        adjustments = {}
        
        # Analizar performance si está disponible
        if request.performance_data:
            avg_score = request.performance_data.get("average_score", 75)
            time_ratio = request.performance_data.get("time_ratio", 1.0)  # actual_time / expected_time
            
            if avg_score >= 90:
                adjustments["difficulty"] = "increase"
                adjustments["pace"] = "accelerate"
            elif avg_score < 60:
                adjustments["difficulty"] = "decrease"
                adjustments["pace"] = "slow_down"
                # Recomendar contenido de refuerzo
                next_lessons.append({
                    "lesson_id": "reinforcement_001",
                    "type": "review",
                    "reason": "Score below 60%, reviewing fundamentals"
                })
        
        return {
            "student_id": request.student_id,
            "course_id": request.course_id,
            "next_lessons": next_lessons,
            "adjustments": adjustments,
            "confidence": 0.85,
            "reasoning": "Path adapted based on learning style and performance data"
        }

# Instancia global del motor IA
ai_engine = AITutorEngine()

# Endpoints principales
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-tutor",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "ai_engine_status": "operational"
    }

@app.get("/api/student/{student_id}/profile")
async def get_student_profile(student_id: str):
    """Obtiene el perfil de aprendizaje del estudiante"""
    try:
        profile = await ai_engine.analyze_student_profile(student_id)
        return profile
    except Exception as e:
        logger.error(f"Error getting student profile: {e}")
        raise HTTPException(status_code=500, detail="Error analyzing student profile")

@app.get("/api/recommendations/{student_id}/{course_id}")
async def get_recommendations(student_id: str, course_id: str):
    """Genera recomendaciones personalizadas para el estudiante"""
    try:
        recommendations = await ai_engine.generate_recommendations(student_id, course_id)
        return {
            "student_id": student_id,
            "course_id": course_id,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat(),
            "total_recommendations": len(recommendations)
        }
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail="Error generating recommendations")

@app.post("/api/adaptive-path")
async def calculate_adaptive_path(request: AdaptivePathRequest):
    """Calcula la ruta de aprendizaje adaptativa"""
    try:
        path = await ai_engine.calculate_adaptive_path(request)
        return path
    except Exception as e:
        logger.error(f"Error calculating adaptive path: {e}")
        raise HTTPException(status_code=500, detail="Error calculating adaptive path")

@app.post("/api/progress/analyze")
async def analyze_progress(progress: ProgressData):
    """Analiza el progreso del estudiante y actualiza recomendaciones"""
    try:
        # En producción, esto almacenaría en base de datos y actualizaría modelos ML
        analysis = {
            "student_id": progress.student_id,
            "analysis": {
                "engagement_level": "high" if progress.time_spent_seconds > 600 else "medium",
                "completion_efficiency": progress.completion_percentage / (progress.time_spent_seconds / 60),
                "performance_trend": "improving" if progress.completion_percentage > 80 else "needs_attention"
            },
            "next_actions": [
                "Continue with current pace" if progress.completion_percentage > 80 
                else "Consider additional practice materials",
                "Schedule review session" if len(progress.quiz_scores) > 0 and sum(progress.quiz_scores) / len(progress.quiz_scores) < 70
                else "Ready for next topic"
            ],
            "processed_at": datetime.now().isoformat()
        }
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing progress: {e}")
        raise HTTPException(status_code=500, detail="Error analyzing progress")

@app.get("/api/stats/global")
async def get_global_stats():
    """Obtiene estadísticas globales del sistema de tutoría IA"""
    return {
        "total_active_students": len(ai_engine.student_profiles),
        "recommendations_generated_today": 247,  # Simulado
        "average_engagement_score": 8.4,
        "ai_model_accuracy": 0.89,
        "system_uptime": "99.8%",
        "last_model_update": "2025-07-06T10:30:00Z"
    }

# Endpoint de test para validar conexión
@app.get("/api/test/connection")
async def test_connection():
    """Endpoint simple para testing de conectividad"""
    return {
        "message": "AI-Tutor Service is connected and operational",
        "timestamp": datetime.now().isoformat(),
        "service_info": {
            "name": "AI-Tutor Service",
            "company": "EbroValley Digital",
            "developers": "ToñoAdPAOS & Claudio Supreme"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5001))
    logger.info(f"🤖 Starting AI-Tutor Service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)