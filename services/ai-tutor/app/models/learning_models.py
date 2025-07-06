"""
Learning Models for AI-Tutor Service
Adaptive Learning Ecosystem - EbroValley Digital
ToñoAdPAOS & Claudio Supreme
"""

from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from enum import Enum
from datetime import datetime

class LearningStyle(str, Enum):
    VISUAL = "visual"
    AUDITORY = "auditory"
    KINESTHETIC = "kinesthetic"
    READING_WRITING = "reading_writing"
    MULTIMODAL = "multimodal"

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class LearningPace(str, Enum):
    SLOW = "slow"
    NORMAL = "normal"
    FAST = "fast"
    SELF_PACED = "self_paced"

class ContentType(str, Enum):
    VIDEO = "video"
    TEXT = "text"
    INTERACTIVE = "interactive"
    QUIZ = "quiz"
    SIMULATION = "simulation"
    AUDIO = "audio"
    INFOGRAPHIC = "infographic"
    PRACTICE = "practice"

class DiagnosticQuestion(BaseModel):
    id: str
    question_text: str
    question_type: str  # multiple_choice, scale, open_ended
    options: List[str] = []
    learning_dimension: str  # style, pace, difficulty, interest
    weight: float = 1.0

class DiagnosticResponse(BaseModel):
    question_id: str
    response: Any
    confidence_level: float = 1.0
    time_taken_seconds: int

class InitialDiagnostic(BaseModel):
    student_id: str
    responses: List[DiagnosticResponse]
    completed_at: datetime
    estimated_duration_minutes: int

class StudentLearningProfile(BaseModel):
    student_id: str
    learning_style: LearningStyle
    learning_style_confidence: float
    preferred_pace: LearningPace
    current_difficulty_level: DifficultyLevel
    interests: List[str]
    strengths: List[str]
    weaknesses: List[str]
    attention_span_minutes: int
    preferred_session_length: int
    optimal_study_times: List[str]  # morning, afternoon, evening
    motivation_factors: List[str]
    created_at: datetime
    updated_at: datetime

class LearningPathNode(BaseModel):
    id: str
    title: str
    description: str
    content_type: ContentType
    difficulty_level: DifficultyLevel
    estimated_duration_minutes: int
    prerequisites: List[str] = []
    learning_objectives: List[str]
    content_url: Optional[str] = None
    is_adaptive: bool = True

class AdaptiveLearningPath(BaseModel):
    student_id: str
    course_id: str
    path_id: str
    nodes: List[LearningPathNode]
    current_node_index: int = 0
    completion_percentage: float = 0.0
    created_at: datetime
    last_updated: datetime
    adaptation_reasons: List[str] = []

class LearningActivity(BaseModel):
    activity_id: str
    student_id: str
    node_id: str
    activity_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    time_spent_seconds: int = 0
    completion_percentage: float = 0.0
    interactions: int = 0
    correct_answers: int = 0
    total_attempts: int = 0
    difficulty_adjustments: int = 0
    help_requests: int = 0
    engagement_score: float = 0.0

class RealTimeFeedback(BaseModel):
    student_id: str
    activity_id: str
    feedback_type: str  # encouragement, correction, hint, celebration
    message: str
    suggested_actions: List[str] = []
    confidence_level: float
    generated_at: datetime
    is_personalized: bool = True

class RiskAssessment(BaseModel):
    student_id: str
    risk_level: str  # low, medium, high, critical
    risk_factors: List[str]
    prediction_confidence: float
    recommended_interventions: List[str]
    assessment_date: datetime
    next_assessment_date: datetime

class AdaptationDecision(BaseModel):
    student_id: str
    decision_type: str  # pace_adjustment, difficulty_change, content_switch
    old_value: Any
    new_value: Any
    reason: str
    confidence_score: float
    made_at: datetime
    effectiveness_score: Optional[float] = None