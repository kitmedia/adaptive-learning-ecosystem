"""
Dynamic Pace Adjustment Service - Algoritmos ML estilo Knewton
Adaptive Learning Ecosystem - EbroValley Digital
ToñoAdPAOS & Claudio Supreme
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pandas as pd
from collections import deque

from ..models.learning_models import (
    StudentLearningProfile, LearningActivity, AdaptationDecision,
    LearningPace, DifficultyLevel, RealTimeFeedback
)

logger = logging.getLogger(__name__)

class DynamicPaceService:
    """
    Servicio de ajuste dinámico de ritmo inspirado en algoritmos Knewton
    Análisis predictivo ML para optimización en tiempo real
    """
    
    def __init__(self):
        self.pace_history = {}  # Cache de historial por estudiante
        self.performance_predictor = RandomForestRegressor(n_estimators=50, random_state=42)
        self.scaler = StandardScaler()
        self.learning_curve_models = {}  # Modelos personalizados por estudiante
        
        # Métricas de rendimiento objetivo (basado en resultados Knewton)
        self.target_metrics = {
            "retention_rate": 0.85,  # 85% retención objetivo
            "completion_rate": 0.80,  # 80% completado
            "engagement_threshold": 0.75,  # 75% engagement mínimo
            "time_efficiency_range": (0.8, 1.2)  # 80%-120% tiempo esperado
        }
    
    async def analyze_learning_pace(
        self, 
        student_id: str,
        recent_activities: List[LearningActivity],
        current_profile: StudentLearningProfile
    ) -> Dict[str, Any]:
        """Análisis completo del ritmo de aprendizaje con ML"""
        
        logger.info(f"Analyzing learning pace for student {student_id}")
        
        if not recent_activities:
            return self._default_pace_analysis(current_profile)
        
        # 1. Extraer características de rendimiento
        features = self._extract_performance_features(recent_activities)
        
        # 2. Calcular métricas de ritmo actuales
        current_metrics = self._calculate_current_metrics(recent_activities)
        
        # 3. Predecir rendimiento futuro
        predicted_performance = await self._predict_future_performance(
            student_id, features, recent_activities
        )
        
        # 4. Detectar patrones de aprendizaje
        learning_patterns = self._detect_learning_patterns(recent_activities)
        
        # 5. Evaluar necesidad de ajuste
        adjustment_needed = self._evaluate_adjustment_need(
            current_metrics, predicted_performance, current_profile
        )
        
        analysis = {
            "student_id": student_id,
            "current_metrics": current_metrics,
            "predicted_performance": predicted_performance,
            "learning_patterns": learning_patterns,
            "adjustment_needed": adjustment_needed,
            "confidence_score": features.get("data_confidence", 0.5),
            "analysis_timestamp": datetime.now(),
            "recommendations": self._generate_pace_recommendations(
                current_metrics, predicted_performance, learning_patterns
            )
        }
        
        # Actualizar cache de historial
        self._update_pace_history(student_id, analysis)
        
        return analysis
    
    def _extract_performance_features(self, activities: List[LearningActivity]) -> Dict[str, float]:
        """Extraer características numéricas para ML"""
        
        if not activities:
            return {"data_confidence": 0.0}
        
        # Métricas temporales
        total_time = sum(activity.time_spent_seconds for activity in activities)
        avg_time_per_activity = total_time / len(activities) if activities else 0
        
        # Métricas de completado
        completion_rates = [activity.completion_percentage for activity in activities]
        avg_completion = np.mean(completion_rates) if completion_rates else 0
        completion_variance = np.var(completion_rates) if completion_rates else 0
        
        # Métricas de precisión
        accuracy_scores = []
        for activity in activities:
            if activity.total_attempts > 0:
                accuracy = activity.correct_answers / activity.total_attempts
                accuracy_scores.append(accuracy)
        
        avg_accuracy = np.mean(accuracy_scores) if accuracy_scores else 0
        
        # Métricas de engagement
        engagement_scores = [activity.engagement_score for activity in activities]
        avg_engagement = np.mean(engagement_scores) if engagement_scores else 0
        
        # Métricas de ayuda
        help_ratio = np.mean([activity.help_requests for activity in activities])
        
        # Tendencias temporales (análisis de serie temporal)
        if len(activities) >= 3:
            recent_completion = np.mean(completion_rates[-3:])
            early_completion = np.mean(completion_rates[:3])
            completion_trend = recent_completion - early_completion
        else:
            completion_trend = 0
        
        # Consistencia (desviación estándar de rendimiento)
        consistency_score = 1 / (1 + np.std(completion_rates)) if completion_rates else 0
        
        features = {
            "avg_time_per_activity": avg_time_per_activity,
            "avg_completion_rate": avg_completion,
            "completion_variance": completion_variance,
            "avg_accuracy": avg_accuracy,
            "avg_engagement": avg_engagement,
            "help_request_ratio": help_ratio,
            "completion_trend": completion_trend,
            "consistency_score": consistency_score,
            "activity_count": len(activities),
            "data_confidence": min(1.0, len(activities) / 10)  # Más datos = más confianza
        }
        
        return features
    
    def _calculate_current_metrics(self, activities: List[LearningActivity]) -> Dict[str, float]:
        """Calcular métricas actuales de rendimiento"""
        
        if not activities:
            return {"error": "no_activities"}
        
        # Calcular métricas según metodología Knewton
        recent_activities = activities[-5:]  # Últimas 5 actividades
        
        # Tasa de retención (actividades completadas vs abandonadas)
        completed_activities = [a for a in recent_activities if a.completion_percentage >= 80]
        retention_rate = len(completed_activities) / len(recent_activities)
        
        # Tasa de completado promedio
        completion_rate = np.mean([a.completion_percentage for a in recent_activities]) / 100
        
        # Eficiencia temporal (tiempo real vs tiempo estimado)
        time_efficiencies = []
        for activity in recent_activities:
            if hasattr(activity, 'estimated_duration_seconds') and activity.estimated_duration_seconds > 0:
                efficiency = activity.time_spent_seconds / activity.estimated_duration_seconds
                time_efficiencies.append(efficiency)
        
        avg_time_efficiency = np.mean(time_efficiencies) if time_efficiencies else 1.0
        
        # Score de engagement promedio
        engagement_score = np.mean([a.engagement_score for a in recent_activities])
        
        # Precisión en evaluaciones
        accuracy_scores = []
        for activity in recent_activities:
            if activity.total_attempts > 0:
                accuracy = activity.correct_answers / activity.total_attempts
                accuracy_scores.append(accuracy)
        
        avg_accuracy = np.mean(accuracy_scores) if accuracy_scores else 0.7
        
        # Solicitudes de ayuda (indicador de dificultad)
        avg_help_requests = np.mean([a.help_requests for a in recent_activities])
        
        metrics = {
            "retention_rate": retention_rate,
            "completion_rate": completion_rate,
            "time_efficiency": avg_time_efficiency,
            "engagement_score": engagement_score,
            "accuracy_score": avg_accuracy,
            "help_request_frequency": avg_help_requests,
            "total_activities_analyzed": len(recent_activities)
        }
        
        return metrics
    
    async def _predict_future_performance(
        self,
        student_id: str,
        features: Dict[str, float],
        activities: List[LearningActivity]
    ) -> Dict[str, float]:
        """Predicción de rendimiento futuro usando ML"""
        
        try:
            # Crear dataset para entrenamiento
            if len(activities) < 5:
                # Pocos datos, usar predicción basada en reglas
                return self._rule_based_prediction(features)
            
            # Preparar datos temporales
            X_features = []
            y_targets = []
            
            for i in range(2, len(activities)):
                # Usar ventana deslizante de 2 actividades para predecir la siguiente
                window_features = self._extract_window_features(activities[i-2:i])
                target_performance = activities[i].completion_percentage / 100
                
                X_features.append(list(window_features.values()))
                y_targets.append(target_performance)
            
            if len(X_features) < 3:
                return self._rule_based_prediction(features)
            
            # Entrenar modelo específico del estudiante
            X = np.array(X_features)
            y = np.array(y_targets)
            
            # Normalizar features
            X_scaled = self.scaler.fit_transform(X)
            
            # Entrenar modelo
            model = RandomForestRegressor(n_estimators=30, random_state=42)
            model.fit(X_scaled, y)
            
            # Predecir próximas 3 actividades
            current_window = activities[-2:] if len(activities) >= 2 else activities
            current_features = self._extract_window_features(current_window)
            current_X = np.array([list(current_features.values())])
            current_X_scaled = self.scaler.transform(current_X)
            
            predicted_completion = model.predict(current_X_scaled)[0]
            
            # Calcular métricas predictivas adicionales
            trend_slope = self._calculate_performance_trend(activities)
            
            predictions = {
                "predicted_completion_rate": float(predicted_completion),
                "predicted_engagement": min(1.0, predicted_completion * 1.1),
                "performance_trend": float(trend_slope),
                "risk_of_dropout": max(0.0, 1.0 - predicted_completion * 1.2),
                "recommended_difficulty_adjustment": self._predict_difficulty_need(predicted_completion),
                "confidence": min(1.0, len(activities) / 15)
            }
            
            # Guardar modelo para el estudiante
            self.learning_curve_models[student_id] = model
            
            return predictions
            
        except Exception as e:
            logger.warning(f"ML prediction failed for {student_id}: {e}")
            return self._rule_based_prediction(features)
    
    def _extract_window_features(self, window_activities: List[LearningActivity]) -> Dict[str, float]:
        """Extraer características de una ventana de actividades"""
        
        if not window_activities:
            return {"avg_completion": 0.5, "avg_time": 300, "avg_engagement": 0.5}
        
        return {
            "avg_completion": np.mean([a.completion_percentage for a in window_activities]) / 100,
            "avg_time": np.mean([a.time_spent_seconds for a in window_activities]),
            "avg_engagement": np.mean([a.engagement_score for a in window_activities]),
            "avg_accuracy": np.mean([
                a.correct_answers / max(1, a.total_attempts) for a in window_activities
            ]),
            "window_size": len(window_activities)
        }
    
    def _rule_based_prediction(self, features: Dict[str, float]) -> Dict[str, float]:
        """Predicción basada en reglas cuando hay pocos datos"""
        
        completion_rate = features.get("avg_completion_rate", 0.7)
        engagement = features.get("avg_engagement", 0.7)
        accuracy = features.get("avg_accuracy", 0.7)
        
        # Predicción conservadora basada en métricas actuales
        predicted_completion = (completion_rate + engagement + accuracy) / 3
        
        return {
            "predicted_completion_rate": predicted_completion,
            "predicted_engagement": engagement,
            "performance_trend": 0.0,  # Neutral sin datos históricos
            "risk_of_dropout": max(0.0, 1.0 - predicted_completion),
            "recommended_difficulty_adjustment": 0.0,
            "confidence": 0.3  # Baja confianza con pocos datos
        }
    
    def _calculate_performance_trend(self, activities: List[LearningActivity]) -> float:
        """Calcular tendencia de rendimiento usando regresión lineal"""
        
        if len(activities) < 3:
            return 0.0
        
        # Usar completion_percentage como métrica de rendimiento
        y_values = [a.completion_percentage for a in activities]
        x_values = list(range(len(y_values)))
        
        # Regresión lineal simple
        if len(set(y_values)) == 1:  # Todos los valores iguales
            return 0.0
        
        # Calcular pendiente manualmente
        n = len(x_values)
        sum_x = sum(x_values)
        sum_y = sum(y_values)
        sum_xy = sum(x * y for x, y in zip(x_values, y_values))
        sum_x2 = sum(x * x for x in x_values)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        
        return slope
    
    def _predict_difficulty_need(self, predicted_completion: float) -> float:
        """Predecir si necesita ajuste de dificultad"""
        
        if predicted_completion > 0.9:
            return 0.3  # Incrementar dificultad
        elif predicted_completion < 0.6:
            return -0.3  # Decrementar dificultad
        else:
            return 0.0  # Mantener nivel actual
    
    def _detect_learning_patterns(self, activities: List[LearningActivity]) -> Dict[str, Any]:
        """Detectar patrones de aprendizaje estilo Knewton"""
        
        if len(activities) < 3:
            return {"pattern_confidence": "low", "patterns": []}
        
        patterns = []
        
        # Patrón 1: Curva de aprendizaje
        completion_rates = [a.completion_percentage for a in activities]
        if len(completion_rates) >= 5:
            early_avg = np.mean(completion_rates[:2])
            recent_avg = np.mean(completion_rates[-2:])
            
            if recent_avg > early_avg + 10:
                patterns.append({
                    "type": "improving_learner",
                    "confidence": 0.8,
                    "description": "Estudiante muestra mejora consistente"
                })
            elif recent_avg < early_avg - 10:
                patterns.append({
                    "type": "declining_performance",
                    "confidence": 0.8,
                    "description": "Rendimiento en declive, requiere intervención"
                })
        
        # Patrón 2: Gestión del tiempo
        time_spent = [a.time_spent_seconds for a in activities]
        avg_time = np.mean(time_spent)
        time_consistency = 1 / (1 + np.std(time_spent) / avg_time) if avg_time > 0 else 0.5
        
        if time_consistency > 0.8:
            patterns.append({
                "type": "consistent_pace",
                "confidence": 0.9,
                "description": "Ritmo de estudio muy consistente"
            })
        elif time_consistency < 0.4:
            patterns.append({
                "type": "irregular_pace",
                "confidence": 0.7,
                "description": "Ritmo irregular, necesita estructura"
            })
        
        # Patrón 3: Solicitud de ayuda
        help_requests = [a.help_requests for a in activities]
        avg_help = np.mean(help_requests)
        
        if avg_help > 2:
            patterns.append({
                "type": "support_dependent",
                "confidence": 0.75,
                "description": "Requiere mucho apoyo, contenido puede ser muy difícil"
            })
        elif avg_help < 0.5:
            patterns.append({
                "type": "independent_learner",
                "confidence": 0.8,
                "description": "Aprendiz autónomo, puede manejar mayor dificultad"
            })
        
        # Patrón 4: Engagement y motivación
        engagement_scores = [a.engagement_score for a in activities]
        avg_engagement = np.mean(engagement_scores)
        engagement_trend = np.polyfit(range(len(engagement_scores)), engagement_scores, 1)[0]
        
        if avg_engagement > 0.8:
            patterns.append({
                "type": "highly_engaged",
                "confidence": 0.9,
                "description": "Altamente motivado y comprometido"
            })
        elif engagement_trend < -0.1:
            patterns.append({
                "type": "losing_interest",
                "confidence": 0.8,
                "description": "Perdiendo interés, necesita variación de contenido"
            })
        
        return {
            "patterns": patterns,
            "pattern_confidence": "high" if len(patterns) >= 2 else "medium" if len(patterns) == 1 else "low",
            "total_patterns_detected": len(patterns)
        }
    
    def _evaluate_adjustment_need(
        self,
        current_metrics: Dict[str, float],
        predicted_performance: Dict[str, float],
        profile: StudentLearningProfile
    ) -> Dict[str, Any]:
        """Evaluar necesidad de ajuste usando umbrales Knewton-style"""
        
        adjustments_needed = []
        urgency_level = "low"
        
        # Evaluar retención
        retention = current_metrics.get("retention_rate", 0.8)
        if retention < self.target_metrics["retention_rate"]:
            adjustments_needed.append({
                "type": "retention_improvement",
                "current_value": retention,
                "target_value": self.target_metrics["retention_rate"],
                "priority": "high" if retention < 0.7 else "medium"
            })
            urgency_level = "high"
        
        # Evaluar eficiencia temporal
        time_efficiency = current_metrics.get("time_efficiency", 1.0)
        min_eff, max_eff = self.target_metrics["time_efficiency_range"]
        
        if time_efficiency < min_eff:
            adjustments_needed.append({
                "type": "pace_too_slow",
                "current_value": time_efficiency,
                "target_range": self.target_metrics["time_efficiency_range"],
                "priority": "medium"
            })
        elif time_efficiency > max_eff:
            adjustments_needed.append({
                "type": "pace_too_fast",
                "current_value": time_efficiency,
                "target_range": self.target_metrics["time_efficiency_range"],
                "priority": "medium"
            })
        
        # Evaluar riesgo de abandono
        dropout_risk = predicted_performance.get("risk_of_dropout", 0.0)
        if dropout_risk > 0.3:
            adjustments_needed.append({
                "type": "dropout_risk",
                "current_value": dropout_risk,
                "target_value": 0.1,
                "priority": "urgent"
            })
            urgency_level = "urgent"
        
        # Evaluar engagement
        engagement = current_metrics.get("engagement_score", 0.7)
        if engagement < self.target_metrics["engagement_threshold"]:
            adjustments_needed.append({
                "type": "low_engagement",
                "current_value": engagement,
                "target_value": self.target_metrics["engagement_threshold"],
                "priority": "high"
            })
        
        return {
            "needs_adjustment": len(adjustments_needed) > 0,
            "adjustments_needed": adjustments_needed,
            "urgency_level": urgency_level,
            "total_issues": len(adjustments_needed),
            "adjustment_confidence": predicted_performance.get("confidence", 0.5)
        }
    
    def _generate_pace_recommendations(
        self,
        current_metrics: Dict[str, float],
        predicted_performance: Dict[str, float],
        learning_patterns: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generar recomendaciones específicas de ajuste de ritmo"""
        
        recommendations = []
        
        # Recomendación basada en eficiencia temporal
        time_efficiency = current_metrics.get("time_efficiency", 1.0)
        
        if time_efficiency < 0.8:
            recommendations.append({
                "type": "pace_adjustment",
                "action": "decrease_content_density",
                "description": "Reducir densidad de contenido por sesión",
                "expected_impact": "Mejora en comprensión y retención",
                "confidence": 0.8
            })
        elif time_efficiency > 1.2:
            recommendations.append({
                "type": "pace_adjustment", 
                "action": "increase_challenge",
                "description": "Incrementar complejidad y densidad de contenido",
                "expected_impact": "Mantener engagement y optimizar tiempo",
                "confidence": 0.8
            })
        
        # Recomendación basada en patrones detectados
        for pattern in learning_patterns.get("patterns", []):
            if pattern["type"] == "declining_performance":
                recommendations.append({
                    "type": "intervention",
                    "action": "add_review_sessions",
                    "description": "Añadir sesiones de repaso y refuerzo",
                    "expected_impact": "Estabilizar rendimiento",
                    "confidence": pattern["confidence"]
                })
            elif pattern["type"] == "losing_interest":
                recommendations.append({
                    "type": "content_variation",
                    "action": "diversify_content_types",
                    "description": "Variar tipos de contenido y actividades",
                    "expected_impact": "Recuperar engagement",
                    "confidence": pattern["confidence"]
                })
        
        # Recomendación basada en predicción de riesgo
        dropout_risk = predicted_performance.get("risk_of_dropout", 0.0)
        if dropout_risk > 0.3:
            recommendations.append({
                "type": "retention_strategy",
                "action": "personalized_support",
                "description": "Activar soporte personalizado y mentoría",
                "expected_impact": "Reducir riesgo de abandono",
                "confidence": 0.9
            })
        
        return recommendations
    
    def _update_pace_history(self, student_id: str, analysis: Dict[str, Any]) -> None:
        """Actualizar historial de análisis para el estudiante"""
        
        if student_id not in self.pace_history:
            self.pace_history[student_id] = deque(maxlen=50)  # Últimos 50 análisis
        
        self.pace_history[student_id].append({
            "timestamp": analysis["analysis_timestamp"],
            "metrics": analysis["current_metrics"],
            "predictions": analysis["predicted_performance"],
            "adjustments": analysis["adjustment_needed"]
        })
    
    def _default_pace_analysis(self, profile: StudentLearningProfile) -> Dict[str, Any]:
        """Análisis por defecto cuando no hay actividades"""
        
        return {
            "student_id": profile.student_id,
            "current_metrics": {
                "retention_rate": 0.8,
                "completion_rate": 0.7,
                "time_efficiency": 1.0,
                "engagement_score": 0.7,
                "accuracy_score": 0.7,
                "help_request_frequency": 1.0
            },
            "predicted_performance": {
                "predicted_completion_rate": 0.75,
                "predicted_engagement": 0.7,
                "performance_trend": 0.0,
                "risk_of_dropout": 0.2,
                "confidence": 0.3
            },
            "learning_patterns": {"patterns": [], "pattern_confidence": "low"},
            "adjustment_needed": {"needs_adjustment": False, "adjustments_needed": []},
            "confidence_score": 0.3,
            "analysis_timestamp": datetime.now(),
            "recommendations": []
        }
    
    async def apply_pace_adjustments(
        self,
        student_id: str,
        adjustments: List[Dict[str, Any]],
        current_profile: StudentLearningProfile
    ) -> List[AdaptationDecision]:
        """Aplicar ajustes de ritmo y generar decisiones de adaptación"""
        
        decisions = []
        
        for adjustment in adjustments:
            decision = None
            
            if adjustment["type"] == "pace_too_slow":
                decision = AdaptationDecision(
                    student_id=student_id,
                    decision_type="pace_increase",
                    old_value=current_profile.preferred_pace.value,
                    new_value=LearningPace.FAST.value,
                    reason="Estudiante completa contenido más rápido que el promedio",
                    confidence_score=0.8,
                    made_at=datetime.now()
                )
            
            elif adjustment["type"] == "pace_too_fast":
                decision = AdaptationDecision(
                    student_id=student_id,
                    decision_type="pace_decrease",
                    old_value=current_profile.preferred_pace.value,
                    new_value=LearningPace.SLOW.value,
                    reason="Estudiante necesita más tiempo para asimilar contenido",
                    confidence_score=0.8,
                    made_at=datetime.now()
                )
            
            elif adjustment["type"] == "retention_improvement":
                decision = AdaptationDecision(
                    student_id=student_id,
                    decision_type="difficulty_decrease",
                    old_value=current_profile.current_difficulty_level.value,
                    new_value=DifficultyLevel.BEGINNER.value,
                    reason="Baja retención detectada, simplificando contenido",
                    confidence_score=0.9,
                    made_at=datetime.now()
                )
            
            if decision:
                decisions.append(decision)
        
        logger.info(f"Applied {len(decisions)} pace adjustments for student {student_id}")
        return decisions