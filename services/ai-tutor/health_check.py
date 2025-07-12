"""
AI Tutor Service - Health Check Simple
EbroValley Digital - MVP Validation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Tutor Service",
    description="AI-powered tutoring and adaptive learning",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "ai-tutor",
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/diagnostic/start")
async def start_diagnostic():
    """Simplified diagnostic endpoint"""
    return {
        "diagnostic_id": "diag_12345",
        "questions": [
            {
                "id": 1,
                "question": "¿Cuál es tu nivel de experiencia en programación?",
                "type": "multiple_choice",
                "options": ["Principiante", "Intermedio", "Avanzado"]
            },
            {
                "id": 2,
                "question": "¿Qué lenguajes de programación conoces?",
                "type": "multiple_select",
                "options": ["Python", "JavaScript", "Java", "C++", "Otros"]
            }
        ],
        "status": "active"
    }

@app.post("/diagnostic/submit")
async def submit_diagnostic(answers: dict):
    """Submit diagnostic answers"""
    return {
        "diagnostic_id": "diag_12345",
        "status": "completed",
        "analysis": {
            "level": "intermedio",
            "strengths": ["Lógica de programación", "Conceptos básicos"],
            "areas_to_improve": ["Algoritmos avanzados", "Estructuras de datos"],
            "recommended_path": "python_intermediate"
        },
        "confidence_score": 0.85
    }

@app.get("/tutor/recommend")
async def get_recommendations():
    """Get AI tutor recommendations"""
    return {
        "recommendations": [
            {
                "type": "exercise",
                "title": "Práctica de Arrays",
                "description": "Ejercicios fundamentales de manipulación de arrays",
                "difficulty": "intermedio",
                "estimated_time": 30
            },
            {
                "type": "concept",
                "title": "Algoritmos de Ordenamiento",
                "description": "Aprende bubble sort, quicksort y mergesort",
                "difficulty": "intermedio",
                "estimated_time": 45
            }
        ],
        "learning_path": "python_data_structures",
        "next_milestone": "Complete Array Fundamentals"
    }

if __name__ == "__main__":
    logger.info("Starting AI Tutor Service on port 8001")
    uvicorn.run("health_check:app", host="0.0.0.0", port=8001, reload=True)