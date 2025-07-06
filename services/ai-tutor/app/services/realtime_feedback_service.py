"""
Real-Time Feedback Service - Retroalimentación Inmediata Personalizada
Adaptive Learning Ecosystem - EbroValley Digital
ToñoAdPAOS & Claudio Supreme

Implementa feedback en tiempo real manteniendo al estudiante en su "zona de aprendizaje óptima"
siguiendo metodologías Knewton, Khan Academy y Coursera
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import random
from enum import Enum

from ..models.learning_models import (
    StudentLearningProfile, LearningActivity, RealTimeFeedback,
    LearningStyle, DifficultyLevel, ContentType, AdaptationDecision
)

logger = logging.getLogger(__name__)

class FeedbackType(str, Enum):
    ENCOURAGEMENT = "encouragement"
    CORRECTION = "correction"
    HINT = "hint"
    CELEBRATION = "celebration"
    WARNING = "warning"
    MOTIVATION = "motivation"
    GUIDANCE = "guidance"

class LearningZone(str, Enum):
    COMFORT = "comfort"  # Muy fácil - aburrimiento
    OPTIMAL = "optimal"  # Zona de aprendizaje óptima
    CHALLENGE = "challenge"  # Difícil pero manejable
    PANIC = "panic"  # Muy difícil - frustración

class RealTimeFeedbackService:
    """
    Servicio de retroalimentación inmediata personalizada
    Mantiene al estudiante en su zona de aprendizaje óptima
    """
    
    def __init__(self):
        self.feedback_templates = self._initialize_feedback_templates()
        self.learning_zone_thresholds = {
            "comfort_max": 0.9,    # >90% precisión = zona confort
            "optimal_min": 0.65,   # 65-90% = zona óptima
            "optimal_max": 0.9,
            "challenge_min": 0.4,  # 40-65% = zona desafío
            "panic_threshold": 0.4  # <40% = zona pánico
        }
        
    def _initialize_feedback_templates(self) -> Dict[str, Dict[str, List[str]]]:
        """Inicializar plantillas de feedback por estilo de aprendizaje"""
        return {
            "visual": {
                "encouragement": [
                    "🎯 ¡Excelente! Puedes ver claramente el patrón en este problema",
                    "📊 Tu comprensión visual está mejorando notablemente",
                    "🔍 Estás conectando las ideas de manera muy visual",
                    "📈 ¡Fantástico progreso! El diagrama te está ayudando mucho"
                ],
                "correction": [
                    "👀 Observa este diagrama más detenidamente - hay un detalle importante",
                    "📋 Revisa la imagen: la respuesta está en los elementos visuales",
                    "🎨 Imagina este concepto como un mapa mental - ¿qué conexiones ves?",
                    "📐 Mira este esquema paso a paso para entender mejor"
                ],
                "hint": [
                    "💡 Pista visual: Fíjate en los colores del diagrama",
                    "🗺️ Dibuja mentalmente la estructura del problema",
                    "📊 ¿Qué patrones visuales puedes identificar aquí?",
                    "🎯 Imagina cómo se vería la solución en un gráfico"
                ],
                "celebration": [
                    "🌟 ¡INCREÍBLE! Has visualizado la solución perfectamente",
                    "🎊 ¡Maestría visual alcanzada! Tu manera de ver los problemas es excepcional",
                    "🏆 ¡Eres un genio visual! Has conectado todas las piezas"
                ]
            },
            "auditory": {
                "encouragement": [
                    "🎵 ¡Perfecto! Estás escuchando las explicaciones con atención",
                    "🔊 Tu comprensión auditiva está en excelente forma",
                    "📻 ¡Genial! Estás procesando la información de manera clara",
                    "🎧 ¡Fantástico! Tu oído para los detalles es impresionante"
                ],
                "correction": [
                    "👂 Escucha nuevamente la explicación - hay una palabra clave",
                    "🔊 Repite en voz alta el concepto para interiorizarlo mejor",
                    "📢 ¿Puedes repetir el proceso paso a paso en voz alta?",
                    "🎵 Intenta explicarte el problema como si fuera una historia"
                ],
                "hint": [
                    "💭 Pista auditiva: Repite mentalmente la definición",
                    "🎙️ ¿Qué te dice tu voz interior sobre este problema?",
                    "🔊 Escucha el patrón en la secuencia de números",
                    "📻 Imagina una conversación sobre este tema"
                ],
                "celebration": [
                    "🎉 ¡EXCELENTE! Has escuchado y procesado perfectamente",
                    "🎵 ¡Sinfonía de éxito! Tu comprensión auditiva es magistral",
                    "📯 ¡Bravo! Tu capacidad de escucha activa es extraordinaria"
                ]
            },
            "kinesthetic": {
                "encouragement": [
                    "💪 ¡Genial! Tu enfoque práctico está dando resultados",
                    "🏃 ¡Excelente! Aprendes mejor haciendo y experimentando",
                    "🔧 ¡Perfecto! Tu método hands-on es muy efectivo",
                    "⚡ ¡Fantástico! Tu energía práctica te impulsa"
                ],
                "correction": [
                    "🔨 Intenta resolver este problema paso a paso, con calma",
                    "🧪 Experimenta con diferentes enfoques hasta encontrar el correcto",
                    "🏗️ Construye la solución bloque por bloque",
                    "⚙️ Practica el movimiento o proceso hasta dominarlo"
                ],
                "hint": [
                    "🎯 Pista práctica: Simula el problema con objetos reales",
                    "🔧 ¿Qué pasaría si lo intentaras de manera diferente?",
                    "💡 Mueve las piezas mentalmente hasta que encajen",
                    "🏃 Camina mientras piensas en la solución"
                ],
                "celebration": [
                    "🎊 ¡INCREÍBLE! Tu enfoque práctico ha triunfado",
                    "🏆 ¡Maestro de la acción! Has dominado este desafío",
                    "⚡ ¡Energía pura! Tu método kinestésico es imparable"
                ]
            },
            "reading_writing": {
                "encouragement": [
                    "📚 ¡Excelente! Tu análisis textual es muy profundo",
                    "✍️ ¡Perfecto! Tu capacidad de síntesis es impresionante",
                    "📝 ¡Genial! Estás tomando notas muy efectivas",
                    "📖 ¡Fantástico! Tu comprensión lectora está en su mejor momento"
                ],
                "correction": [
                    "📋 Revisa tus notas - la respuesta está en lo que escribiste",
                    "📝 Escribe un resumen del problema para clarificar ideas",
                    "📚 Lee el enunciado nuevamente, prestando atención a cada palabra",
                    "✏️ Anota los pasos que has seguido para encontrar el error"
                ],
                "hint": [
                    "💭 Pista textual: Busca palabras clave en el enunciado",
                    "📝 Escribe lo que sabes y lo que necesitas encontrar",
                    "📚 ¿Qué definición o fórmula aplica aquí?",
                    "✍️ Haz una lista de los pasos necesarios"
                ],
                "celebration": [
                    "🌟 ¡MAGISTRAL! Tu análisis textual ha sido perfecto",
                    "📚 ¡Erudito del conocimiento! Tu dominio escrito es excepcional",
                    "✍️ ¡Genio de las palabras! Has articulado la solución perfectamente"
                ]
            }
        }
    
    async def generate_realtime_feedback(
        self,
        student_id: str,
        current_activity: LearningActivity,
        profile: StudentLearningProfile,
        performance_context: Dict[str, Any]
    ) -> RealTimeFeedback:
        """Generar feedback inmediato personalizado basado en contexto actual"""
        
        logger.info(f"Generating real-time feedback for student {student_id}")
        
        # 1. Determinar zona de aprendizaje actual
        learning_zone = self._determine_learning_zone(current_activity, performance_context)
        
        # 2. Analizar tipo de feedback necesario
        feedback_type = self._determine_feedback_type(learning_zone, current_activity, performance_context)
        
        # 3. Generar mensaje personalizado según estilo de aprendizaje
        message = self._generate_personalized_message(
            feedback_type, profile.learning_style, performance_context
        )
        
        # 4. Generar acciones sugeridas
        suggested_actions = self._generate_suggested_actions(
            learning_zone, feedback_type, profile, current_activity
        )
        
        # 5. Calcular nivel de confianza del feedback
        confidence = self._calculate_feedback_confidence(performance_context, profile)
        
        feedback = RealTimeFeedback(
            student_id=student_id,
            activity_id=current_activity.activity_id,
            feedback_type=feedback_type.value,
            message=message,
            suggested_actions=suggested_actions,
            confidence_level=confidence,
            generated_at=datetime.now(),
            is_personalized=True
        )
        
        # 6. Log para análisis y mejora continua
        self._log_feedback_analytics(student_id, learning_zone, feedback_type, confidence)
        
        return feedback
    
    def _determine_learning_zone(
        self, 
        activity: LearningActivity,
        context: Dict[str, Any]
    ) -> LearningZone:
        """Determinar en qué zona de aprendizaje está el estudiante"""
        
        # Calcular precisión actual
        if activity.total_attempts > 0:
            accuracy = activity.correct_answers / activity.total_attempts
        else:
            accuracy = context.get("current_accuracy", 0.7)
        
        # Considerar tiempo dedicado vs tiempo esperado
        time_efficiency = context.get("time_efficiency", 1.0)
        engagement_score = activity.engagement_score
        
        # Factores adicionales
        help_requests = activity.help_requests
        consecutive_errors = context.get("consecutive_errors", 0)
        
        # Determinar zona basada en múltiples factores
        if accuracy >= self.learning_zone_thresholds["comfort_max"] and time_efficiency < 0.7:
            return LearningZone.COMFORT  # Muy fácil, completando rápido
        
        elif (self.learning_zone_thresholds["optimal_min"] <= accuracy <= self.learning_zone_thresholds["optimal_max"] 
              and engagement_score >= 0.6 and help_requests <= 2):
            return LearningZone.OPTIMAL  # Zona perfecta
        
        elif (self.learning_zone_thresholds["challenge_min"] <= accuracy < self.learning_zone_thresholds["optimal_min"]
              and consecutive_errors <= 3 and engagement_score >= 0.4):
            return LearningZone.CHALLENGE  # Desafiante pero manejable
        
        else:
            return LearningZone.PANIC  # Muy difícil, frustración
    
    def _determine_feedback_type(
        self,
        zone: LearningZone,
        activity: LearningActivity,
        context: Dict[str, Any]
    ) -> FeedbackType:
        """Determinar tipo de feedback apropiado según zona y contexto"""
        
        consecutive_correct = context.get("consecutive_correct", 0)
        consecutive_errors = context.get("consecutive_errors", 0)
        recent_improvement = context.get("recent_improvement", False)
        
        if zone == LearningZone.COMFORT:
            if consecutive_correct >= 3:
                return FeedbackType.CELEBRATION
            else:
                return FeedbackType.ENCOURAGEMENT
        
        elif zone == LearningZone.OPTIMAL:
            if consecutive_correct >= 2:
                return FeedbackType.ENCOURAGEMENT
            elif consecutive_errors == 1:
                return FeedbackType.HINT
            else:
                return FeedbackType.GUIDANCE
        
        elif zone == LearningZone.CHALLENGE:
            if consecutive_errors >= 2:
                return FeedbackType.HINT
            elif recent_improvement:
                return FeedbackType.ENCOURAGEMENT
            else:
                return FeedbackType.GUIDANCE
        
        else:  # PANIC zone
            if consecutive_errors >= 3:
                return FeedbackType.CORRECTION
            elif activity.help_requests > 2:
                return FeedbackType.MOTIVATION
            else:
                return FeedbackType.WARNING
    
    def _generate_personalized_message(
        self,
        feedback_type: FeedbackType,
        learning_style: LearningStyle,
        context: Dict[str, Any]
    ) -> str:
        """Generar mensaje personalizado según estilo de aprendizaje"""
        
        # Obtener plantillas para el estilo de aprendizaje
        style_key = learning_style.value if learning_style != LearningStyle.MULTIMODAL else "visual"
        
        if style_key not in self.feedback_templates:
            style_key = "visual"  # Fallback
        
        templates = self.feedback_templates[style_key].get(feedback_type.value, [])
        
        if not templates:
            # Fallback genérico
            return self._generate_generic_message(feedback_type, context)
        
        # Seleccionar template aleatoriamente para variedad
        base_message = random.choice(templates)
        
        # Personalizar con contexto específico
        return self._contextualize_message(base_message, context)
    
    def _generate_generic_message(
        self, 
        feedback_type: FeedbackType,
        context: Dict[str, Any]
    ) -> str:
        """Generar mensaje genérico cuando no hay plantillas específicas"""
        
        generic_messages = {
            FeedbackType.ENCOURAGEMENT: "¡Muy bien! Estás progresando de manera excelente.",
            FeedbackType.CORRECTION: "Hay un pequeño error. Revisa tu enfoque y inténtalo nuevamente.",
            FeedbackType.HINT: "Aquí tienes una pista para ayudarte a continuar.",
            FeedbackType.CELEBRATION: "¡Fantástico! Has demostrado gran dominio del tema.",
            FeedbackType.WARNING: "Parece que este tema es desafiante. Tomemos un enfoque diferente.",
            FeedbackType.MOTIVATION: "¡No te rindas! Cada error es una oportunidad de aprender.",
            FeedbackType.GUIDANCE: "Te guío en el proceso. Sigamos paso a paso."
        }
        
        return generic_messages.get(feedback_type, "Continúa con tu buen trabajo.")
    
    def _contextualize_message(self, base_message: str, context: Dict[str, Any]) -> str:
        """Añadir contexto específico al mensaje base"""
        
        # Añadir información específica del rendimiento si es relevante
        accuracy = context.get("current_accuracy", 0)
        
        if accuracy and "excelente" in base_message.lower():
            if accuracy > 0.9:
                base_message += f" (Precisión: {accuracy*100:.0f}%)"
        
        # Añadir motivación extra si es necesario
        consecutive_errors = context.get("consecutive_errors", 0)
        if consecutive_errors >= 2 and "error" not in base_message.lower():
            base_message += " Recuerda que los errores son parte del aprendizaje."
        
        return base_message
    
    def _generate_suggested_actions(
        self,
        zone: LearningZone,
        feedback_type: FeedbackType,
        profile: StudentLearningProfile,
        activity: LearningActivity
    ) -> List[str]:
        """Generar acciones específicas sugeridas"""
        
        actions = []
        
        if zone == LearningZone.COMFORT:
            actions.extend([
                "Intentar el próximo nivel de dificultad",
                "Explorar conceptos más avanzados",
                "Ayudar a compañeros con dudas similares"
            ])
        
        elif zone == LearningZone.OPTIMAL:
            actions.extend([
                "Continuar con el ritmo actual",
                "Practicar con variaciones del problema",
                "Reflexionar sobre lo aprendido"
            ])
        
        elif zone == LearningZone.CHALLENGE:
            actions.extend([
                "Revisar conceptos fundamentales",
                "Practicar con ejemplos similares",
                "Solicitar ayuda específica en puntos difíciles"
            ])
        
        else:  # PANIC zone
            actions.extend([
                "Tomar un descanso breve",
                "Revisar material de apoyo",
                "Contactar al tutor para orientación personalizada",
                "Practicar con ejercicios más simples"
            ])
        
        # Añadir acciones específicas por estilo de aprendizaje
        if profile.learning_style == LearningStyle.VISUAL:
            actions.append("Ver diagramas o videos explicativos")
        elif profile.learning_style == LearningStyle.AUDITORY:
            actions.append("Escuchar explicaciones en audio")
        elif profile.learning_style == LearningStyle.KINESTHETIC:
            actions.append("Practicar con simulaciones interactivas")
        elif profile.learning_style == LearningStyle.READING_WRITING:
            actions.append("Leer material complementario")
        
        # Limitar a máximo 4 acciones para no abrumar
        return actions[:4]
    
    def _calculate_feedback_confidence(
        self,
        context: Dict[str, Any],
        profile: StudentLearningProfile
    ) -> float:
        """Calcular nivel de confianza del feedback generado"""
        
        confidence = 0.5  # Base
        
        # Más confianza con más datos históricos
        activity_count = context.get("recent_activity_count", 1)
        confidence += min(0.3, activity_count * 0.05)
        
        # Más confianza si el perfil está bien establecido
        profile_age_days = (datetime.now() - profile.created_at).days
        confidence += min(0.15, profile_age_days * 0.01)
        
        # Más confianza si hay consistencia en el rendimiento
        performance_consistency = context.get("performance_consistency", 0.5)
        confidence += performance_consistency * 0.2
        
        # Ajustar por certeza del estilo de aprendizaje
        confidence += profile.learning_style_confidence * 0.1
        
        return min(1.0, confidence)
    
    def _log_feedback_analytics(
        self,
        student_id: str,
        zone: LearningZone,
        feedback_type: FeedbackType,
        confidence: float
    ) -> None:
        """Log para analytics y mejora continua del sistema"""
        
        logger.info(
            f"Feedback generated - Student: {student_id}, "
            f"Zone: {zone.value}, Type: {feedback_type.value}, "
            f"Confidence: {confidence:.2f}"
        )
    
    async def evaluate_feedback_effectiveness(
        self,
        feedback: RealTimeFeedback,
        post_feedback_performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluar efectividad del feedback proporcionado"""
        
        # Métricas de mejora post-feedback
        improvement_score = post_feedback_performance.get("improvement_score", 0.0)
        engagement_change = post_feedback_performance.get("engagement_change", 0.0)
        time_to_next_success = post_feedback_performance.get("time_to_success", None)
        
        # Calcular efectividad
        effectiveness = 0.0
        
        if improvement_score > 0:
            effectiveness += 0.4 * improvement_score
        
        if engagement_change > 0:
            effectiveness += 0.3 * engagement_change
        
        if time_to_next_success and time_to_next_success < 300:  # 5 minutos
            effectiveness += 0.3
        
        effectiveness = min(1.0, effectiveness)
        
        evaluation = {
            "feedback_id": feedback.student_id + "_" + str(int(feedback.generated_at.timestamp())),
            "effectiveness_score": effectiveness,
            "improvement_detected": improvement_score > 0,
            "engagement_improved": engagement_change > 0,
            "quick_resolution": time_to_next_success and time_to_next_success < 300,
            "evaluation_timestamp": datetime.now()
        }
        
        logger.info(f"Feedback effectiveness: {effectiveness:.2f} for student {feedback.student_id}")
        
        return evaluation
    
    async def adaptive_feedback_adjustment(
        self,
        student_id: str,
        feedback_history: List[Dict[str, Any]],
        profile: StudentLearningProfile
    ) -> Dict[str, Any]:
        """Ajustar estrategia de feedback basado en efectividad histórica"""
        
        if len(feedback_history) < 5:
            return {"adjustment": "insufficient_data"}
        
        # Analizar patrones de efectividad
        recent_effectiveness = [f.get("effectiveness_score", 0.5) for f in feedback_history[-10:]]
        avg_effectiveness = np.mean(recent_effectiveness)
        
        adjustments = {
            "current_effectiveness": avg_effectiveness,
            "recommended_adjustments": []
        }
        
        if avg_effectiveness < 0.4:
            adjustments["recommended_adjustments"].extend([
                "increase_hint_frequency",
                "simplify_language",
                "add_more_encouragement"
            ])
        elif avg_effectiveness > 0.8:
            adjustments["recommended_adjustments"].extend([
                "increase_challenge_level",
                "reduce_hint_frequency", 
                "focus_on_celebration"
            ])
        
        return adjustments