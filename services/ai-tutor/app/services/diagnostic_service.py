"""
Diagnostic Service - Initial Personalized Assessment
Adaptive Learning Ecosystem - EbroValley Digital
ToñoAdPAOS & Claudio Supreme
"""

import asyncio
import logging
from typing import List, Dict, Any
from datetime import datetime
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from ..models.learning_models import (
    DiagnosticQuestion, DiagnosticResponse, InitialDiagnostic,
    StudentLearningProfile, LearningStyle, LearningPace, DifficultyLevel
)

logger = logging.getLogger(__name__)

class DiagnosticService:
    """
    Service for conducting initial diagnostic assessments
    to determine student learning profiles
    """
    
    def __init__(self):
        self.diagnostic_questions = self._load_diagnostic_questions()
        self.scaler = StandardScaler()
        
    def _load_diagnostic_questions(self) -> List[DiagnosticQuestion]:
        """Load predefined diagnostic questions"""
        return [
            # Learning Style Questions
            DiagnosticQuestion(
                id="ls_001",
                question_text="¿Cómo prefieres recibir instrucciones para una nueva tarea?",
                question_type="multiple_choice",
                options=[
                    "Viendo un video o diagrama explicativo",
                    "Escuchando una explicación detallada",
                    "Practicando directamente con ejemplos",
                    "Leyendo instrucciones paso a paso"
                ],
                learning_dimension="style",
                weight=1.5
            ),
            DiagnosticQuestion(
                id="ls_002",
                question_text="Cuando estudias, ¿qué te ayuda más a recordar información?",
                question_type="multiple_choice",
                options=[
                    "Imágenes, colores y esquemas visuales",
                    "Repetir en voz alta o escuchar grabaciones",
                    "Tomar notas a mano y mover objetos",
                    "Escribir resúmenes y listas"
                ],
                learning_dimension="style",
                weight=1.5
            ),
            
            # Learning Pace Questions
            DiagnosticQuestion(
                id="lp_001",
                question_text="¿Cuánto tiempo dedicas habitualmente a estudiar un tema nuevo?",
                question_type="multiple_choice",
                options=[
                    "Menos de 30 minutos - prefiero sesiones cortas",
                    "30-60 minutos - ritmo moderado",
                    "1-2 horas - me gusta profundizar",
                    "Más de 2 horas - estudio intensivo"
                ],
                learning_dimension="pace",
                weight=1.2
            ),
            
            # Difficulty Assessment Questions
            DiagnosticQuestion(
                id="da_001",
                question_text="¿Cómo te sientes ante desafíos académicos difíciles?",
                question_type="multiple_choice",
                options=[
                    "Prefiero empezar con conceptos básicos",
                    "Me gustan los retos moderados",
                    "Disfruto los problemas complejos",
                    "Busco siempre el máximo desafío"
                ],
                learning_dimension="difficulty",
                weight=1.3
            ),
            
            # Interest and Motivation Questions
            DiagnosticQuestion(
                id="im_001",
                question_text="¿Qué tipo de contenido te motiva más a aprender?",
                question_type="multiple_choice",
                options=[
                    "Casos prácticos y aplicaciones reales",
                    "Teoría fundamentada y conceptos profundos",
                    "Proyectos creativos y experimentación",
                    "Competencias y logros medibles"
                ],
                learning_dimension="motivation",
                weight=1.0
            ),
            
            # Attention and Focus Questions
            DiagnosticQuestion(
                id="af_001",
                question_text="¿Cuánto tiempo puedes mantener concentración total en una actividad?",
                question_type="multiple_choice",
                options=[
                    "10-15 minutos",
                    "20-30 minutos", 
                    "45-60 minutos",
                    "Más de 60 minutos"
                ],
                learning_dimension="attention",
                weight=1.1
            )
        ]
    
    async def generate_diagnostic_assessment(self, student_id: str) -> List[DiagnosticQuestion]:
        """Generate personalized diagnostic questions for a student"""
        logger.info(f"Generating diagnostic assessment for student {student_id}")
        
        # For now, return all questions. In production, this could be adaptive
        # based on student's background or preliminary answers
        return self.diagnostic_questions
    
    async def analyze_diagnostic_responses(
        self, 
        diagnostic: InitialDiagnostic
    ) -> StudentLearningProfile:
        """Analyze diagnostic responses to create student learning profile"""
        
        logger.info(f"Analyzing diagnostic for student {diagnostic.student_id}")
        
        # Extract responses by dimension
        responses_by_dimension = self._group_responses_by_dimension(diagnostic.responses)
        
        # Analyze learning style
        learning_style, style_confidence = self._analyze_learning_style(
            responses_by_dimension.get("style", [])
        )
        
        # Analyze learning pace
        preferred_pace = self._analyze_learning_pace(
            responses_by_dimension.get("pace", [])
        )
        
        # Analyze difficulty preference
        difficulty_level = self._analyze_difficulty_level(
            responses_by_dimension.get("difficulty", [])
        )
        
        # Analyze interests and motivation
        interests, motivation_factors = self._analyze_interests_motivation(
            responses_by_dimension.get("motivation", [])
        )
        
        # Analyze attention span
        attention_span = self._analyze_attention_span(
            responses_by_dimension.get("attention", [])
        )
        
        # Determine strengths and weaknesses (simplified for now)
        strengths, weaknesses = self._infer_strengths_weaknesses(
            learning_style, preferred_pace, difficulty_level
        )
        
        profile = StudentLearningProfile(
            student_id=diagnostic.student_id,
            learning_style=learning_style,
            learning_style_confidence=style_confidence,
            preferred_pace=preferred_pace,
            current_difficulty_level=difficulty_level,
            interests=interests,
            strengths=strengths,
            weaknesses=weaknesses,
            attention_span_minutes=attention_span,
            preferred_session_length=self._calculate_session_length(attention_span),
            optimal_study_times=["morning", "afternoon"],  # Default, could be refined
            motivation_factors=motivation_factors,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info(f"Profile created: {learning_style.value} learner, {preferred_pace.value} pace")
        return profile
    
    def _group_responses_by_dimension(self, responses: List[DiagnosticResponse]) -> Dict[str, List[DiagnosticResponse]]:
        """Group responses by learning dimension"""
        grouped = {}
        
        for response in responses:
            # Find the question to get its dimension
            question = next(
                (q for q in self.diagnostic_questions if q.id == response.question_id), 
                None
            )
            if question:
                dimension = question.learning_dimension
                if dimension not in grouped:
                    grouped[dimension] = []
                grouped[dimension].append(response)
        
        return grouped
    
    def _analyze_learning_style(self, style_responses: List[DiagnosticResponse]) -> tuple[LearningStyle, float]:
        """Analyze learning style from responses"""
        if not style_responses:
            return LearningStyle.MULTIMODAL, 0.5
        
        # Count responses indicating each learning style
        style_scores = {
            LearningStyle.VISUAL: 0,
            LearningStyle.AUDITORY: 0,
            LearningStyle.KINESTHETIC: 0,
            LearningStyle.READING_WRITING: 0
        }
        
        for response in style_responses:
            # Map response options to learning styles
            if isinstance(response.response, int):
                option_index = response.response
                if option_index == 0:  # Visual option
                    style_scores[LearningStyle.VISUAL] += response.confidence_level
                elif option_index == 1:  # Auditory option
                    style_scores[LearningStyle.AUDITORY] += response.confidence_level
                elif option_index == 2:  # Kinesthetic option
                    style_scores[LearningStyle.KINESTHETIC] += response.confidence_level
                elif option_index == 3:  # Reading/Writing option
                    style_scores[LearningStyle.READING_WRITING] += response.confidence_level
        
        # Find the dominant style
        dominant_style = max(style_scores, key=style_scores.get)
        max_score = style_scores[dominant_style]
        total_score = sum(style_scores.values())
        
        # Calculate confidence
        confidence = max_score / total_score if total_score > 0 else 0.5
        
        # If scores are too close, classify as multimodal
        if confidence < 0.4:
            return LearningStyle.MULTIMODAL, confidence
        
        return dominant_style, confidence
    
    def _analyze_learning_pace(self, pace_responses: List[DiagnosticResponse]) -> LearningPace:
        """Analyze preferred learning pace"""
        if not pace_responses:
            return LearningPace.NORMAL
        
        # Average the pace preferences
        pace_sum = sum(response.response for response in pace_responses if isinstance(response.response, int))
        pace_avg = pace_sum / len(pace_responses)
        
        if pace_avg <= 0.5:
            return LearningPace.SLOW
        elif pace_avg <= 1.5:
            return LearningPace.NORMAL
        elif pace_avg <= 2.5:
            return LearningPace.FAST
        else:
            return LearningPace.SELF_PACED
    
    def _analyze_difficulty_level(self, difficulty_responses: List[DiagnosticResponse]) -> DifficultyLevel:
        """Analyze preferred difficulty level"""
        if not difficulty_responses:
            return DifficultyLevel.INTERMEDIATE
        
        # Average the difficulty preferences
        diff_sum = sum(response.response for response in difficulty_responses if isinstance(response.response, int))
        diff_avg = diff_sum / len(difficulty_responses)
        
        if diff_avg <= 0.5:
            return DifficultyLevel.BEGINNER
        elif diff_avg <= 1.5:
            return DifficultyLevel.INTERMEDIATE
        elif diff_avg <= 2.5:
            return DifficultyLevel.ADVANCED
        else:
            return DifficultyLevel.EXPERT
    
    def _analyze_interests_motivation(self, motivation_responses: List[DiagnosticResponse]) -> tuple[List[str], List[str]]:
        """Analyze student interests and motivation factors"""
        interests = []
        motivation_factors = []
        
        for response in motivation_responses:
            if isinstance(response.response, int):
                if response.response == 0:
                    interests.append("practical_applications")
                    motivation_factors.append("real_world_relevance")
                elif response.response == 1:
                    interests.append("theoretical_concepts")
                    motivation_factors.append("deep_understanding")
                elif response.response == 2:
                    interests.append("creative_projects")
                    motivation_factors.append("creativity_expression")
                elif response.response == 3:
                    interests.append("competitive_challenges")
                    motivation_factors.append("achievement_recognition")
        
        # Default values if no responses
        if not interests:
            interests = ["general_learning"]
        if not motivation_factors:
            motivation_factors = ["progress_tracking"]
        
        return interests, motivation_factors
    
    def _analyze_attention_span(self, attention_responses: List[DiagnosticResponse]) -> int:
        """Analyze student attention span in minutes"""
        if not attention_responses:
            return 30  # Default 30 minutes
        
        # Map response options to attention span
        attention_mapping = {0: 12, 1: 25, 2: 50, 3: 75}
        
        total_attention = 0
        for response in attention_responses:
            if isinstance(response.response, int) and response.response in attention_mapping:
                total_attention += attention_mapping[response.response]
        
        return total_attention // len(attention_responses) if attention_responses else 30
    
    def _calculate_session_length(self, attention_span: int) -> int:
        """Calculate optimal session length based on attention span"""
        # Session should be slightly shorter than attention span to maintain engagement
        return max(10, int(attention_span * 0.8))
    
    def _infer_strengths_weaknesses(
        self, 
        learning_style: LearningStyle, 
        pace: LearningPace, 
        difficulty: DifficultyLevel
    ) -> tuple[List[str], List[str]]:
        """Infer likely strengths and weaknesses from profile"""
        
        strengths = []
        weaknesses = []
        
        # Strengths based on learning style
        if learning_style == LearningStyle.VISUAL:
            strengths.extend(["visual_processing", "pattern_recognition", "spatial_reasoning"])
            weaknesses.extend(["auditory_processing"])
        elif learning_style == LearningStyle.AUDITORY:
            strengths.extend(["verbal_processing", "listening_comprehension", "memory_recall"])
            weaknesses.extend(["visual_processing"])
        elif learning_style == LearningStyle.KINESTHETIC:
            strengths.extend(["hands_on_learning", "practical_application", "experiential_learning"])
            weaknesses.extend(["theoretical_concepts"])
        elif learning_style == LearningStyle.READING_WRITING:
            strengths.extend(["text_comprehension", "written_communication", "detailed_analysis"])
            weaknesses.extend(["visual_spatial_tasks"])
        
        # Adjustments based on pace
        if pace == LearningPace.FAST:
            strengths.append("quick_comprehension")
            weaknesses.append("detail_attention")
        elif pace == LearningPace.SLOW:
            strengths.append("thorough_understanding")
            weaknesses.append("time_management")
        
        return strengths, weaknesses