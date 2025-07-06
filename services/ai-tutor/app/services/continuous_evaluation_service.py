"""
Continuous Evaluation Service - Evaluación y Ajustes Continuos
Adaptive Learning Ecosystem - EbroValley Digital
ToñoAdPAOS & Claudio Supreme

Sistema de reevaluación periódica que ajusta rutas, ritmo y actividades,
asegurando que nadie se quede atrás ni avance sin dominar conceptos clave
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import pandas as pd
from collections import deque

from ..models.learning_models import (
    StudentLearningProfile, LearningActivity, AdaptiveLearningPath,
    RiskAssessment, AdaptationDecision, LearningStyle, DifficultyLevel,
    LearningPace, RealTimeFeedback
)

logger = logging.getLogger(__name__)

class EvaluationMetrics:
    """Métricas para evaluación continua"""
    def __init__(self):
        self.mastery_threshold = 0.8  # 80% para considerar dominio
        self.struggle_threshold = 0.6  # <60% indica dificultades
        self.engagement_threshold = 0.7  # 70% engagement mínimo
        self.pace_variance_threshold = 0.3  # 30% variación en ritmo
        
class LearningAnalytics:
    """Análisis avanzado de patrones de aprendizaje"""
    def __init__(
        self,
        student_id: str,
        analysis_period_days: int,
        mastery_scores: List[float],
        engagement_scores: List[float],
        pace_consistency: float,
        knowledge_gaps: List[str],
        strength_areas: List[str]
    ):
        self.student_id = student_id
        self.analysis_period_days = analysis_period_days
        self.mastery_scores = mastery_scores
        self.engagement_scores = engagement_scores
        self.pace_consistency = pace_consistency
        self.knowledge_gaps = knowledge_gaps
        self.strength_areas = strength_areas
        self.overall_progress_trend = np.polyfit(range(len(mastery_scores)), mastery_scores, 1)[0] if len(mastery_scores) > 1 else 0

class ContinuousEvaluationService:
    """
    Servicio de evaluación continua que monitorea progreso y ajusta
    automáticamente la experiencia de aprendizaje
    """
    
    def __init__(self):
        self.evaluation_metrics = EvaluationMetrics()
        self.learning_analytics_cache = {}  # Cache por estudiante
        self.evaluation_history = {}  # Historial de evaluaciones
        self.adaptation_effectiveness_tracker = {}  # Seguimiento de efectividad
        
        # Intervalos de evaluación por tipo
        self.evaluation_intervals = {
            "micro": timedelta(minutes=30),    # Evaluación micro (actividad)
            "meso": timedelta(hours=24),       # Evaluación meso (sesión diaria)
            "macro": timedelta(days=7),        # Evaluación macro (semanal)
            "meta": timedelta(days=30)         # Meta-evaluación (mensual)
        }
    
    async def conduct_comprehensive_evaluation(
        self,
        student_id: str,
        current_profile: StudentLearningProfile,
        recent_activities: List[LearningActivity],
        current_path: AdaptiveLearningPath,
        evaluation_type: str = "meso"
    ) -> Dict[str, Any]:
        """Realizar evaluación comprensiva del progreso del estudiante"""
        
        logger.info(f"Conducting {evaluation_type} evaluation for student {student_id}")
        
        # 1. Analizar rendimiento reciente
        performance_analysis = await self._analyze_recent_performance(
            student_id, recent_activities
        )
        
        # 2. Evaluar dominio de conceptos
        mastery_analysis = await self._evaluate_concept_mastery(
            student_id, recent_activities, current_path
        )
        
        # 3. Detectar brechas de conocimiento
        knowledge_gaps = await self._detect_knowledge_gaps(
            mastery_analysis, current_path
        )
        
        # 4. Analizar patrones de engagement
        engagement_analysis = await self._analyze_engagement_patterns(
            recent_activities, current_profile
        )
        
        # 5. Evaluar efectividad del ritmo actual
        pace_analysis = await self._evaluate_pace_effectiveness(
            recent_activities, current_profile
        )
        
        # 6. Generar recomendaciones de ajuste
        adjustment_recommendations = await self._generate_adjustment_recommendations(
            performance_analysis, mastery_analysis, knowledge_gaps,
            engagement_analysis, pace_analysis, current_profile
        )
        
        # 7. Calcular score de riesgo
        risk_assessment = await self._assess_learning_risk(
            performance_analysis, engagement_analysis, pace_analysis
        )
        
        evaluation_result = {
            "student_id": student_id,
            "evaluation_type": evaluation_type,
            "evaluation_timestamp": datetime.now(),
            "performance_analysis": performance_analysis,
            "mastery_analysis": mastery_analysis,
            "knowledge_gaps": knowledge_gaps,
            "engagement_analysis": engagement_analysis,
            "pace_analysis": pace_analysis,
            "adjustment_recommendations": adjustment_recommendations,
            "risk_assessment": risk_assessment,
            "overall_health_score": self._calculate_overall_health_score(
                performance_analysis, engagement_analysis, pace_analysis
            )
        }
        
        # Actualizar cache y historial
        self._update_evaluation_cache(student_id, evaluation_result)
        
        return evaluation_result
    
    async def _analyze_recent_performance(
        self,
        student_id: str,
        activities: List[LearningActivity]
    ) -> Dict[str, Any]:
        """Analizar rendimiento reciente del estudiante"""
        
        if not activities:
            return {"error": "no_recent_activities"}
        
        # Métricas básicas de rendimiento
        completion_rates = [a.completion_percentage for a in activities]
        accuracy_scores = []
        
        for activity in activities:
            if activity.total_attempts > 0:
                accuracy = activity.correct_answers / activity.total_attempts
                accuracy_scores.append(accuracy)
        
        time_efficiencies = []
        for activity in activities:
            expected_time = activity.estimated_duration_seconds if hasattr(activity, 'estimated_duration_seconds') else 1800
            if expected_time > 0:
                efficiency = activity.time_spent_seconds / expected_time
                time_efficiencies.append(efficiency)
        
        # Análisis de tendencias
        if len(completion_rates) >= 3:
            completion_trend = np.polyfit(range(len(completion_rates)), completion_rates, 1)[0]
        else:
            completion_trend = 0
        
        if len(accuracy_scores) >= 3:
            accuracy_trend = np.polyfit(range(len(accuracy_scores)), accuracy_scores, 1)[0]
        else:
            accuracy_trend = 0
        
        # Consistencia de rendimiento
        completion_consistency = 1 / (1 + np.std(completion_rates)) if completion_rates else 0.5
        
        # Patrones de error
        error_patterns = self._identify_error_patterns(activities)
        
        return {
            "avg_completion_rate": np.mean(completion_rates) if completion_rates else 0,
            "avg_accuracy": np.mean(accuracy_scores) if accuracy_scores else 0,
            "avg_time_efficiency": np.mean(time_efficiencies) if time_efficiencies else 1.0,
            "completion_trend": completion_trend,
            "accuracy_trend": accuracy_trend,
            "performance_consistency": completion_consistency,
            "total_activities_analyzed": len(activities),
            "error_patterns": error_patterns,
            "performance_classification": self._classify_performance_level(
                completion_rates, accuracy_scores
            )
        }
    
    def _identify_error_patterns(self, activities: List[LearningActivity]) -> Dict[str, Any]:
        """Identificar patrones en los errores del estudiante"""
        
        error_patterns = {
            "consecutive_error_streaks": 0,
            "avg_help_requests": 0,
            "error_types": [],
            "difficulty_correlation": 0
        }
        
        # Contar rachas de errores consecutivos
        max_error_streak = 0
        current_streak = 0
        
        help_requests = []
        
        for activity in activities:
            if activity.total_attempts > 0:
                accuracy = activity.correct_answers / activity.total_attempts
                if accuracy < 0.5:  # Consideramos error si < 50% precisión
                    current_streak += 1
                    max_error_streak = max(max_error_streak, current_streak)
                else:
                    current_streak = 0
            
            help_requests.append(activity.help_requests)
        
        error_patterns["consecutive_error_streaks"] = max_error_streak
        error_patterns["avg_help_requests"] = np.mean(help_requests) if help_requests else 0
        
        return error_patterns
    
    def _classify_performance_level(
        self,
        completion_rates: List[float],
        accuracy_scores: List[float]
    ) -> str:
        """Clasificar nivel de rendimiento del estudiante"""
        
        if not completion_rates:
            return "insufficient_data"
        
        avg_completion = np.mean(completion_rates)
        avg_accuracy = np.mean(accuracy_scores) if accuracy_scores else avg_completion / 100
        
        overall_score = (avg_completion + avg_accuracy * 100) / 2
        
        if overall_score >= 85:
            return "excellent"
        elif overall_score >= 75:
            return "good"
        elif overall_score >= 65:
            return "satisfactory"
        elif overall_score >= 50:
            return "needs_improvement"
        else:
            return "critical"
    
    async def _evaluate_concept_mastery(
        self,
        student_id: str,
        activities: List[LearningActivity],
        current_path: AdaptiveLearningPath
    ) -> Dict[str, Any]:
        """Evaluar dominio de conceptos específicos"""
        
        # Mapear actividades a conceptos/temas
        concept_performance = {}
        
        for i, activity in enumerate(activities):
            # Obtener nodo correspondiente del path
            if i < len(current_path.nodes):
                node = current_path.nodes[i]
                concepts = node.learning_objectives  # Usar objetivos como proxy de conceptos
                
                if activity.total_attempts > 0:
                    accuracy = activity.correct_answers / activity.total_attempts
                    completion = activity.completion_percentage / 100
                    
                    # Score combinado de dominio
                    mastery_score = (accuracy * 0.7) + (completion * 0.3)
                    
                    for concept in concepts:
                        if concept not in concept_performance:
                            concept_performance[concept] = []
                        concept_performance[concept].append(mastery_score)
        
        # Analizar dominio por concepto
        mastery_analysis = {}
        for concept, scores in concept_performance.items():
            avg_score = np.mean(scores)
            consistency = 1 / (1 + np.std(scores)) if len(scores) > 1 else 0.5
            
            mastery_level = "not_attempted"
            if avg_score >= self.evaluation_metrics.mastery_threshold:
                mastery_level = "mastered"
            elif avg_score >= self.evaluation_metrics.struggle_threshold:
                mastery_level = "developing"
            else:
                mastery_level = "struggling"
            
            mastery_analysis[concept] = {
                "average_score": avg_score,
                "consistency": consistency,
                "mastery_level": mastery_level,
                "attempts_count": len(scores)
            }
        
        return mastery_analysis
    
    async def _detect_knowledge_gaps(
        self,
        mastery_analysis: Dict[str, Any],
        current_path: AdaptiveLearningPath
    ) -> List[Dict[str, Any]]:
        """Detectar brechas específicas en el conocimiento"""
        
        knowledge_gaps = []
        
        for concept, analysis in mastery_analysis.items():
            if analysis["mastery_level"] == "struggling":
                gap = {
                    "concept": concept,
                    "severity": "high" if analysis["average_score"] < 0.4 else "medium",
                    "consistency_issue": analysis["consistency"] < 0.5,
                    "recommended_intervention": self._recommend_intervention(analysis),
                    "prerequisite_check_needed": True
                }
                knowledge_gaps.append(gap)
            
            elif analysis["mastery_level"] == "developing" and analysis["consistency"] < 0.6:
                gap = {
                    "concept": concept,
                    "severity": "low",
                    "consistency_issue": True,
                    "recommended_intervention": "additional_practice",
                    "prerequisite_check_needed": False
                }
                knowledge_gaps.append(gap)
        
        return knowledge_gaps
    
    def _recommend_intervention(self, concept_analysis: Dict[str, Any]) -> str:
        """Recomendar intervención específica para concepto con dificultades"""
        
        score = concept_analysis["average_score"]
        consistency = concept_analysis["consistency"]
        
        if score < 0.3:
            return "prerequisite_review"
        elif score < 0.5 and consistency < 0.4:
            return "alternative_explanation"
        elif consistency < 0.5:
            return "additional_practice"
        else:
            return "guided_practice"
    
    async def _analyze_engagement_patterns(
        self,
        activities: List[LearningActivity],
        profile: StudentLearningProfile
    ) -> Dict[str, Any]:
        """Analizar patrones de engagement del estudiante"""
        
        if not activities:
            return {"error": "no_activities"}
        
        engagement_scores = [a.engagement_score for a in activities]
        time_patterns = [a.time_spent_seconds for a in activities]
        interaction_patterns = [a.interactions for a in activities]
        
        # Tendencia de engagement
        if len(engagement_scores) >= 3:
            engagement_trend = np.polyfit(range(len(engagement_scores)), engagement_scores, 1)[0]
        else:
            engagement_trend = 0
        
        # Identificar drops significativos en engagement
        engagement_drops = []
        for i in range(1, len(engagement_scores)):
            drop = engagement_scores[i-1] - engagement_scores[i]
            if drop > 0.2:  # Drop mayor a 20%
                engagement_drops.append({
                    "activity_index": i,
                    "drop_magnitude": drop,
                    "possible_cause": self._identify_engagement_drop_cause(activities[i])
                })
        
        # Patrones temporales
        avg_session_time = np.mean(time_patterns)
        time_consistency = 1 / (1 + np.std(time_patterns) / avg_session_time) if avg_session_time > 0 else 0.5
        
        return {
            "avg_engagement": np.mean(engagement_scores),
            "engagement_trend": engagement_trend,
            "engagement_consistency": 1 / (1 + np.std(engagement_scores)),
            "significant_drops": engagement_drops,
            "avg_session_time_minutes": avg_session_time / 60,
            "time_consistency": time_consistency,
            "avg_interactions_per_activity": np.mean(interaction_patterns),
            "engagement_classification": self._classify_engagement_level(engagement_scores)
        }
    
    def _identify_engagement_drop_cause(self, activity: LearningActivity) -> str:
        """Identificar posible causa de drop en engagement"""
        
        if activity.help_requests > 3:
            return "excessive_difficulty"
        elif activity.time_spent_seconds > 2400:  # > 40 minutos
            return "session_too_long"
        elif activity.interactions < 5:
            return "lack_of_interactivity"
        else:
            return "content_relevance"
    
    def _classify_engagement_level(self, engagement_scores: List[float]) -> str:
        """Clasificar nivel general de engagement"""
        
        avg_engagement = np.mean(engagement_scores)
        
        if avg_engagement >= 0.8:
            return "highly_engaged"
        elif avg_engagement >= 0.7:
            return "well_engaged"
        elif avg_engagement >= 0.5:
            return "moderately_engaged"
        else:
            return "poorly_engaged"
    
    async def _evaluate_pace_effectiveness(
        self,
        activities: List[LearningActivity],
        profile: StudentLearningProfile
    ) -> Dict[str, Any]:
        """Evaluar efectividad del ritmo de aprendizaje actual"""
        
        if not activities:
            return {"error": "no_activities"}
        
        # Analizar tiempos de completado vs tiempo esperado
        time_efficiencies = []
        for activity in activities:
            expected_time = getattr(activity, 'estimated_duration_seconds', 1800)
            if expected_time > 0:
                efficiency = activity.time_spent_seconds / expected_time
                time_efficiencies.append(efficiency)
        
        avg_efficiency = np.mean(time_efficiencies) if time_efficiencies else 1.0
        
        # Determinar si el ritmo es apropiado
        pace_assessment = "optimal"
        if avg_efficiency < 0.7:
            pace_assessment = "too_fast"
        elif avg_efficiency > 1.4:
            pace_assessment = "too_slow"
        
        # Correlación entre velocidad y precisión
        accuracy_scores = []
        for activity in activities:
            if activity.total_attempts > 0:
                accuracy = activity.correct_answers / activity.total_attempts
                accuracy_scores.append(accuracy)
        
        speed_accuracy_correlation = 0
        if len(time_efficiencies) == len(accuracy_scores) and len(accuracy_scores) > 2:
            speed_accuracy_correlation = np.corrcoef(time_efficiencies, accuracy_scores)[0, 1]
        
        return {
            "avg_time_efficiency": avg_efficiency,
            "pace_assessment": pace_assessment,
            "pace_consistency": 1 / (1 + np.std(time_efficiencies)) if time_efficiencies else 0.5,
            "speed_accuracy_correlation": speed_accuracy_correlation,
            "recommended_pace_adjustment": self._recommend_pace_adjustment(
                avg_efficiency, speed_accuracy_correlation
            )
        }
    
    def _recommend_pace_adjustment(
        self,
        avg_efficiency: float,
        speed_accuracy_correlation: float
    ) -> str:
        """Recomendar ajuste de ritmo basado en análisis"""
        
        if avg_efficiency < 0.7 and speed_accuracy_correlation < -0.3:
            return "slow_down_for_comprehension"
        elif avg_efficiency > 1.4 and speed_accuracy_correlation > 0.3:
            return "increase_challenge"
        elif avg_efficiency < 0.8:
            return "provide_more_time"
        elif avg_efficiency > 1.3:
            return "accelerate_content"
        else:
            return "maintain_current_pace"
    
    async def _generate_adjustment_recommendations(
        self,
        performance_analysis: Dict[str, Any],
        mastery_analysis: Dict[str, Any],
        knowledge_gaps: List[Dict[str, Any]],
        engagement_analysis: Dict[str, Any],
        pace_analysis: Dict[str, Any],
        profile: StudentLearningProfile
    ) -> List[Dict[str, Any]]:
        """Generar recomendaciones específicas de ajuste"""
        
        recommendations = []
        
        # Recomendaciones basadas en rendimiento
        performance_class = performance_analysis.get("performance_classification", "satisfactory")
        
        if performance_class == "critical":
            recommendations.append({
                "type": "immediate_intervention",
                "priority": "urgent",
                "action": "schedule_tutor_session",
                "description": "Rendimiento crítico detectado - intervención inmediata necesaria",
                "expected_impact": "high"
            })
        
        elif performance_class == "needs_improvement":
            recommendations.append({
                "type": "support_increase",
                "priority": "high",
                "action": "add_practice_sessions",
                "description": "Aumentar sesiones de práctica y refuerzo",
                "expected_impact": "medium"
            })
        
        # Recomendaciones basadas en brechas de conocimiento
        high_severity_gaps = [gap for gap in knowledge_gaps if gap["severity"] == "high"]
        
        if high_severity_gaps:
            recommendations.append({
                "type": "prerequisite_review",
                "priority": "high",
                "action": "review_foundational_concepts",
                "description": f"Revisar conceptos base para {len(high_severity_gaps)} áreas problemáticas",
                "expected_impact": "high",
                "affected_concepts": [gap["concept"] for gap in high_severity_gaps]
            })
        
        # Recomendaciones basadas en engagement
        engagement_class = engagement_analysis.get("engagement_classification", "moderately_engaged")
        
        if engagement_class == "poorly_engaged":
            recommendations.append({
                "type": "content_variation",
                "priority": "high",
                "action": "diversify_content_types",
                "description": "Variar tipos de contenido para mejorar engagement",
                "expected_impact": "medium"
            })
        
        # Recomendaciones basadas en ritmo
        pace_recommendation = pace_analysis.get("recommended_pace_adjustment", "maintain_current_pace")
        
        if pace_recommendation != "maintain_current_pace":
            recommendations.append({
                "type": "pace_adjustment",
                "priority": "medium",
                "action": pace_recommendation,
                "description": f"Ajustar ritmo: {pace_recommendation.replace('_', ' ')}",
                "expected_impact": "medium"
            })
        
        return recommendations
    
    async def _assess_learning_risk(
        self,
        performance_analysis: Dict[str, Any],
        engagement_analysis: Dict[str, Any],
        pace_analysis: Dict[str, Any]
    ) -> RiskAssessment:
        """Evaluar riesgo de abandono o fracaso académico"""
        
        risk_factors = []
        risk_score = 0.0
        
        # Factor 1: Rendimiento
        performance_class = performance_analysis.get("performance_classification", "satisfactory")
        if performance_class == "critical":
            risk_score += 0.4
            risk_factors.append("critical_performance")
        elif performance_class == "needs_improvement":
            risk_score += 0.2
            risk_factors.append("declining_performance")
        
        # Factor 2: Tendencia de rendimiento
        completion_trend = performance_analysis.get("completion_trend", 0)
        accuracy_trend = performance_analysis.get("accuracy_trend", 0)
        
        if completion_trend < -5 or accuracy_trend < -0.1:
            risk_score += 0.2
            risk_factors.append("negative_performance_trend")
        
        # Factor 3: Engagement
        avg_engagement = engagement_analysis.get("avg_engagement", 0.7)
        engagement_trend = engagement_analysis.get("engagement_trend", 0)
        
        if avg_engagement < 0.5:
            risk_score += 0.25
            risk_factors.append("low_engagement")
        
        if engagement_trend < -0.1:
            risk_score += 0.15
            risk_factors.append("declining_engagement")
        
        # Factor 4: Problemas de ritmo
        pace_assessment = pace_analysis.get("pace_assessment", "optimal")
        if pace_assessment != "optimal":
            risk_score += 0.1
            risk_factors.append("pace_mismatch")
        
        # Determinar nivel de riesgo
        if risk_score >= 0.7:
            risk_level = "critical"
        elif risk_score >= 0.4:
            risk_level = "high"
        elif risk_score >= 0.2:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Generar intervenciones recomendadas
        interventions = self._generate_risk_interventions(risk_level, risk_factors)
        
        return RiskAssessment(
            student_id="",  # Se completará en el método principal
            risk_level=risk_level,
            risk_factors=risk_factors,
            prediction_confidence=min(0.9, 0.5 + (len(risk_factors) * 0.1)),
            recommended_interventions=interventions,
            assessment_date=datetime.now(),
            next_assessment_date=datetime.now() + timedelta(days=7)
        )
    
    def _generate_risk_interventions(
        self,
        risk_level: str,
        risk_factors: List[str]
    ) -> List[str]:
        """Generar intervenciones específicas basadas en riesgo detectado"""
        
        interventions = []
        
        if risk_level == "critical":
            interventions.extend([
                "immediate_instructor_contact",
                "one_on_one_tutoring",
                "learning_plan_revision"
            ])
        
        elif risk_level == "high":
            interventions.extend([
                "increased_check_ins",
                "peer_study_group_assignment",
                "additional_practice_resources"
            ])
        
        elif risk_level == "medium":
            interventions.extend([
                "motivational_content",
                "progress_celebration",
                "study_habit_guidance"
            ])
        
        # Intervenciones específicas por factor de riesgo
        if "low_engagement" in risk_factors:
            interventions.append("content_gamification")
        
        if "pace_mismatch" in risk_factors:
            interventions.append("personalized_scheduling")
        
        if "declining_performance" in risk_factors:
            interventions.append("skill_gap_analysis")
        
        return list(set(interventions))  # Eliminar duplicados
    
    def _calculate_overall_health_score(
        self,
        performance_analysis: Dict[str, Any],
        engagement_analysis: Dict[str, Any],
        pace_analysis: Dict[str, Any]
    ) -> float:
        """Calcular score general de salud del aprendizaje"""
        
        # Componentes del score (0-1 cada uno)
        performance_score = performance_analysis.get("avg_completion_rate", 0.7) / 100
        engagement_score = engagement_analysis.get("avg_engagement", 0.7)
        
        pace_efficiency = pace_analysis.get("avg_time_efficiency", 1.0)
        pace_score = 1.0 - min(abs(1.0 - pace_efficiency), 0.5)  # Óptimo en 1.0
        
        # Pesos para cada componente
        weights = {
            "performance": 0.4,
            "engagement": 0.35,
            "pace": 0.25
        }
        
        overall_score = (
            performance_score * weights["performance"] +
            engagement_score * weights["engagement"] +
            pace_score * weights["pace"]
        )
        
        return min(1.0, overall_score)
    
    def _update_evaluation_cache(
        self,
        student_id: str,
        evaluation_result: Dict[str, Any]
    ) -> None:
        """Actualizar cache de evaluaciones"""
        
        if student_id not in self.evaluation_history:
            self.evaluation_history[student_id] = deque(maxlen=50)
        
        self.evaluation_history[student_id].append({
            "timestamp": evaluation_result["evaluation_timestamp"],
            "health_score": evaluation_result["overall_health_score"],
            "risk_level": evaluation_result["risk_assessment"].risk_level,
            "adjustments_made": len(evaluation_result["adjustment_recommendations"])
        })
    
    async def schedule_next_evaluation(
        self,
        student_id: str,
        current_risk_level: str,
        performance_trend: str
    ) -> datetime:
        """Programar próxima evaluación basada en riesgo y tendencia"""
        
        base_interval = self.evaluation_intervals["meso"]  # 24 horas por defecto
        
        # Ajustar intervalo según riesgo
        if current_risk_level == "critical":
            interval = self.evaluation_intervals["micro"]  # 30 minutos
        elif current_risk_level == "high":
            interval = timedelta(hours=6)  # 6 horas
        elif current_risk_level == "medium":
            interval = timedelta(hours=12)  # 12 horas
        else:
            interval = base_interval
        
        # Ajustar según tendencia
        if performance_trend == "declining":
            interval = interval * 0.5  # Más frecuente
        elif performance_trend == "improving":
            interval = interval * 1.5  # Menos frecuente
        
        return datetime.now() + interval