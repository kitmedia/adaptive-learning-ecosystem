#!/usr/bin/env python3
"""
Mock Diagnostic Service - Sin dependencias externas
Adaptive Learning Ecosystem - EbroValley Digital
"""

import random
import json
from datetime import datetime
from typing import Dict, List, Any

class MockDiagnosticService:
    """Servicio de diagnóstico mock con lógica real pero sin ML"""
    
    def __init__(self):
        self.learning_styles = ["visual", "auditory", "kinesthetic", "reading_writing", "multimodal"]
        self.difficulty_levels = ["beginner", "intermediate", "advanced"]
        self.paces = ["slow", "normal", "fast"]
    
    def generate_initial_assessment(self, student_id: str) -> Dict[str, Any]:
        """Genera evaluación inicial personalizada"""
        
        # Preguntas de estilo de aprendizaje
        learning_style_questions = [
            {
                "id": "ls_1",
                "question": "¿Cómo prefieres recibir nueva información?",
                "options": [
                    {"value": "visual", "text": "Diagramas, gráficos e imágenes"},
                    {"value": "auditory", "text": "Explicaciones habladas y discusiones"},
                    {"value": "kinesthetic", "text": "Actividades prácticas y experimentación"},
                    {"value": "reading_writing", "text": "Lectura y toma de notas"}
                ]
            },
            {
                "id": "ls_2", 
                "question": "¿Qué te ayuda más a recordar información?",
                "options": [
                    {"value": "visual", "text": "Ver ejemplos y demostraciones"},
                    {"value": "auditory", "text": "Repetir en voz alta y escuchar"},
                    {"value": "kinesthetic", "text": "Practicar y hacer ejercicios"},
                    {"value": "reading_writing", "text": "Escribir resúmenes y notas"}
                ]
            }
        ]
        
        # Preguntas de ritmo preferido
        pace_questions = [
            {
                "id": "pace_1",
                "question": "¿A qué velocidad prefieres aprender contenido nuevo?",
                "options": [
                    {"value": "slow", "text": "Despacio, con tiempo para reflexionar"},
                    {"value": "normal", "text": "A ritmo normal, paso a paso"},
                    {"value": "fast", "text": "Rápido, prefiero desafíos"}
                ]
            }
        ]
        
        # Preguntas de dificultad
        difficulty_questions = [
            {
                "id": "difficulty_1",
                "question": "¿Cómo te sientes con conceptos complejos?",
                "options": [
                    {"value": "beginner", "text": "Prefiero empezar con lo básico"},
                    {"value": "intermediate", "text": "Puedo manejar complejidad moderada"},
                    {"value": "advanced", "text": "Me gustan los desafíos complejos"}
                ]
            }
        ]
        
        # Preguntas de intereses
        interest_questions = [
            {
                "id": "interests_1",
                "question": "¿Qué temas te interesan más? (selecciona múltiples)",
                "type": "multiple_choice",
                "options": [
                    {"value": "technology", "text": "Tecnología e Innovación"},
                    {"value": "science", "text": "Ciencias y Matemáticas"},
                    {"value": "arts", "text": "Arte y Creatividad"},
                    {"value": "business", "text": "Negocios y Emprendimiento"},
                    {"value": "social", "text": "Ciencias Sociales"},
                    {"value": "practical", "text": "Aplicaciones Prácticas"}
                ]
            }
        ]
        
        # Preguntas de motivación
        motivation_questions = [
            {
                "id": "motivation_1",
                "question": "¿Qué te motiva más al aprender?",
                "options": [
                    {"value": "achievement", "text": "Lograr objetivos y certificaciones"},
                    {"value": "curiosity", "text": "Satisfacer mi curiosidad"},
                    {"value": "application", "text": "Aplicar conocimientos a problemas reales"},
                    {"value": "social", "text": "Colaborar y aprender con otros"}
                ]
            }
        ]
        
        assessment = {
            "student_id": student_id,
            "assessment_type": "initial_diagnostic",
            "sections": {
                "learning_style": {
                    "title": "Estilo de Aprendizaje",
                    "description": "Identifica cómo prefieres procesar información",
                    "questions": learning_style_questions
                },
                "pace_preference": {
                    "title": "Ritmo de Aprendizaje", 
                    "description": "Determina tu velocidad de aprendizaje óptima",
                    "questions": pace_questions
                },
                "difficulty_level": {
                    "title": "Nivel de Dificultad",
                    "description": "Evalúa tu nivel de comodidad con la complejidad",
                    "questions": difficulty_questions
                },
                "interests": {
                    "title": "Intereses y Preferencias",
                    "description": "Identifica tus áreas de interés",
                    "questions": interest_questions
                },
                "motivation": {
                    "title": "Factores de Motivación",
                    "description": "Comprende qué te impulsa a aprender",
                    "questions": motivation_questions
                }
            },
            "estimated_time_minutes": 8,
            "generated_at": datetime.now().isoformat()
        }
        
        return assessment
    
    def analyze_responses(self, student_id: str, responses: Dict[str, Any]) -> Dict[str, Any]:
        """Analiza respuestas y crea perfil de aprendizaje"""
        
        # Analizar estilo de aprendizaje
        style_scores = {"visual": 0, "auditory": 0, "kinesthetic": 0, "reading_writing": 0}
        
        for response_id, answer in responses.items():
            if response_id.startswith("ls_"):
                if isinstance(answer, str) and answer in style_scores:
                    style_scores[answer] += 1
        
        # Determinar estilo dominante
        dominant_style = max(style_scores.items(), key=lambda x: x[1])
        learning_style = dominant_style[0]
        confidence = (dominant_style[1] / max(1, sum(style_scores.values()))) * 0.8 + 0.2
        
        # Si hay empate, usar multimodal
        max_score = dominant_style[1]
        tied_styles = [style for style, score in style_scores.items() if score == max_score]
        if len(tied_styles) > 1:
            learning_style = "multimodal"
            confidence = 0.7
        
        # Analizar ritmo preferido
        pace_responses = [answer for response_id, answer in responses.items() 
                         if response_id.startswith("pace_")]
        preferred_pace = pace_responses[0] if pace_responses else "normal"
        
        # Analizar nivel de dificultad
        difficulty_responses = [answer for response_id, answer in responses.items() 
                              if response_id.startswith("difficulty_")]
        difficulty_level = difficulty_responses[0] if difficulty_responses else "beginner"
        
        # Analizar intereses
        interests = []
        for response_id, answer in responses.items():
            if response_id.startswith("interests_"):
                if isinstance(answer, list):
                    interests.extend(answer)
                elif isinstance(answer, str):
                    interests.append(answer)
        
        # Analizar motivación
        motivation_factors = []
        for response_id, answer in responses.items():
            if response_id.startswith("motivation_"):
                motivation_factors.append(answer)
        
        # Generar fortalezas y debilidades basadas en el perfil
        strengths = self._generate_strengths(learning_style, preferred_pace, difficulty_level)
        weaknesses = self._generate_weaknesses(learning_style, preferred_pace, difficulty_level)
        
        # Calcular span de atención basado en respuestas
        attention_span = self._calculate_attention_span(preferred_pace, difficulty_level)
        
        profile = {
            "learning_style": learning_style,
            "confidence": round(confidence, 2),
            "preferred_pace": preferred_pace,
            "difficulty_level": difficulty_level,
            "interests": interests,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "motivation_factors": motivation_factors,
            "attention_span": attention_span,
            "optimal_session_length": min(attention_span + 5, 45),
            "created_at": datetime.now().isoformat(),
            "raw_scores": style_scores
        }
        
        return profile
    
    def _generate_strengths(self, learning_style: str, pace: str, difficulty: str) -> List[str]:
        """Genera fortalezas basadas en el perfil"""
        strengths = []
        
        # Fortalezas por estilo de aprendizaje
        style_strengths = {
            "visual": ["procesamiento_visual", "reconocimiento_patrones", "memoria_espacial"],
            "auditory": ["procesamiento_auditivo", "memoria_verbal", "discusion_grupal"],
            "kinesthetic": ["aprendizaje_experiencial", "aplicacion_practica", "resolucion_problemas"],
            "reading_writing": ["analisis_textual", "sintesis_informacion", "expresion_escrita"],
            "multimodal": ["adaptabilidad", "flexibilidad_aprendizaje", "multiples_perspectivas"]
        }
        
        strengths.extend(style_strengths.get(learning_style, []))
        
        # Fortalezas por ritmo
        if pace == "fast":
            strengths.extend(["procesamiento_rapido", "asimilacion_conceptos"])
        elif pace == "slow":
            strengths.extend(["analisis_profundo", "reflexion_critica"])
        
        # Fortalezas por dificultad
        if difficulty == "advanced":
            strengths.extend(["pensamiento_abstracto", "conceptos_complejos"])
        
        return strengths[:5]  # Limitar a 5 fortalezas principales
    
    def _generate_weaknesses(self, learning_style: str, pace: str, difficulty: str) -> List[str]:
        """Genera debilidades potenciales basadas en el perfil"""
        weaknesses = []
        
        # Debilidades por estilo de aprendizaje
        style_weaknesses = {
            "visual": ["contenido_puramente_auditivo", "explicaciones_verbales_largas"],
            "auditory": ["diagramas_complejos", "contenido_visual_denso"],
            "kinesthetic": ["teoria_abstracta", "contenido_estatico"],
            "reading_writing": ["actividades_practicas", "contenido_multimedia"],
            "multimodal": ["especializacion_profunda", "consistencia_metodologica"]
        }
        
        weaknesses.extend(style_weaknesses.get(learning_style, []))
        
        # Debilidades por ritmo
        if pace == "fast":
            weaknesses.extend(["detalles_minuciosos", "revision_exhaustiva"])
        elif pace == "slow":
            weaknesses.extend(["presion_temporal", "contenido_acelerado"])
        
        # Debilidades por dificultad
        if difficulty == "beginner":
            weaknesses.extend(["conceptos_avanzados", "abstraccion_compleja"])
        
        return weaknesses[:4]  # Limitar a 4 debilidades principales
    
    def _calculate_attention_span(self, pace: str, difficulty: str) -> int:
        """Calcula span de atención en minutos"""
        base_span = 25  # Promedio adulto
        
        if pace == "fast":
            base_span += 5
        elif pace == "slow":
            base_span -= 5
        
        if difficulty == "advanced":
            base_span += 10
        elif difficulty == "beginner":
            base_span -= 5
        
        return max(15, min(base_span, 60))  # Entre 15 y 60 minutos