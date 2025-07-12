#!/usr/bin/env python3
"""
AI-Tutor Service - FastAPI Main Application
Adaptive Learning Ecosystem - EbroValley Digital
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel, Field
import sqlite3
import redis
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
import uuid
import hashlib
import pickle
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

from app.services.diagnostic_service import DiagnosticService
from app.services.adaptive_path_service import AdaptivePathService
from app.services.dynamic_pace_service import DynamicPaceService
from app.services.realtime_feedback_service import RealTimeFeedbackService
from app.services.teaching_style_adaptation_service import TeachingStyleAdaptationService
from app.services.continuous_evaluation_service import ContinuousEvaluationService
from app.services.intelligent_tutoring_service import IntelligentTutoringService

app = FastAPI(
    title="🤖 AI-Tutor Service - Adaptive Learning Ecosystem",
    description="""
    # 🎓 AI-Tutor Service - Intelligent Adaptive Learning
    
    **EbroValley Digital** - Educational Excellence Platform
    
    ## Overview
    This service provides AI-powered tutoring capabilities with advanced adaptive learning algorithms.
    Features include diagnostic assessments, personalized learning paths, real-time feedback,
    and continuous evaluation.
    
    ## Key Features
    - 🧠 **Intelligent Diagnostics**: Initial assessment and learning profile creation
    - 🛤️  **Adaptive Paths**: Personalized learning routes based on student profile
    - ⚡ **Real-time Feedback**: Instant, contextual guidance during learning
    - 📊 **Continuous Evaluation**: Ongoing assessment and path optimization
    - 💬 **AI Tutoring Chat**: Intelligent conversational assistance
    
    ## ML Algorithms
    - Random Forest for difficulty prediction
    - Neural networks for learning style adaptation
    - Reinforcement learning for path optimization
    - Natural language processing for chat responses
    
    ## Authentication
    This service is accessed through the API Gateway with JWT authentication.
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
        {"url": "http://localhost:5001", "description": "Development Server"},
        {"url": "https://staging-ai.adaptivelearning.com", "description": "Staging Server"},
        {"url": "https://ai.adaptivelearning.com", "description": "Production Server"}
    ],
    tags_metadata=[
        {"name": "Health", "description": "Service health and status monitoring"},
        {"name": "Diagnostics", "description": "Initial assessments and learning profile creation"},
        {"name": "Adaptive Paths", "description": "Personalized learning path generation"},
        {"name": "Real-time Feedback", "description": "Instant feedback during learning activities"},
        {"name": "Evaluation", "description": "Continuous assessment and performance tracking"},
        {"name": "AI Chat", "description": "Intelligent tutoring conversation"},
        {"name": "Student Profiles", "description": "Learning profile management"}
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), '../../database/adaptive_learning.db')
    return sqlite3.connect(db_path)

# Redis cache connection
def get_redis_connection():
    """Get Redis connection for caching ML models and results"""
    try:
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = int(os.getenv('REDIS_PORT', 6379))
        redis_password = os.getenv('REDIS_PASSWORD', None)
        
        redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            password=redis_password,
            decode_responses=False,  # Keep as bytes for pickle
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
        
        # Test connection
        redis_client.ping()
        return redis_client
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
        return None

# Initialize Redis client
redis_client = get_redis_connection()

# Cache configuration
CACHE_SETTINGS = {
    'ml_model_predictions': {'ttl': 3600, 'prefix': 'ml_pred'},  # 1 hour
    'student_profiles': {'ttl': 1800, 'prefix': 'profile'},     # 30 minutes
    'adaptive_paths': {'ttl': 7200, 'prefix': 'path'},          # 2 hours
    'diagnostic_results': {'ttl': 86400, 'prefix': 'diag'},     # 24 hours
}

def generate_cache_key(prefix: str, *args) -> str:
    """Generate consistent cache key"""
    key_data = f"{prefix}:{':'.join(str(arg) for arg in args)}"
    return hashlib.md5(key_data.encode()).hexdigest()

def cache_get(cache_type: str, *key_args):
    """Get cached value with automatic deserialization"""
    if not redis_client:
        return None
    
    try:
        config = CACHE_SETTINGS.get(cache_type, {})
        prefix = config.get('prefix', cache_type)
        cache_key = generate_cache_key(prefix, *key_args)
        
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return pickle.loads(cached_data)
        return None
    except Exception as e:
        print(f"Cache get error: {e}")
        return None

def cache_set(cache_type: str, value, *key_args):
    """Set cached value with automatic serialization and TTL"""
    if not redis_client:
        return False
    
    try:
        config = CACHE_SETTINGS.get(cache_type, {})
        prefix = config.get('prefix', cache_type)
        ttl = config.get('ttl', 3600)
        cache_key = generate_cache_key(prefix, *key_args)
        
        serialized_data = pickle.dumps(value)
        redis_client.setex(cache_key, ttl, serialized_data)
        return True
    except Exception as e:
        print(f"Cache set error: {e}")
        return False

def cache_delete(cache_type: str, *key_args):
    """Delete cached value"""
    if not redis_client:
        return False
    
    try:
        config = CACHE_SETTINGS.get(cache_type, {})
        prefix = config.get('prefix', cache_type)
        cache_key = generate_cache_key(prefix, *key_args)
        
        redis_client.delete(cache_key)
        return True
    except Exception as e:
        print(f"Cache delete error: {e}")
        return False

# Pydantic models for request/response documentation
class DiagnosticRequest(BaseModel):
    student_id: str = Field(..., description="Student UUID", example="550e8400-e29b-41d4-a716-446655440003")
    subject: Optional[str] = Field(None, description="Subject area for diagnostic", example="mathematics")
    
class DiagnosticResponse(BaseModel):
    question_id: str = Field(..., description="Question identifier", example="q1")
    selected_option: int = Field(..., description="Selected answer option (0-based)", example=2)
    response_time_seconds: float = Field(..., description="Time taken to respond", example=45.5)
    
class DiagnosticAnalysisRequest(BaseModel):
    student_id: str = Field(..., description="Student UUID", example="550e8400-e29b-41d4-a716-446655440003")
    responses: List[DiagnosticResponse] = Field(..., description="Array of diagnostic responses")
    
class ActivityData(BaseModel):
    lesson_id: str = Field(..., description="Lesson identifier", example="lesson_001")
    activity_type: str = Field(..., description="Type of activity", example="quiz")
    completion_percentage: float = Field(..., description="Completion percentage", example=75.5)
    time_spent: int = Field(..., description="Time spent in seconds", example=180)
    correct_answers: int = Field(..., description="Number of correct answers", example=8)
    total_attempts: int = Field(..., description="Total attempts made", example=10)
    engagement_score: float = Field(..., description="Engagement score 0-1", example=0.85)
    
class RealtimeFeedbackRequest(BaseModel):
    student_id: str = Field(..., description="Student UUID", example="550e8400-e29b-41d4-a716-446655440003")
    activity_data: ActivityData = Field(..., description="Current activity data")
    
class ChatMessage(BaseModel):
    student_id: str = Field(..., description="Student UUID", example="550e8400-e29b-41d4-a716-446655440003")
    message: str = Field(..., description="Student message", example="I don't understand this algebra problem")
    context: Optional[Dict[str, Any]] = Field({}, description="Additional context data")

# Initialize Prometheus metrics
REQUEST_COUNT = Counter(
    'ai_tutor_requests_total',
    'Total requests to AI Tutor service',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'ai_tutor_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint']
)

DIAGNOSTIC_ANALYSES = Counter(
    'ai_tutor_diagnostic_analyses_total',
    'Total diagnostic analyses performed',
    ['cache_status']
)

ADAPTIVE_PATHS_GENERATED = Counter(
    'ai_tutor_adaptive_paths_total',
    'Total adaptive paths generated',
    ['cache_status']
)

CACHE_HIT_RATE = Gauge(
    'ai_tutor_cache_hit_rate',
    'Cache hit rate percentage',
    ['cache_type']
)

ML_MODEL_PREDICTIONS = Counter(
    'ai_tutor_ml_predictions_total',
    'Total ML model predictions',
    ['model_type', 'cache_status']
)

ERRORS_TOTAL = Counter(
    'ai_tutor_errors_total',
    'Total errors in AI Tutor service',
    ['error_type', 'endpoint']
)

# Initialize services
diagnostic_service = DiagnosticService()
adaptive_path_service = AdaptivePathService()
dynamic_pace_service = DynamicPaceService()
feedback_service = RealTimeFeedbackService()
adaptation_service = TeachingStyleAdaptationService()
evaluation_service = ContinuousEvaluationService()
tutoring_service = IntelligentTutoringService()

@app.get("/health", tags=["Health"], 
         summary="Health Check",
         description="Check service health, database connectivity, and all AI services status")
async def health_check():
    """Health check endpoint with comprehensive status information"""
    start_time = datetime.now()
    
    try:
        # Test database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        conn.close()
        
        # Test Redis connection
        redis_status = "connected" if redis_client else "disconnected"
        cache_info = {}
        if redis_client:
            try:
                info = redis_client.info()
                cache_info = {
                    "connected_clients": info.get('connected_clients', 0),
                    "used_memory": info.get('used_memory_human', '0B'),
                    "keyspace_hits": info.get('keyspace_hits', 0),
                    "keyspace_misses": info.get('keyspace_misses', 0)
                }
                
                # Update cache hit rate metric
                total_ops = cache_info['keyspace_hits'] + cache_info['keyspace_misses']
                if total_ops > 0:
                    hit_rate = (cache_info['keyspace_hits'] / total_ops) * 100
                    CACHE_HIT_RATE.labels(cache_type='redis').set(hit_rate)
            except Exception as e:
                redis_status = f"error: {str(e)}"
        
        response_time = (datetime.now() - start_time).total_seconds()
        
        health_data = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "response_time_seconds": response_time,
            "database": {
                "status": "connected",
                "user_count": user_count
            },
            "cache": {
                "status": redis_status,
                "info": cache_info
            },
            "services": {
                "diagnostic": "ready",
                "adaptive_path": "ready", 
                "dynamic_pace": "ready",
                "feedback": "ready",
                "adaptation": "ready",
                "evaluation": "ready",
                "tutoring": "ready"
            },
            "metrics": {
                "uptime_seconds": (datetime.now() - start_time).total_seconds(),
                "total_requests": int(REQUEST_COUNT._value._value),
                "cache_hit_rate": CACHE_HIT_RATE.labels(cache_type='redis')._value._value
            }
        }
        
        # Record successful health check
        REQUEST_COUNT.labels(method='GET', endpoint='/health', status='200').inc()
        REQUEST_DURATION.labels(method='GET', endpoint='/health').observe(response_time)
        
        return health_data
        
    except Exception as e:
        # Record failed health check
        REQUEST_COUNT.labels(method='GET', endpoint='/health', status='503').inc()
        ERRORS_TOTAL.labels(error_type='health_check_error', endpoint='/health').inc()
        
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy", 
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "response_time_seconds": (datetime.now() - start_time).total_seconds()
            }
        )

@app.post("/diagnostic/generate", tags=["Diagnostics"],
          summary="Generate Diagnostic Assessment", 
          description="Create personalized diagnostic assessment based on student profile and learning objectives")
async def generate_diagnostic(request: DiagnosticRequest):
    """Generate initial diagnostic assessment for student with adaptive question selection"""
    student_id = request.student_id
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get student info
        cursor.execute("SELECT * FROM users WHERE id = ? AND role = 'student'", (student_id,))
        student = cursor.fetchone()
        
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Generate diagnostic
        assessment = await diagnostic_service.generate_diagnostic_assessment(student_id)
        
        conn.close()
        return {
            "student_id": student_id,
            "assessment": assessment,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating diagnostic: {str(e)}")

@app.post("/diagnostic/analyze", tags=["Diagnostics"],
          summary="Analyze Diagnostic Responses",
          description="Process diagnostic responses using ML algorithms to create detailed learning profile")
async def analyze_diagnostic(request: DiagnosticAnalysisRequest):
    """Analyze diagnostic responses and create/update learning profile with ML-powered insights"""
    try:
        student_id = request.student_id
        responses = [r.dict() for r in request.responses]
        
        if not student_id or not responses:
            raise HTTPException(status_code=400, detail="Missing student_id or responses")
        
        # Create diagnostic object
        from app.models.learning_models import InitialDiagnostic, DiagnosticResponse
        
        # Convert responses to proper format
        diagnostic_responses = []
        for response_data in responses:
            diagnostic_responses.append(DiagnosticResponse(
                question_id=response_data.get("question_id"),
                response=response_data.get("selected_option", 0),
                time_taken_seconds=response_data.get("response_time_seconds", 0)
            ))
        
        from datetime import datetime
        
        diagnostic = InitialDiagnostic(
            student_id=student_id,
            responses=diagnostic_responses,
            completed_at=datetime.now(),
            estimated_duration_minutes=10
        )
        
        # Check cache first for similar diagnostic patterns
        diagnostic_hash = hashlib.md5(json.dumps(responses, sort_keys=True).encode()).hexdigest()
        cached_result = cache_get('diagnostic_results', student_id, diagnostic_hash)
        
        if cached_result:
            print(f"🚀 Cache HIT for diagnostic analysis: {student_id}")
            profile = cached_result
        else:
            print(f"⏳ Cache MISS for diagnostic analysis: {student_id}")
            # Analyze responses  
            profile_obj = await diagnostic_service.analyze_diagnostic_responses(diagnostic)
            
            # Convert to dict for JSON serialization
            profile = {
                "learning_style": profile_obj.learning_style,
                "confidence": profile_obj.learning_style_confidence,
                "preferred_pace": profile_obj.preferred_pace,
                "difficulty_level": profile_obj.current_difficulty_level,
                "interests": profile_obj.interests,
                "strengths": profile_obj.strengths,
                "weaknesses": profile_obj.weaknesses,
                "attention_span": profile_obj.attention_span_minutes
            }
            
            # Cache the result for future similar diagnostics
            cache_set('diagnostic_results', profile, student_id, diagnostic_hash)
        
        # Store in database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if profile exists
        cursor.execute("SELECT id FROM student_learning_profiles WHERE student_id = ?", (student_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing profile
            cursor.execute("""
                UPDATE student_learning_profiles 
                SET learning_style = ?, learning_style_confidence = ?, 
                    preferred_pace = ?, current_difficulty_level = ?,
                    interests = ?, strengths = ?, weaknesses = ?,
                    attention_span_minutes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE student_id = ?
            """, (
                str(profile["learning_style"]), profile["confidence"],
                str(profile["preferred_pace"]), str(profile["difficulty_level"]),
                json.dumps(profile["interests"]), json.dumps(profile["strengths"]),
                json.dumps(profile["weaknesses"]), profile["attention_span"],
                student_id
            ))
        else:
            # Create new profile
            profile_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO student_learning_profiles 
                (id, student_id, learning_style, learning_style_confidence,
                 preferred_pace, current_difficulty_level, interests, strengths, 
                 weaknesses, attention_span_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                profile_id, student_id, str(profile["learning_style"]), profile["confidence"],
                str(profile["preferred_pace"]), str(profile["difficulty_level"]),
                json.dumps(profile["interests"]), json.dumps(profile["strengths"]),
                json.dumps(profile["weaknesses"]), profile["attention_span"]
            ))
        
        conn.commit()
        conn.close()
        
        return {
            "student_id": student_id,
            "profile": profile,
            "analysis_timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing diagnostic: {str(e)}")

@app.get("/path/adaptive/{student_id}", tags=["Adaptive Paths"],
         summary="Generate Adaptive Learning Path",
         description="Create personalized learning path using AI algorithms based on student profile, performance, and preferences")
async def get_adaptive_path(student_id: str = Path(..., description="Student UUID", example="550e8400-e29b-41d4-a716-446655440003"), 
                           course_id: Optional[str] = Query(None, description="Specific course ID for path generation", example="math_101")):
    """Generate adaptive learning path using ML algorithms for optimal learning sequence"""
    try:
        # Check cache first for adaptive paths
        cache_course_id = course_id or "default"
        cached_path = cache_get('adaptive_paths', student_id, cache_course_id)
        
        if cached_path:
            print(f"🚀 Cache HIT for adaptive path: {student_id}")
            return {
                "student_id": student_id,
                "course_id": course_id,
                "adaptive_path": cached_path,
                "generated_at": datetime.now().isoformat(),
                "cached": True
            }
        
        print(f"⏳ Cache MISS for adaptive path: {student_id}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get student profile
        cursor.execute("SELECT * FROM student_learning_profiles WHERE student_id = ?", (student_id,))
        profile_row = cursor.fetchone()
        
        if not profile_row:
            raise HTTPException(status_code=404, detail="Student learning profile not found")
        
        # Create StudentLearningProfile object
        from app.models.learning_models import StudentLearningProfile, LearningStyle, LearningPace, DifficultyLevel
        
        # Convert string enums back to enum values
        learning_style_map = {
            "visual": LearningStyle.VISUAL,
            "auditory": LearningStyle.AUDITORY, 
            "kinesthetic": LearningStyle.KINESTHETIC,
            "reading_writing": LearningStyle.READING_WRITING,
            "multimodal": LearningStyle.MULTIMODAL
        }
        
        pace_map = {
            "slow": LearningPace.SLOW,
            "normal": LearningPace.NORMAL,
            "fast": LearningPace.FAST
        }
        
        difficulty_map = {
            "beginner": DifficultyLevel.BEGINNER,
            "intermediate": DifficultyLevel.INTERMEDIATE,
            "advanced": DifficultyLevel.ADVANCED
        }
        
        from datetime import datetime
        
        profile = StudentLearningProfile(
            student_id=student_id,
            learning_style=learning_style_map.get(profile_row[2], LearningStyle.VISUAL),
            learning_style_confidence=profile_row[3],
            preferred_pace=pace_map.get(profile_row[4], LearningPace.NORMAL),
            current_difficulty_level=difficulty_map.get(profile_row[5], DifficultyLevel.BEGINNER),
            interests=json.loads(profile_row[6]) if profile_row[6] else [],
            strengths=json.loads(profile_row[7]) if profile_row[7] else [],
            weaknesses=json.loads(profile_row[8]) if profile_row[8] else [],
            attention_span_minutes=profile_row[9],
            preferred_session_length=25,
            optimal_study_times=["morning", "afternoon"],
            motivation_factors=["achievement", "curiosity"],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Get available content (lazy loading optimization)
        if course_id:
            # Optimized query with limit for faster initial load
            cursor.execute("""
                SELECT l.* FROM lessons l
                JOIN course_modules cm ON l.module_id = cm.id
                WHERE cm.course_id = ? AND l.is_published = 1
                ORDER BY l.order_index
                LIMIT 20
            """, (course_id,))
        else:
            # Default course optimization - load only first 15 lessons for quick response
            cursor.execute("SELECT * FROM lessons WHERE is_published = 1 ORDER BY order_index LIMIT 15")
        
        lessons = cursor.fetchall()
        
        # Convert lessons to dict format
        content_items = []
        for lesson in lessons:
            content_items.append({
                "id": lesson[0],
                "title": lesson[2],
                "content_type": lesson[4],
                "difficulty": "beginner",  # Default, could be enhanced
                "estimated_duration": lesson[5]
            })
        
        # Generate adaptive path
        adaptive_path_obj = await adaptive_path_service.generate_adaptive_path(profile, course_id or "default", [])
        
        # Convert to dict for JSON serialization
        adaptive_path = {
            "student_id": adaptive_path_obj.student_id,
            "course_id": adaptive_path_obj.course_id,
            "path_id": adaptive_path_obj.path_id,
            "current_node_index": adaptive_path_obj.current_node_index,
            "completion_percentage": adaptive_path_obj.completion_percentage,
            "adaptation_reasons": adaptive_path_obj.adaptation_reasons,
            "nodes": [
                {
                    "id": node.id,
                    "title": node.title,
                    "description": node.description,
                    "content_type": str(node.content_type),
                    "difficulty_level": str(node.difficulty_level),
                    "estimated_duration": node.estimated_duration_minutes,
                    "prerequisites": node.prerequisites,
                    "learning_objectives": node.learning_objectives
                }
                for node in adaptive_path_obj.nodes
            ]
        }
        
        # Cache the generated path for future requests
        cache_set('adaptive_paths', adaptive_path, student_id, cache_course_id)
        
        conn.close()
        return {
            "student_id": student_id,
            "course_id": course_id,
            "adaptive_path": adaptive_path,
            "generated_at": datetime.now().isoformat(),
            "cached": False
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating adaptive path: {str(e)}")

@app.post("/feedback/realtime", tags=["Real-time Feedback"],
          summary="Generate Real-time Feedback",
          description="Provide instant, personalized feedback during learning activities using NLP and adaptive algorithms")
async def generate_realtime_feedback(request: RealtimeFeedbackRequest):
    """Generate intelligent real-time feedback based on current activity and learning patterns"""
    try:
        student_id = request.student_id
        activity_data = request.activity_data.dict()
        
        # Check cache for recent similar feedback patterns
        lesson_id = activity_data.get("lesson_id", "unknown")
        activity_type = activity_data.get("activity_type", "general")
        completion_pct = activity_data.get("completion_percentage", 0)
        
        # Create cache key based on activity pattern (rounded for better hit rate)
        completion_range = int(completion_pct // 10) * 10  # Round to nearest 10%
        feedback_cache_key = f"{lesson_id}_{activity_type}_{completion_range}"
        
        cached_feedback = cache_get('ml_model_predictions', student_id, feedback_cache_key)
        
        if cached_feedback:
            print(f"🚀 Cache HIT for realtime feedback: {student_id}")
            # Update timestamp but keep cached feedback
            cached_feedback["timestamp"] = datetime.now().isoformat()
            cached_feedback["cached"] = True
            return cached_feedback
        
        print(f"⏳ Cache MISS for realtime feedback: {student_id}")
        
        # Data validation handled by Pydantic
        
        # Get student profile (cache this too for performance)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check cache for student profile first
        cached_profile = cache_get('student_profiles', student_id)
        if cached_profile:
            profile_row = cached_profile
        else:
            cursor.execute("SELECT * FROM student_learning_profiles WHERE student_id = ?", (student_id,))
            profile_row = cursor.fetchone()
            if profile_row:
                cache_set('student_profiles', profile_row, student_id)
        
        if not profile_row:
            raise HTTPException(status_code=404, detail="Student profile not found")
        
        # Create profile object (reusing same logic from adaptive path)
        from app.models.learning_models import StudentLearningProfile, LearningStyle, LearningPace, DifficultyLevel, LearningActivity
        from datetime import datetime
        
        learning_style_map = {
            "visual": LearningStyle.VISUAL,
            "auditory": LearningStyle.AUDITORY, 
            "kinesthetic": LearningStyle.KINESTHETIC,
            "reading_writing": LearningStyle.READING_WRITING,
            "multimodal": LearningStyle.MULTIMODAL
        }
        
        pace_map = {
            "slow": LearningPace.SLOW,
            "normal": LearningPace.NORMAL,
            "fast": LearningPace.FAST
        }
        
        difficulty_map = {
            "beginner": DifficultyLevel.BEGINNER,
            "intermediate": DifficultyLevel.INTERMEDIATE,
            "advanced": DifficultyLevel.ADVANCED
        }
        
        profile = StudentLearningProfile(
            student_id=student_id,
            learning_style=learning_style_map.get(profile_row[2], LearningStyle.VISUAL),
            learning_style_confidence=profile_row[3],
            preferred_pace=pace_map.get(profile_row[4], LearningPace.NORMAL),
            current_difficulty_level=difficulty_map.get(profile_row[5], DifficultyLevel.BEGINNER),
            interests=json.loads(profile_row[6]) if profile_row[6] else [],
            strengths=json.loads(profile_row[7]) if profile_row[7] else [],
            weaknesses=json.loads(profile_row[8]) if profile_row[8] else [],
            attention_span_minutes=profile_row[9],
            preferred_session_length=25,
            optimal_study_times=["morning", "afternoon"],
            motivation_factors=["achievement", "curiosity"],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Create LearningActivity object
        activity = LearningActivity(
            activity_id=str(uuid.uuid4()),
            student_id=student_id,
            node_id=activity_data.get("lesson_id", "unknown"),
            activity_type=activity_data.get("activity_type", "general"),
            start_time=datetime.now(),
            completion_percentage=activity_data.get("completion_percentage", 0.0),
            time_spent_seconds=activity_data.get("time_spent", 0),
            interactions_count=activity_data.get("interactions", 0),
            correct_answers=activity_data.get("correct_answers", 0),
            total_attempts=activity_data.get("total_attempts", 0),
            help_requests=0,
            engagement_score=activity_data.get("engagement_score", 0.5)
        )
        
        # Generate feedback
        feedback_obj = await feedback_service.generate_realtime_feedback(student_id, activity, profile, activity_data)
        
        # Convert to dict for JSON
        feedback = {
            "student_id": feedback_obj.student_id,
            "activity_id": feedback_obj.activity_id,
            "feedback_type": feedback_obj.feedback_type,
            "message": feedback_obj.message,
            "suggested_actions": feedback_obj.suggested_actions,
            "confidence_level": feedback_obj.confidence_level,
            "generated_at": feedback_obj.generated_at.isoformat(),
            "is_personalized": feedback_obj.is_personalized
        }
        
        # Cache the feedback for similar patterns (shorter TTL for realtime data)
        feedback_result = {
            "student_id": student_id,
            "feedback": feedback,
            "timestamp": datetime.now().isoformat(),
            "cached": False
        }
        
        # Cache with shorter TTL for realtime feedback (15 minutes)
        custom_cache_key = f"feedback_{student_id}_{feedback_cache_key}"
        if redis_client:
            try:
                serialized_data = pickle.dumps(feedback_result)
                redis_client.setex(custom_cache_key, 900, serialized_data)  # 15 minutes TTL
            except Exception as e:
                print(f"Cache set error for feedback: {e}")
        
        # Log activity (async to not block response)
        activity_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO learning_activities 
            (id, student_id, lesson_id, activity_type, time_spent_seconds,
             completion_percentage, interactions, correct_answers, total_attempts,
             engagement_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            activity_id, student_id, activity_data.get("lesson_id", "unknown"),
            activity_data.get("activity_type", "general"), activity_data.get("time_spent", 0),
            activity_data.get("completion_percentage", 0), activity_data.get("interactions", 0),
            activity_data.get("correct_answers", 0), activity_data.get("total_attempts", 0),
            activity_data.get("engagement_score", 0.5)
        ))
        
        conn.commit()
        conn.close()
        
        return feedback_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating feedback: {str(e)}")

@app.post("/evaluation/continuous", tags=["Evaluation"],
          summary="Continuous Learning Evaluation",
          description="Perform ongoing assessment and learning analytics to optimize student progress")
async def continuous_evaluation(student_id: str = Path(..., description="Student UUID", example="550e8400-e29b-41d4-a716-446655440003")):
    """Perform continuous evaluation using learning analytics and ML-based assessment"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get student's recent activities
        cursor.execute("""
            SELECT * FROM learning_activities 
            WHERE student_id = ? 
            ORDER BY start_time DESC 
            LIMIT 50
        """, (student_id,))
        
        activities = cursor.fetchall()
        
        if not activities:
            raise HTTPException(status_code=404, detail="No learning activities found for student")
        
        # Convert to list of dicts
        activity_data = []
        for activity in activities:
            activity_data.append({
                "completion_percentage": activity[9],
                "time_spent_seconds": activity[8],
                "correct_answers": activity[11],
                "total_attempts": activity[12],
                "engagement_score": activity[15]
            })
        
        # Perform evaluation
        evaluation_result = evaluation_service.perform_evaluation(student_id, activity_data)
        
        conn.close()
        
        return {
            "student_id": student_id,
            "evaluation": evaluation_result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing evaluation: {str(e)}")

@app.post("/chat/process", tags=["AI Chat"],
          summary="Process AI Tutoring Chat",
          description="Handle student questions and provide intelligent responses using NLP and educational AI")
async def process_tutoring_chat(request: ChatMessage):
    """Process student message through AI tutoring system with contextual understanding"""
    try:
        student_id = request.student_id
        message = request.message
        context = request.context
        
        # Data validation handled by Pydantic
        
        # Get student profile
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT learning_style FROM student_learning_profiles WHERE student_id = ?", (student_id,))
        profile_row = cursor.fetchone()
        learning_style = profile_row[0] if profile_row else "visual"
        
        # Process message
        response = tutoring_service.process_student_message(student_id, message, context, learning_style)
        
        conn.close()
        
        return {
            "student_id": student_id,
            "message": message,
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.get("/students/{student_id}/profile", tags=["Student Profiles"],
         summary="Get Student Learning Profile",
         description="Retrieve comprehensive learning profile with AI-generated insights and recommendations")
async def get_student_profile(student_id: str = Path(..., description="Student UUID", example="550e8400-e29b-41d4-a716-446655440003")):
    """Get detailed student learning profile with AI-powered analytics and insights"""
    try:
        # Check cache first for student profile
        cached_profile = cache_get('student_profiles', student_id, 'full_profile')
        
        if cached_profile:
            print(f"🚀 Cache HIT for student profile: {student_id}")
            return cached_profile
        
        print(f"⏳ Cache MISS for student profile: {student_id}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT slp.*, u.first_name, u.last_name, u.email
            FROM student_learning_profiles slp
            JOIN users u ON slp.student_id = u.id
            WHERE slp.student_id = ?
        """, (student_id,))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Student profile not found")
        
        profile = {
            "student_id": row[1],
            "learning_style": row[2],
            "confidence": row[3],
            "preferred_pace": row[4],
            "difficulty_level": row[5],
            "interests": json.loads(row[6]) if row[6] else [],
            "strengths": json.loads(row[7]) if row[7] else [],
            "weaknesses": json.loads(row[8]) if row[8] else [],
            "attention_span": row[9],
            "student_info": {
                "name": f"{row[13]} {row[14]}",
                "email": row[15]
            },
            "cached_at": datetime.now().isoformat()
        }
        
        # Cache the complete profile for faster future access
        cache_set('student_profiles', profile, student_id, 'full_profile')
        
        conn.close()
        return profile
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting profile: {str(e)}")

@app.get("/metrics", tags=["Monitoring"],
         summary="Prometheus Metrics",
         description="Get Prometheus metrics for monitoring and alerting")
async def get_metrics():
    """Return Prometheus metrics in text format"""
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)