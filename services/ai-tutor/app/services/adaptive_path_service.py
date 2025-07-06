"""
Adaptive Learning Path Service - Generación de Rutas Personalizadas
Adaptive Learning Ecosystem - EbroValley Digital
ToñoAdPAOS & Claudio Supreme
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import random

from ..models.learning_models import (
    StudentLearningProfile, LearningPathNode, AdaptiveLearningPath,
    ContentType, DifficultyLevel, LearningStyle, LearningPace,
    AdaptationDecision
)

logger = logging.getLogger(__name__)

class AdaptivePathService:
    """
    Servicio para generar rutas de aprendizaje adaptativas
    basado en el perfil del estudiante y algoritmos ML
    """
    
    def __init__(self):
        self.content_database = self._initialize_content_database()
        self.learning_objectives_map = self._initialize_learning_objectives()
        
    def _initialize_content_database(self) -> List[Dict[str, Any]]:
        """Inicializar base de datos de contenido educativo"""
        return [
            {
                "id": "intro_ai_001",
                "title": "¿Qué es la Inteligencia Artificial?",
                "description": "Conceptos fundamentales de IA",
                "content_type": ContentType.VIDEO,
                "difficulty": DifficultyLevel.BEGINNER,
                "duration_minutes": 15,
                "learning_styles": [LearningStyle.VISUAL, LearningStyle.AUDITORY],
                "prerequisites": [],
                "topics": ["conceptos_basicos", "historia_ia", "aplicaciones"],
                "engagement_score": 0.85
            },
            {
                "id": "intro_ai_002", 
                "title": "Fundamentos de Machine Learning",
                "description": "Introducción práctica al aprendizaje automático",
                "content_type": ContentType.INTERACTIVE,
                "difficulty": DifficultyLevel.BEGINNER,
                "duration_minutes": 25,
                "learning_styles": [LearningStyle.KINESTHETIC, LearningStyle.VISUAL],
                "prerequisites": ["intro_ai_001"],
                "topics": ["machine_learning", "algoritmos", "datos"],
                "engagement_score": 0.90
            },
            {
                "id": "intro_ai_003",
                "title": "Redes Neuronales Básicas",
                "description": "Conceptos teóricos de redes neuronales",
                "content_type": ContentType.TEXT,
                "difficulty": DifficultyLevel.INTERMEDIATE,
                "duration_minutes": 30,
                "learning_styles": [LearningStyle.READING_WRITING],
                "prerequisites": ["intro_ai_002"],
                "topics": ["redes_neuronales", "deep_learning", "perceptron"],
                "engagement_score": 0.70
            },
            {
                "id": "intro_ai_004",
                "title": "Práctica: Crear tu Primera IA",
                "description": "Ejercicio práctico de implementación",
                "content_type": ContentType.PRACTICE,
                "difficulty": DifficultyLevel.INTERMEDIATE,
                "duration_minutes": 45,
                "learning_styles": [LearningStyle.KINESTHETIC],
                "prerequisites": ["intro_ai_003"],
                "topics": ["programacion", "python", "tensorflow"],
                "engagement_score": 0.95
            },
            {
                "id": "intro_ai_005",
                "title": "Evaluación Adaptativa - IA Básica",
                "description": "Quiz personalizado sobre conceptos fundamentales",
                "content_type": ContentType.QUIZ,
                "difficulty": DifficultyLevel.BEGINNER,
                "duration_minutes": 20,
                "learning_styles": [LearningStyle.VISUAL, LearningStyle.READING_WRITING],
                "prerequisites": ["intro_ai_001", "intro_ai_002"],
                "topics": ["evaluacion", "conceptos_basicos"],
                "engagement_score": 0.80
            }
        ]
    
    def _initialize_learning_objectives(self) -> Dict[str, List[str]]:
        """Mapear objetivos de aprendizaje por temas"""
        return {
            "conceptos_basicos": [
                "Definir qué es la inteligencia artificial",
                "Identificar aplicaciones de IA en la vida cotidiana",
                "Distinguir entre IA débil y fuerte"
            ],
            "machine_learning": [
                "Comprender el concepto de aprendizaje automático",
                "Identificar tipos de aprendizaje supervisado y no supervisado",
                "Aplicar algoritmos básicos de ML"
            ],
            "redes_neuronales": [
                "Entender la estructura de una red neuronal",
                "Explicar el proceso de entrenamiento",
                "Implementar un perceptrón simple"
            ]
        }
    
    async def generate_adaptive_path(
        self, 
        profile: StudentLearningProfile,
        course_id: str,
        learning_goals: List[str] = None
    ) -> AdaptiveLearningPath:
        """Generar ruta de aprendizaje adaptativa personalizada"""
        
        logger.info(f"Generating adaptive path for student {profile.student_id}")
        
        # 1. Filtrar contenido por estilo de aprendizaje
        suitable_content = self._filter_content_by_learning_style(
            profile.learning_style, profile.current_difficulty_level
        )
        
        # 2. Secuenciar contenido según prerequisitos
        sequenced_content = self._sequence_content_by_prerequisites(suitable_content)
        
        # 3. Adaptar duración según attention span
        adapted_content = self._adapt_content_duration(
            sequenced_content, profile.attention_span_minutes
        )
        
        # 4. Personalizar según intereses y motivación
        personalized_content = self._personalize_by_interests(
            adapted_content, profile.interests, profile.motivation_factors
        )
        
        # 5. Crear nodos de la ruta
        learning_nodes = self._create_learning_nodes(personalized_content)
        
        # 6. Añadir puntos de evaluación adaptativa
        final_nodes = self._add_adaptive_assessments(
            learning_nodes, profile.current_difficulty_level
        )
        
        path = AdaptiveLearningPath(
            student_id=profile.student_id,
            course_id=course_id,
            path_id=f"path_{profile.student_id}_{course_id}_{int(datetime.now().timestamp())}",
            nodes=final_nodes,
            current_node_index=0,
            completion_percentage=0.0,
            created_at=datetime.now(),
            last_updated=datetime.now(),
            adaptation_reasons=[
                f"Optimizado para estilo {profile.learning_style.value}",
                f"Adaptado a ritmo {profile.preferred_pace.value}",
                f"Duración de sesión {profile.attention_span_minutes} minutos",
                f"Nivel {profile.current_difficulty_level.value}"
            ]
        )
        
        logger.info(f"Generated path with {len(final_nodes)} nodes for {profile.learning_style.value} learner")
        return path
    
    def _filter_content_by_learning_style(
        self, 
        learning_style: LearningStyle,
        difficulty: DifficultyLevel
    ) -> List[Dict[str, Any]]:
        """Filtrar contenido por estilo de aprendizaje y dificultad"""
        
        filtered_content = []
        
        for content in self.content_database:
            # Filtrar por nivel de dificultad
            content_difficulty_order = {
                DifficultyLevel.BEGINNER: 0,
                DifficultyLevel.INTERMEDIATE: 1,
                DifficultyLevel.ADVANCED: 2,
                DifficultyLevel.EXPERT: 3
            }
            
            student_level = content_difficulty_order.get(difficulty, 1)
            content_level = content_difficulty_order.get(content["difficulty"], 1)
            
            # Incluir contenido del nivel del estudiante o un nivel superior máximo
            if content_level <= student_level + 1:
                # Filtrar por estilo de aprendizaje
                if (learning_style == LearningStyle.MULTIMODAL or 
                    learning_style in content["learning_styles"]):
                    
                    # Calcular score de compatibilidad
                    compatibility_score = self._calculate_content_compatibility(
                        content, learning_style, difficulty
                    )
                    content["compatibility_score"] = compatibility_score
                    filtered_content.append(content)
        
        # Ordenar por compatibilidad descendente
        filtered_content.sort(key=lambda x: x["compatibility_score"], reverse=True)
        
        return filtered_content
    
    def _calculate_content_compatibility(
        self,
        content: Dict[str, Any],
        learning_style: LearningStyle,
        difficulty: DifficultyLevel
    ) -> float:
        """Calcular compatibilidad del contenido con el perfil del estudiante"""
        
        score = content.get("engagement_score", 0.5)
        
        # Bonus por match de estilo de aprendizaje
        if learning_style in content["learning_styles"]:
            score += 0.2
        elif learning_style == LearningStyle.MULTIMODAL:
            score += 0.1
        
        # Bonus por tipo de contenido preferido según estilo
        content_type = content["content_type"]
        style_preferences = {
            LearningStyle.VISUAL: [ContentType.VIDEO, ContentType.INFOGRAPHIC],
            LearningStyle.AUDITORY: [ContentType.AUDIO, ContentType.VIDEO],
            LearningStyle.KINESTHETIC: [ContentType.INTERACTIVE, ContentType.PRACTICE],
            LearningStyle.READING_WRITING: [ContentType.TEXT, ContentType.QUIZ]
        }
        
        if content_type in style_preferences.get(learning_style, []):
            score += 0.15
        
        return min(score, 1.0)
    
    def _sequence_content_by_prerequisites(
        self, 
        content_list: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Secuenciar contenido respetando prerequisitos"""
        
        sequenced = []
        remaining = content_list.copy()
        
        # Algoritmo de ordenamiento topológico
        while remaining:
            # Buscar contenido sin prerequisitos pendientes
            ready_content = []
            for content in remaining:
                prerequisites = content.get("prerequisites", [])
                completed_ids = [item["id"] for item in sequenced]
                
                if all(prereq in completed_ids for prereq in prerequisites):
                    ready_content.append(content)
            
            if not ready_content:
                # Si no hay contenido listo, agregar el de mayor compatibilidad
                ready_content = [max(remaining, key=lambda x: x["compatibility_score"])]
            
            # Ordenar por compatibilidad y tomar el mejor
            ready_content.sort(key=lambda x: x["compatibility_score"], reverse=True)
            selected = ready_content[0]
            
            sequenced.append(selected)
            remaining.remove(selected)
        
        return sequenced
    
    def _adapt_content_duration(
        self,
        content_list: List[Dict[str, Any]],
        attention_span_minutes: int
    ) -> List[Dict[str, Any]]:
        """Adaptar duración del contenido al attention span del estudiante"""
        
        adapted_content = []
        optimal_session_length = max(10, int(attention_span_minutes * 0.8))
        
        for content in content_list:
            duration = content["duration_minutes"]
            
            if duration <= optimal_session_length:
                # Contenido ya adecuado
                adapted_content.append(content)
            else:
                # Dividir contenido largo en segmentos
                segments_needed = int(np.ceil(duration / optimal_session_length))
                segment_duration = duration // segments_needed
                
                for i in range(segments_needed):
                    segment = content.copy()
                    segment["id"] = f"{content['id']}_segment_{i+1}"
                    segment["title"] = f"{content['title']} - Parte {i+1}"
                    segment["duration_minutes"] = segment_duration
                    segment["is_segment"] = True
                    segment["original_content_id"] = content["id"]
                    adapted_content.append(segment)
        
        return adapted_content
    
    def _personalize_by_interests(
        self,
        content_list: List[Dict[str, Any]],
        interests: List[str],
        motivation_factors: List[str]
    ) -> List[Dict[str, Any]]:
        """Personalizar contenido según intereses y factores de motivación"""
        
        personalized_content = []
        
        for content in content_list:
            # Calcular relevancia por intereses
            content_topics = content.get("topics", [])
            interest_overlap = len(set(content_topics) & set(interests))
            
            if interest_overlap > 0:
                content["interest_boost"] = interest_overlap * 0.1
            else:
                content["interest_boost"] = 0
            
            # Ajustar por factores de motivación
            if "real_world_relevance" in motivation_factors:
                if content["content_type"] in [ContentType.PRACTICE, ContentType.SIMULATION]:
                    content["motivation_boost"] = 0.15
                else:
                    content["motivation_boost"] = 0
            elif "achievement_recognition" in motivation_factors:
                if content["content_type"] == ContentType.QUIZ:
                    content["motivation_boost"] = 0.2
                else:
                    content["motivation_boost"] = 0.05
            else:
                content["motivation_boost"] = 0
            
            # Actualizar compatibility score
            content["compatibility_score"] += content["interest_boost"] + content["motivation_boost"]
            personalized_content.append(content)
        
        return personalized_content
    
    def _create_learning_nodes(
        self, 
        content_list: List[Dict[str, Any]]
    ) -> List[LearningPathNode]:
        """Crear nodos de ruta de aprendizaje"""
        
        nodes = []
        
        for i, content in enumerate(content_list):
            # Mapear objetivos de aprendizaje
            topics = content.get("topics", [])
            learning_objectives = []
            for topic in topics:
                objectives = self.learning_objectives_map.get(topic, [])
                learning_objectives.extend(objectives)
            
            node = LearningPathNode(
                id=content["id"],
                title=content["title"],
                description=content["description"],
                content_type=content["content_type"],
                difficulty_level=content["difficulty"],
                estimated_duration_minutes=content["duration_minutes"],
                prerequisites=content.get("prerequisites", []),
                learning_objectives=learning_objectives[:3],  # Máximo 3 objetivos
                content_url=f"/content/{content['id']}",
                is_adaptive=True
            )
            
            nodes.append(node)
        
        return nodes
    
    def _add_adaptive_assessments(
        self,
        nodes: List[LearningPathNode],
        difficulty: DifficultyLevel
    ) -> List[LearningPathNode]:
        """Añadir evaluaciones adaptativas estratégicamente"""
        
        enhanced_nodes = nodes.copy()
        
        # Agregar quiz cada 3-4 nodos de contenido
        content_nodes_count = 0
        insert_positions = []
        
        for i, node in enumerate(nodes):
            if node.content_type != ContentType.QUIZ:
                content_nodes_count += 1
                if content_nodes_count % 3 == 0:  # Cada 3 nodos de contenido
                    insert_positions.append(i + 1)
        
        # Insertar quizzes adaptativos
        offset = 0
        for position in insert_positions:
            if position + offset < len(enhanced_nodes):
                # Crear quiz adaptativo
                quiz_node = LearningPathNode(
                    id=f"adaptive_quiz_{position}_{int(datetime.now().timestamp())}",
                    title="Evaluación Adaptativa",
                    description="Quiz personalizado para verificar comprensión",
                    content_type=ContentType.QUIZ,
                    difficulty_level=difficulty,
                    estimated_duration_minutes=10,
                    prerequisites=[],
                    learning_objectives=["Verificar comprensión de conceptos anteriores"],
                    content_url="/adaptive-quiz",
                    is_adaptive=True
                )
                
                enhanced_nodes.insert(position + offset, quiz_node)
                offset += 1
        
        return enhanced_nodes
    
    async def adapt_path_realtime(
        self,
        current_path: AdaptiveLearningPath,
        performance_data: Dict[str, Any],
        profile: StudentLearningProfile
    ) -> tuple[AdaptiveLearningPath, List[AdaptationDecision]]:
        """Adaptar ruta en tiempo real basado en rendimiento"""
        
        logger.info(f"Adapting path in real-time for student {profile.student_id}")
        
        decisions = []
        adapted_path = current_path.copy()
        
        # Analizar rendimiento reciente
        performance_score = performance_data.get("average_score", 0.7)
        completion_rate = performance_data.get("completion_rate", 0.8)
        time_efficiency = performance_data.get("time_efficiency", 1.0)
        
        # Decisión 1: Ajustar dificultad
        if performance_score > 0.85 and completion_rate > 0.9:
            # Estudiante está dominando el contenido
            decision = await self._increase_difficulty(adapted_path, profile)
            if decision:
                decisions.append(decision)
        elif performance_score < 0.6 or completion_rate < 0.5:
            # Estudiante tiene dificultades
            decision = await self._decrease_difficulty(adapted_path, profile)
            if decision:
                decisions.append(decision)
        
        # Decisión 2: Ajustar ritmo
        if time_efficiency < 0.7:
            # Estudiante es más lento que lo esperado
            decision = await self._adjust_pace_slower(adapted_path, profile)
            if decision:
                decisions.append(decision)
        elif time_efficiency > 1.3:
            # Estudiante es más rápido que lo esperado
            decision = await self._adjust_pace_faster(adapted_path, profile)
            if decision:
                decisions.append(decision)
        
        # Decisión 3: Cambiar tipo de contenido si hay problemas de engagement
        engagement_score = performance_data.get("engagement_score", 0.7)
        if engagement_score < 0.5:
            decision = await self._switch_content_type(adapted_path, profile)
            if decision:
                decisions.append(decision)
        
        adapted_path.last_updated = datetime.now()
        adapted_path.adaptation_reasons.extend([d.reason for d in decisions])
        
        return adapted_path, decisions
    
    async def _increase_difficulty(
        self, 
        path: AdaptiveLearningPath, 
        profile: StudentLearningProfile
    ) -> Optional[AdaptationDecision]:
        """Incrementar dificultad del contenido restante"""
        
        current_index = path.current_node_index
        remaining_nodes = path.nodes[current_index:]
        
        if not remaining_nodes:
            return None
        
        # Buscar contenido de mayor dificultad
        advanced_content = [
            c for c in self.content_database 
            if c["difficulty"] == DifficultyLevel.ADVANCED
        ]
        
        if advanced_content:
            # Reemplazar próximo nodo con contenido más avanzado
            next_node = path.nodes[current_index] if current_index < len(path.nodes) else None
            if next_node:
                decision = AdaptationDecision(
                    student_id=profile.student_id,
                    decision_type="difficulty_increase",
                    old_value=next_node.difficulty_level.value,
                    new_value=DifficultyLevel.ADVANCED.value,
                    reason="Estudiante muestra excelente rendimiento, incrementando desafío",
                    confidence_score=0.8,
                    made_at=datetime.now()
                )
                return decision
        
        return None
    
    async def _decrease_difficulty(
        self, 
        path: AdaptiveLearningPath, 
        profile: StudentLearningProfile
    ) -> Optional[AdaptationDecision]:
        """Decrementar dificultad y añadir contenido de refuerzo"""
        
        decision = AdaptationDecision(
            student_id=profile.student_id,
            decision_type="difficulty_decrease",
            old_value=profile.current_difficulty_level.value,
            new_value=DifficultyLevel.BEGINNER.value,
            reason="Rendimiento bajo detectado, añadiendo contenido de refuerzo",
            confidence_score=0.9,
            made_at=datetime.now()
        )
        
        return decision
    
    async def _adjust_pace_slower(
        self, 
        path: AdaptiveLearningPath, 
        profile: StudentLearningProfile
    ) -> Optional[AdaptationDecision]:
        """Ajustar a ritmo más lento"""
        
        decision = AdaptationDecision(
            student_id=profile.student_id,
            decision_type="pace_adjustment",
            old_value=profile.preferred_pace.value,
            new_value=LearningPace.SLOW.value,
            reason="Tiempo de completado superior al esperado, ajustando ritmo",
            confidence_score=0.75,
            made_at=datetime.now()
        )
        
        return decision
    
    async def _adjust_pace_faster(
        self, 
        path: AdaptiveLearningPath, 
        profile: StudentLearningProfile
    ) -> Optional[AdaptationDecision]:
        """Ajustar a ritmo más rápido"""
        
        decision = AdaptationDecision(
            student_id=profile.student_id,
            decision_type="pace_adjustment", 
            old_value=profile.preferred_pace.value,
            new_value=LearningPace.FAST.value,
            reason="Completado más rápido que lo esperado, optimizando ritmo",
            confidence_score=0.8,
            made_at=datetime.now()
        )
        
        return decision
    
    async def _switch_content_type(
        self, 
        path: AdaptiveLearningPath, 
        profile: StudentLearningProfile
    ) -> Optional[AdaptationDecision]:
        """Cambiar tipo de contenido por bajo engagement"""
        
        # Determinar mejor tipo de contenido según estilo de aprendizaje
        style_content_map = {
            LearningStyle.VISUAL: ContentType.VIDEO,
            LearningStyle.AUDITORY: ContentType.AUDIO,
            LearningStyle.KINESTHETIC: ContentType.INTERACTIVE,
            LearningStyle.READING_WRITING: ContentType.TEXT
        }
        
        recommended_type = style_content_map.get(profile.learning_style, ContentType.INTERACTIVE)
        
        decision = AdaptationDecision(
            student_id=profile.student_id,
            decision_type="content_switch",
            old_value="mixed_content",
            new_value=recommended_type.value,
            reason=f"Bajo engagement detectado, cambiando a contenido {recommended_type.value}",
            confidence_score=0.7,
            made_at=datetime.now()
        )
        
        return decision