"""
Teaching Style Adaptation Service - Adaptación Personalizada de Estilo de Enseñanza
Adaptive Learning Ecosystem - EbroValley Digital
ToñoAdPAOS & Claudio Supreme

Adapta la presentación de contenidos según el estilo de aprendizaje detectado:
- Visual: Más recursos visuales, diagramas, infografías
- Auditivo: Audios, explicaciones orales, podcasts
- Kinestésico: Prácticas interactivas, simulaciones
- Lectura/Escritura: Textos, resúmenes, ejercicios escritos
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import numpy as np
import random

from ..models.learning_models import (
    StudentLearningProfile, LearningStyle, ContentType, DifficultyLevel,
    LearningPathNode, AdaptationDecision
)

logger = logging.getLogger(__name__)

class ContentAdaptation:
    """Clase para representar adaptaciones de contenido"""
    def __init__(
        self,
        original_content_id: str,
        adapted_content_type: ContentType,
        adaptation_reason: str,
        adaptation_confidence: float,
        estimated_effectiveness: float
    ):
        self.original_content_id = original_content_id
        self.adapted_content_type = adapted_content_type
        self.adaptation_reason = adaptation_reason
        self.adaptation_confidence = adaptation_confidence
        self.estimated_effectiveness = estimated_effectiveness

class TeachingStyleAdaptationService:
    """
    Servicio para adaptar estilo de enseñanza según perfil del estudiante
    Implementa personalización dinámica de contenido por estilo de aprendizaje
    """
    
    def __init__(self):
        self.style_preferences = self._initialize_style_preferences()
        self.content_transformation_rules = self._initialize_transformation_rules()
        self.effectiveness_metrics = {}  # Cache de efectividad por estudiante
        
    def _initialize_style_preferences(self) -> Dict[LearningStyle, Dict[str, Any]]:
        """Inicializar preferencias y características por estilo de aprendizaje"""
        return {
            LearningStyle.VISUAL: {
                "preferred_content_types": [
                    ContentType.VIDEO, ContentType.INFOGRAPHIC, 
                    ContentType.INTERACTIVE, ContentType.SIMULATION
                ],
                "optimal_content_ratio": {
                    ContentType.VIDEO: 0.4,
                    ContentType.INFOGRAPHIC: 0.25,
                    ContentType.INTERACTIVE: 0.2,
                    ContentType.TEXT: 0.15
                },
                "presentation_features": [
                    "high_visual_density", "color_coding", "diagrams",
                    "charts_graphs", "mind_maps", "flowcharts", "animations"
                ],
                "content_characteristics": {
                    "use_images": True,
                    "use_colors": True,
                    "use_diagrams": True,
                    "text_to_image_ratio": 0.3,
                    "preferred_duration_minutes": 15
                },
                "cognitive_strengths": [
                    "spatial_processing", "pattern_recognition", 
                    "visual_memory", "color_association"
                ]
            },
            
            LearningStyle.AUDITORY: {
                "preferred_content_types": [
                    ContentType.AUDIO, ContentType.VIDEO,
                    ContentType.INTERACTIVE, ContentType.TEXT
                ],
                "optimal_content_ratio": {
                    ContentType.AUDIO: 0.35,
                    ContentType.VIDEO: 0.3,
                    ContentType.INTERACTIVE: 0.2,
                    ContentType.TEXT: 0.15
                },
                "presentation_features": [
                    "clear_narration", "background_music", "sound_effects",
                    "verbal_explanations", "discussions", "podcasts"
                ],
                "content_characteristics": {
                    "use_audio": True,
                    "use_narration": True,
                    "use_music": True,
                    "speech_to_text_ratio": 0.7,
                    "preferred_duration_minutes": 20
                },
                "cognitive_strengths": [
                    "auditory_processing", "verbal_memory",
                    "rhythm_pattern", "sequential_processing"
                ]
            },
            
            LearningStyle.KINESTHETIC: {
                "preferred_content_types": [
                    ContentType.INTERACTIVE, ContentType.SIMULATION,
                    ContentType.PRACTICE, ContentType.VIDEO
                ],
                "optimal_content_ratio": {
                    ContentType.INTERACTIVE: 0.4,
                    ContentType.SIMULATION: 0.25,
                    ContentType.PRACTICE: 0.2,
                    ContentType.VIDEO: 0.15
                },
                "presentation_features": [
                    "hands_on_activities", "drag_drop", "simulations",
                    "virtual_labs", "real_world_applications", "experiments"
                ],
                "content_characteristics": {
                    "use_interaction": True,
                    "use_movement": True,
                    "use_manipulation": True,
                    "interaction_frequency": "high",
                    "preferred_duration_minutes": 10  # Sesiones más cortas y activas
                },
                "cognitive_strengths": [
                    "motor_skills", "spatial_awareness",
                    "experiential_learning", "muscle_memory"
                ]
            },
            
            LearningStyle.READING_WRITING: {
                "preferred_content_types": [
                    ContentType.TEXT, ContentType.QUIZ,
                    ContentType.INTERACTIVE, ContentType.VIDEO
                ],
                "optimal_content_ratio": {
                    ContentType.TEXT: 0.45,
                    ContentType.QUIZ: 0.25,
                    ContentType.INTERACTIVE: 0.2,
                    ContentType.VIDEO: 0.1
                },
                "presentation_features": [
                    "detailed_text", "bullet_points", "summaries",
                    "glossaries", "note_taking", "written_exercises"
                ],
                "content_characteristics": {
                    "use_text": True,
                    "use_lists": True,
                    "use_definitions": True,
                    "text_density": "high",
                    "preferred_duration_minutes": 25
                },
                "cognitive_strengths": [
                    "verbal_processing", "written_comprehension",
                    "analytical_thinking", "detail_orientation"
                ]
            },
            
            LearningStyle.MULTIMODAL: {
                "preferred_content_types": [
                    ContentType.INTERACTIVE, ContentType.VIDEO,
                    ContentType.TEXT, ContentType.AUDIO
                ],
                "optimal_content_ratio": {
                    ContentType.INTERACTIVE: 0.3,
                    ContentType.VIDEO: 0.25,
                    ContentType.TEXT: 0.25,
                    ContentType.AUDIO: 0.2
                },
                "presentation_features": [
                    "varied_formats", "multiple_representations",
                    "choice_of_modality", "adaptive_switching"
                ],
                "content_characteristics": {
                    "use_variety": True,
                    "adaptive_format": True,
                    "multiple_modalities": True,
                    "format_flexibility": "high",
                    "preferred_duration_minutes": 18
                },
                "cognitive_strengths": [
                    "flexible_processing", "pattern_integration",
                    "adaptive_learning", "cross_modal_transfer"
                ]
            }
        }
    
    def _initialize_transformation_rules(self) -> Dict[str, Dict[str, Any]]:
        """Reglas para transformar contenido según estilo de aprendizaje"""
        return {
            "text_to_visual": {
                "triggers": ["complex_concepts", "abstract_ideas", "statistical_data"],
                "transformations": [
                    {"from": "paragraph", "to": "infographic"},
                    {"from": "list", "to": "diagram"},
                    {"from": "numbers", "to": "chart"},
                    {"from": "process", "to": "flowchart"}
                ],
                "effectiveness_boost": 0.3
            },
            
            "text_to_audio": {
                "triggers": ["definitions", "explanations", "stories"],
                "transformations": [
                    {"from": "text", "to": "narration"},
                    {"from": "dialogue", "to": "conversation"},
                    {"from": "poem", "to": "recitation"},
                    {"from": "instructions", "to": "guided_audio"}
                ],
                "effectiveness_boost": 0.25
            },
            
            "static_to_interactive": {
                "triggers": ["procedures", "formulas", "simulations"],
                "transformations": [
                    {"from": "static_image", "to": "interactive_diagram"},
                    {"from": "text_exercise", "to": "drag_drop"},
                    {"from": "multiple_choice", "to": "interactive_quiz"},
                    {"from": "example", "to": "hands_on_practice"}
                ],
                "effectiveness_boost": 0.4
            },
            
            "complex_to_readable": {
                "triggers": ["technical_content", "academic_papers", "research"],
                "transformations": [
                    {"from": "complex_text", "to": "simplified_summary"},
                    {"from": "jargon", "to": "plain_language"},
                    {"from": "long_paragraph", "to": "bullet_points"},
                    {"from": "abstract", "to": "concrete_examples"}
                ],
                "effectiveness_boost": 0.2
            }
        }
    
    async def adapt_content_for_student(
        self,
        original_content: LearningPathNode,
        profile: StudentLearningProfile,
        performance_history: List[Dict[str, Any]] = None
    ) -> Tuple[LearningPathNode, List[ContentAdaptation]]:
        """Adaptar contenido específico para el estilo de aprendizaje del estudiante"""
        
        logger.info(f"Adapting content {original_content.id} for student {profile.student_id}")
        
        # 1. Analizar estilo de aprendizaje y preferencias
        style_prefs = self.style_preferences[profile.learning_style]
        
        # 2. Evaluar si el contenido actual es óptimo
        current_effectiveness = self._evaluate_content_effectiveness(
            original_content, profile, performance_history
        )
        
        # 3. Determinar si necesita adaptación
        adaptations_needed = self._identify_needed_adaptations(
            original_content, style_prefs, current_effectiveness
        )
        
        if not adaptations_needed:
            return original_content, []
        
        # 4. Aplicar adaptaciones
        adapted_content = await self._apply_adaptations(
            original_content, adaptations_needed, style_prefs
        )
        
        # 5. Generar registro de adaptaciones
        adaptation_records = self._create_adaptation_records(
            original_content, adaptations_needed, profile
        )
        
        logger.info(f"Applied {len(adaptation_records)} adaptations for {profile.learning_style.value} learner")
        
        return adapted_content, adaptation_records
    
    def _evaluate_content_effectiveness(
        self,
        content: LearningPathNode,
        profile: StudentLearningProfile,
        performance_history: List[Dict[str, Any]] = None
    ) -> float:
        """Evaluar efectividad actual del contenido para el estudiante"""
        
        style_prefs = self.style_preferences[profile.learning_style]
        base_effectiveness = 0.5
        
        # Factor 1: Compatibilidad con tipo de contenido preferido
        preferred_types = style_prefs["preferred_content_types"]
        if content.content_type in preferred_types:
            type_index = preferred_types.index(content.content_type)
            type_effectiveness = 1.0 - (type_index * 0.15)  # Preferencia descendente
            base_effectiveness += type_effectiveness * 0.4
        
        # Factor 2: Duración óptima
        preferred_duration = style_prefs["content_characteristics"]["preferred_duration_minutes"]
        duration_ratio = min(content.estimated_duration_minutes / preferred_duration, 2.0)
        duration_effectiveness = 1.0 - abs(1.0 - duration_ratio) * 0.5
        base_effectiveness += duration_effectiveness * 0.2
        
        # Factor 3: Historial de rendimiento (si disponible)
        if performance_history:
            recent_performance = np.mean([
                p.get("completion_percentage", 70) for p in performance_history[-5:]
            ]) / 100
            base_effectiveness += recent_performance * 0.3
        
        # Factor 4: Confianza en el perfil de estilo de aprendizaje
        base_effectiveness += profile.learning_style_confidence * 0.1
        
        return min(1.0, base_effectiveness)
    
    def _identify_needed_adaptations(
        self,
        content: LearningPathNode,
        style_prefs: Dict[str, Any],
        current_effectiveness: float
    ) -> List[Dict[str, Any]]:
        """Identificar qué adaptaciones son necesarias"""
        
        adaptations = []
        
        # Si la efectividad es alta, no necesita muchas adaptaciones
        if current_effectiveness > 0.8:
            return adaptations
        
        # Adaptación 1: Tipo de contenido
        preferred_types = style_prefs["preferred_content_types"]
        if content.content_type not in preferred_types[:2]:  # Top 2 preferidos
            optimal_type = preferred_types[0]
            adaptations.append({
                "type": "content_type_change",
                "from": content.content_type,
                "to": optimal_type,
                "priority": "high",
                "reason": f"Cambiar a tipo preferido para {style_prefs}",
                "estimated_improvement": 0.3
            })
        
        # Adaptación 2: Duración
        preferred_duration = style_prefs["content_characteristics"]["preferred_duration_minutes"]
        if content.estimated_duration_minutes > preferred_duration * 1.5:
            adaptations.append({
                "type": "duration_adjustment",
                "from": content.estimated_duration_minutes,
                "to": preferred_duration,
                "priority": "medium",
                "reason": "Ajustar a duración óptima de atención",
                "estimated_improvement": 0.2
            })
        
        # Adaptación 3: Características de presentación
        content_chars = style_prefs["content_characteristics"]
        missing_features = []
        
        if content_chars.get("use_images", False) and content.content_type == ContentType.TEXT:
            missing_features.append("visual_enhancement")
        
        if content_chars.get("use_interaction", False) and content.content_type != ContentType.INTERACTIVE:
            missing_features.append("interactivity_boost")
        
        if missing_features:
            adaptations.append({
                "type": "feature_enhancement",
                "features": missing_features,
                "priority": "medium",
                "reason": "Añadir características preferidas del estilo",
                "estimated_improvement": 0.15
            })
        
        return adaptations
    
    async def _apply_adaptations(
        self,
        original_content: LearningPathNode,
        adaptations: List[Dict[str, Any]],
        style_prefs: Dict[str, Any]
    ) -> LearningPathNode:
        """Aplicar adaptaciones al contenido"""
        
        adapted_content = LearningPathNode(
            id=f"{original_content.id}_adapted_{int(datetime.now().timestamp())}",
            title=original_content.title,
            description=original_content.description,
            content_type=original_content.content_type,
            difficulty_level=original_content.difficulty_level,
            estimated_duration_minutes=original_content.estimated_duration_minutes,
            prerequisites=original_content.prerequisites,
            learning_objectives=original_content.learning_objectives,
            content_url=original_content.content_url,
            is_adaptive=True
        )
        
        for adaptation in adaptations:
            if adaptation["type"] == "content_type_change":
                adapted_content.content_type = adaptation["to"]
                adapted_content.content_url = self._generate_adapted_url(
                    original_content.content_url, adaptation["to"]
                )
            
            elif adaptation["type"] == "duration_adjustment":
                adapted_content.estimated_duration_minutes = adaptation["to"]
                # Ajustar descripción para reflejar formato más conciso
                if adaptation["to"] < original_content.estimated_duration_minutes:
                    adapted_content.description += " (Versión concisa)"
            
            elif adaptation["type"] == "feature_enhancement":
                # Actualizar URL para incluir características mejoradas
                features = adaptation["features"]
                adapted_content.content_url = self._enhance_content_url(
                    adapted_content.content_url, features
                )
                adapted_content.description += f" (Mejorado: {', '.join(features)})"
        
        # Añadir metadatos de adaptación
        adapted_content.learning_objectives.append(
            f"Optimizado para aprendizaje {style_prefs}"
        )
        
        return adapted_content
    
    def _generate_adapted_url(self, original_url: str, new_content_type: ContentType) -> str:
        """Generar URL para contenido adaptado"""
        
        base_url = original_url.split('/')[-1] if original_url else "content"
        
        type_mapping = {
            ContentType.VIDEO: "video",
            ContentType.AUDIO: "audio", 
            ContentType.INTERACTIVE: "interactive",
            ContentType.INFOGRAPHIC: "infographic",
            ContentType.SIMULATION: "simulation",
            ContentType.TEXT: "text",
            ContentType.QUIZ: "quiz",
            ContentType.PRACTICE: "practice"
        }
        
        type_path = type_mapping.get(new_content_type, "adaptive")
        return f"/content/adapted/{type_path}/{base_url}"
    
    def _enhance_content_url(self, base_url: str, features: List[str]) -> str:
        """Añadir parámetros de mejora a la URL"""
        
        feature_params = "&".join([f"enhance_{feature}=true" for feature in features])
        separator = "&" if "?" in base_url else "?"
        
        return f"{base_url}{separator}{feature_params}"
    
    def _create_adaptation_records(
        self,
        original_content: LearningPathNode,
        adaptations: List[Dict[str, Any]],
        profile: StudentLearningProfile
    ) -> List[ContentAdaptation]:
        """Crear registros de las adaptaciones realizadas"""
        
        records = []
        
        for adaptation in adaptations:
            
            confidence = self._calculate_adaptation_confidence(adaptation, profile)
            effectiveness = adaptation.get("estimated_improvement", 0.2)
            
            if adaptation["type"] == "content_type_change":
                record = ContentAdaptation(
                    original_content_id=original_content.id,
                    adapted_content_type=adaptation["to"],
                    adaptation_reason=adaptation["reason"],
                    adaptation_confidence=confidence,
                    estimated_effectiveness=effectiveness
                )
                records.append(record)
        
        return records
    
    def _calculate_adaptation_confidence(
        self,
        adaptation: Dict[str, Any],
        profile: StudentLearningProfile
    ) -> float:
        """Calcular confianza en la adaptación"""
        
        base_confidence = 0.6
        
        # Mayor confianza si el perfil está bien establecido
        base_confidence += profile.learning_style_confidence * 0.3
        
        # Mayor confianza para adaptaciones de alta prioridad
        if adaptation.get("priority") == "high":
            base_confidence += 0.15
        elif adaptation.get("priority") == "medium":
            base_confidence += 0.1
        
        # Mayor confianza si hay mejora estimada alta
        estimated_improvement = adaptation.get("estimated_improvement", 0)
        if estimated_improvement > 0.25:
            base_confidence += 0.1
        
        return min(1.0, base_confidence)
    
    async def generate_multimodal_content(
        self,
        base_content: LearningPathNode,
        target_styles: List[LearningStyle],
        profile: StudentLearningProfile
    ) -> Dict[LearningStyle, LearningPathNode]:
        """Generar versiones del contenido para múltiples estilos de aprendizaje"""
        
        logger.info(f"Generating multimodal content for {len(target_styles)} styles")
        
        multimodal_content = {}
        
        for style in target_styles:
            # Crear perfil temporal para cada estilo
            temp_profile = StudentLearningProfile(
                student_id=profile.student_id,
                learning_style=style,
                learning_style_confidence=0.8,
                preferred_pace=profile.preferred_pace,
                current_difficulty_level=profile.current_difficulty_level,
                interests=profile.interests,
                strengths=profile.strengths,
                weaknesses=profile.weaknesses,
                attention_span_minutes=profile.attention_span_minutes,
                preferred_session_length=profile.preferred_session_length,
                optimal_study_times=profile.optimal_study_times,
                motivation_factors=profile.motivation_factors,
                created_at=profile.created_at,
                updated_at=datetime.now()
            )
            
            # Adaptar contenido para este estilo específico
            adapted_content, _ = await self.adapt_content_for_student(
                base_content, temp_profile
            )
            
            multimodal_content[style] = adapted_content
        
        return multimodal_content
    
    async def optimize_content_sequence(
        self,
        content_sequence: List[LearningPathNode],
        profile: StudentLearningProfile
    ) -> List[LearningPathNode]:
        """Optimizar secuencia de contenido según estilo de aprendizaje"""
        
        style_prefs = self.style_preferences[profile.learning_style]
        optimal_ratio = style_prefs["optimal_content_ratio"]
        
        # Analizar distribución actual
        current_distribution = self._analyze_content_distribution(content_sequence)
        
        # Reordenar para optimizar según preferencias
        optimized_sequence = self._reorder_content_sequence(
            content_sequence, optimal_ratio, current_distribution
        )
        
        # Adaptar contenido individual si es necesario
        final_sequence = []
        for content in optimized_sequence:
            adapted_content, _ = await self.adapt_content_for_student(content, profile)
            final_sequence.append(adapted_content)
        
        return final_sequence
    
    def _analyze_content_distribution(
        self, 
        content_sequence: List[LearningPathNode]
    ) -> Dict[ContentType, float]:
        """Analizar distribución actual de tipos de contenido"""
        
        type_counts = {}
        total_content = len(content_sequence)
        
        for content in content_sequence:
            content_type = content.content_type
            type_counts[content_type] = type_counts.get(content_type, 0) + 1
        
        # Convertir a ratios
        return {
            content_type: count / total_content 
            for content_type, count in type_counts.items()
        }
    
    def _reorder_content_sequence(
        self,
        content_sequence: List[LearningPathNode],
        optimal_ratio: Dict[ContentType, float],
        current_distribution: Dict[ContentType, float]
    ) -> List[LearningPathNode]:
        """Reordenar secuencia para acercarse al ratio óptimo"""
        
        # Por ahora, mantener orden original pero priorizar tipos preferidos
        # En implementación completa, se usaría algoritmo más sofisticado
        
        preferred_order = sorted(
            optimal_ratio.keys(), 
            key=lambda x: optimal_ratio[x], 
            reverse=True
        )
        
        reordered = []
        remaining_content = content_sequence.copy()
        
        # Priorizar contenido de tipos preferidos
        for content_type in preferred_order:
            matching_content = [
                c for c in remaining_content 
                if c.content_type == content_type
            ]
            reordered.extend(matching_content)
            
            for content in matching_content:
                remaining_content.remove(content)
        
        # Añadir contenido restante
        reordered.extend(remaining_content)
        
        return reordered