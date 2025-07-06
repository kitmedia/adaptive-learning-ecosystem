"""
Intelligent Tutoring Service - Tutoría Inteligente y Chatbot Educativo
Adaptive Learning Ecosystem - EbroValley Digital
ToñoAdPAOS & Claudio Supreme

Chatbots y tutores virtuales que resuelven dudas, sugieren recursos y acompañan
el proceso, adaptando su intervención al perfil y ritmo del estudiante
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import random
import re
from enum import Enum

from ..models.learning_models import (
    StudentLearningProfile, LearningActivity, LearningStyle,
    DifficultyLevel, ContentType, RealTimeFeedback
)

logger = logging.getLogger(__name__)

class ConversationIntent(str, Enum):
    CONCEPT_EXPLANATION = "concept_explanation"
    PROBLEM_SOLVING = "problem_solving"
    MOTIVATION = "motivation"
    STUDY_GUIDANCE = "study_guidance"
    TECHNICAL_HELP = "technical_help"
    PROGRESS_INQUIRY = "progress_inquiry"
    RESOURCE_REQUEST = "resource_request"
    EMOTIONAL_SUPPORT = "emotional_support"

class TutorPersonality(str, Enum):
    ENCOURAGING = "encouraging"      # Para estudiantes con baja confianza
    CHALLENGING = "challenging"      # Para estudiantes avanzados
    PATIENT = "patient"              # Para estudiantes con dificultades
    ENTHUSIASTIC = "enthusiastic"   # Para estudiantes desmotivados
    ANALYTICAL = "analytical"        # Para estudiantes orientados a detalles

class ConversationContext:
    """Contexto de conversación con el estudiante"""
    def __init__(
        self,
        student_id: str,
        current_topic: str,
        difficulty_level: DifficultyLevel,
        recent_performance: Dict[str, float],
        conversation_history: List[Dict[str, str]] = None
    ):
        self.student_id = student_id
        self.current_topic = current_topic
        self.difficulty_level = difficulty_level
        self.recent_performance = recent_performance
        self.conversation_history = conversation_history or []
        self.session_start = datetime.now()
        self.total_interactions = len(self.conversation_history)

class IntelligentTutoringService:
    """
    Servicio de tutoría inteligente con chatbot adaptativo
    Proporciona apoyo personalizado según el perfil del estudiante
    """
    
    def __init__(self):
        self.conversation_templates = self._initialize_conversation_templates()
        self.intent_patterns = self._initialize_intent_patterns()
        self.personality_adapters = self._initialize_personality_adapters()
        self.knowledge_base = self._initialize_knowledge_base()
        self.active_conversations = {}  # Cache de conversaciones activas
        
    def _initialize_conversation_templates(self) -> Dict[str, Dict[str, List[str]]]:
        """Plantillas de conversación por estilo de aprendizaje"""
        return {
            "visual": {
                "greeting": [
                    "¡Hola! 👋 Soy tu tutor virtual. ¿En qué puedo ayudarte visualmente hoy?",
                    "¡Bienvenido/a! 🎯 ¿Te gustaría que te muestre algún diagrama o imagen explicativa?",
                    "¡Perfecto! 📊 Estoy aquí para hacer los conceptos más claros visualmente"
                ],
                "explanation": [
                    "Te voy a explicar esto con un diagrama mental. Imagina que...",
                    "Visualiza este concepto como si fuera un mapa. En el centro tenemos...",
                    "Piensa en esto como una infografía. Los elementos principales son..."
                ],
                "encouragement": [
                    "¡Excelente! 🌟 Puedes ver claramente cómo se conectan las ideas",
                    "¡Genial! 📈 Tu comprensión visual está mejorando notablemente",
                    "¡Fantástico! 🎨 Estás capturando la esencia visual del concepto"
                ],
                "problem_solving": [
                    "Vamos a resolver esto paso a paso. Primero, observa este patrón...",
                    "Dibuja mentalmente la situación. ¿Qué elementos visuales identificas?",
                    "Imagina que tienes que explicar esto con un gráfico. ¿Cómo lo harías?"
                ]
            },
            
            "auditory": {
                "greeting": [
                    "¡Hola! 🎵 Soy tu tutor virtual. ¿Qué te gustaría que te explique paso a paso?",
                    "¡Bienvenido/a! 🔊 Estoy aquí para conversar sobre cualquier duda que tengas",
                    "¡Perfecto! 🎧 Vamos a hablar sobre lo que necesitas aprender"
                ],
                "explanation": [
                    "Te voy a explicar esto como si fuera una historia. Escucha atentamente...",
                    "Imagina que estamos conversando sobre este tema. La idea principal es...",
                    "Piensa en esto como una secuencia musical. Cada nota representa..."
                ],
                "encouragement": [
                    "¡Excelente! 🎵 Tu comprensión auditiva está en perfecta sintonía",
                    "¡Genial! 📻 Estás escuchando y procesando la información de manera clara",
                    "¡Fantástico! 🎤 Tu capacidad de síntesis verbal es impresionante"
                ],
                "problem_solving": [
                    "Hablemos de este problema. Primero, repíteme lo que entiendes...",
                    "Vamos a conversar sobre la solución. ¿Cómo explicarías el primer paso?",
                    "Escucha esta secuencia de pasos y dime cuál resuena más contigo..."
                ]
            },
            
            "kinesthetic": {
                "greeting": [
                    "¡Hola! 💪 Soy tu tutor virtual. ¿Listo/a para poner manos a la obra?",
                    "¡Bienvenido/a! ⚡ Vamos a aprender haciendo. ¿En qué quieres practicar?",
                    "¡Perfecto! 🔧 Estoy aquí para que experimentes y descubras por ti mismo/a"
                ],
                "explanation": [
                    "Vamos a construir este concepto paso a paso, como un proyecto...",
                    "Imagina que estás armando algo. Cada pieza representa...",
                    "Piensa en esto como un experimento. Si tocas/mueves esto, entonces..."
                ],
                "encouragement": [
                    "¡Excelente! 💪 Tu enfoque práctico está dando resultados",
                    "¡Genial! ⚡ Tu energía y metodología hands-on es perfecta",
                    "¡Fantástico! 🏆 Estás dominando este concepto a través de la práctica"
                ],
                "problem_solving": [
                    "Vamos a resolver esto experimentando. Primero, intenta...",
                    "Simula mentalmente cada paso. ¿Qué pasaría si...?",
                    "Imagina que puedes manipular los elementos. ¿Cómo los organizarías?"
                ]
            },
            
            "reading_writing": {
                "greeting": [
                    "¡Hola! 📚 Soy tu tutor virtual. ¿Te gustaría que revisemos algún concepto en detalle?",
                    "¡Bienvenido/a! ✍️ Estoy aquí para analizar y profundizar en cualquier tema",
                    "¡Perfecto! 📖 Vamos a explorar las ideas con la profundidad que mereces"
                ],
                "explanation": [
                    "Te voy a explicar esto de manera estructurada. Primero, definamos...",
                    "Analicemos este concepto paso a paso. El punto clave es...",
                    "Veamos este tema desde una perspectiva académica. La teoría indica..."
                ],
                "encouragement": [
                    "¡Excelente! 📚 Tu análisis textual es muy profundo y preciso",
                    "¡Genial! ✍️ Tu capacidad de síntesis y comprensión escrita es notable",
                    "¡Fantástico! 🎓 Tu enfoque académico y metodológico es admirable"
                ],
                "problem_solving": [
                    "Analicemos este problema sistemáticamente. Paso 1: identificar...",
                    "Vamos a desglosar este ejercicio. ¿Qué información tenemos?",
                    "Estructuremos la solución. Los elementos clave son..."
                ]
            }
        }
    
    def _initialize_intent_patterns(self) -> Dict[ConversationIntent, List[str]]:
        """Patrones para identificar intención del estudiante"""
        return {
            ConversationIntent.CONCEPT_EXPLANATION: [
                r"(?i)(qué es|explica|explicar|no entiendo|ayuda con|concepto)",
                r"(?i)(cómo funciona|cómo se hace|definición|significado)",
                r"(?i)(no comprendo|confundido|difícil de entender)"
            ],
            ConversationIntent.PROBLEM_SOLVING: [
                r"(?i)(resolver|solución|problema|ejercicio|ayuda con)",
                r"(?i)(no sé cómo|stuck|atascado|no puedo|error)",
                r"(?i)(paso a paso|guía|método|procedimiento)"
            ],
            ConversationIntent.MOTIVATION: [
                r"(?i)(difícil|frustrante|desanimado|rendir|abandonar)",
                r"(?i)(no puedo|imposible|muy complicado|desmotivado)",
                r"(?i)(cansado|aburrido|no sirvo|mal estudiante)"
            ],
            ConversationIntent.STUDY_GUIDANCE: [
                r"(?i)(cómo estudiar|método|estrategia|organizar|planificar)",
                r"(?i)(tiempo|horario|schedule|rutina|plan de estudio)",
                r"(?i)(consejo|tip|recomendación|guidance)"
            ],
            ConversationIntent.PROGRESS_INQUIRY: [
                r"(?i)(progreso|avance|cómo voy|nivel|rendimiento)",
                r"(?i)(mejorando|empeorando|estadísticas|resultado|score)",
                r"(?i)(comparación|ranking|position|status)"
            ],
            ConversationIntent.RESOURCE_REQUEST: [
                r"(?i)(recurso|material|video|ejercicio|práctica)",
                r"(?i)(ejemplo|caso|referencia|documentación|link)",
                r"(?i)(más información|ampliar|profundizar|extra)"
            ],
            ConversationIntent.EMOTIONAL_SUPPORT: [
                r"(?i)(estresado|ansioso|worried|nervioso|pressure)",
                r"(?i)(support|apoyo|ayuda emocional|sentir|emoción)",
                r"(?i)(fear|miedo|inseguro|confidence|confianza)"
            ]
        }
    
    def _initialize_personality_adapters(self) -> Dict[TutorPersonality, Dict[str, Any]]:
        """Configuración de personalidades del tutor"""
        return {
            TutorPersonality.ENCOURAGING: {
                "tone": "supportive",
                "language_style": "warm",
                "emoji_frequency": "high",
                "encouragement_ratio": 0.7,
                "challenge_level": "gentle",
                "response_patterns": [
                    "¡Muy bien! Estás en el camino correcto...",
                    "Perfecto, cada paso cuenta. Sigamos...",
                    "¡Excelente pregunta! Esto demuestra que estás pensando..."
                ]
            },
            
            TutorPersonality.CHALLENGING: {
                "tone": "stimulating",
                "language_style": "direct",
                "emoji_frequency": "medium",
                "encouragement_ratio": 0.4,
                "challenge_level": "high",
                "response_patterns": [
                    "Interesante. Ahora llevemos esto al siguiente nivel...",
                    "Bien, pero ¿puedes ir más profundo? Considera...",
                    "Correcto. ¿Qué pasaría si complicáramos la situación?"
                ]
            },
            
            TutorPersonality.PATIENT: {
                "tone": "calm",
                "language_style": "simple",
                "emoji_frequency": "medium",
                "encouragement_ratio": 0.8,
                "challenge_level": "low",
                "response_patterns": [
                    "No te preocupes, vamos despacio. Primero...",
                    "Está bien, todos aprendemos a nuestro ritmo...",
                    "Tomemos esto paso a paso, sin prisa..."
                ]
            },
            
            TutorPersonality.ENTHUSIASTIC: {
                "tone": "energetic",
                "language_style": "dynamic",
                "emoji_frequency": "very_high",
                "encouragement_ratio": 0.9,
                "challenge_level": "medium",
                "response_patterns": [
                    "¡Qué emocionante! 🚀 Este tema es fascinante...",
                    "¡Wow! 🌟 Estás descubriendo algo increíble...",
                    "¡Fantástico! 🎉 Me encanta tu curiosidad..."
                ]
            },
            
            TutorPersonality.ANALYTICAL: {
                "tone": "methodical",
                "language_style": "precise",
                "emoji_frequency": "low",
                "encouragement_ratio": 0.5,
                "challenge_level": "medium",
                "response_patterns": [
                    "Analicemos esto sistemáticamente. Paso 1...",
                    "Examinemos los datos. Observo que...",
                    "Desde una perspectiva lógica, consideremos..."
                ]
            }
        }
    
    def _initialize_knowledge_base(self) -> Dict[str, Dict[str, Any]]:
        """Base de conocimiento para respuestas del tutor"""
        return {
            "machine_learning": {
                "definitions": {
                    "simple": "Machine Learning es enseñar a las computadoras a aprender patrones automáticamente",
                    "detailed": "Machine Learning es una rama de la IA que permite a las máquinas aprender y mejorar automáticamente a partir de la experiencia sin ser programadas explícitamente"
                },
                "examples": [
                    "Como cuando Netflix te recomienda películas basándose en lo que has visto antes",
                    "Como el corrector automático de tu teléfono que aprende cómo escribes",
                    "Como los filtros de spam que aprenden a identificar correos no deseados"
                ],
                "analogies": {
                    "visual": "Es como enseñar a reconocer formas: después de ver muchos círculos, puedes identificar uno nuevo",
                    "auditory": "Es como aprender una canción: después de escucharla varias veces, puedes cantarla",
                    "kinesthetic": "Es como aprender a andar en bicicleta: tu cuerpo aprende el equilibrio con la práctica",
                    "reading_writing": "Es como estudiar gramática: analizas patrones en textos para escribir correctamente"
                }
            },
            
            "algorithms": {
                "definitions": {
                    "simple": "Un algoritmo es una receta paso a paso para resolver un problema",
                    "detailed": "Un algoritmo es un conjunto finito de instrucciones bien definidas para resolver un problema o realizar una tarea específica"
                },
                "examples": [
                    "Como una receta de cocina: ingredientes, pasos ordenados, resultado final",
                    "Como las instrucciones para armar un mueble de IKEA",
                    "Como los pasos para resolver una ecuación matemática"
                ]
            }
        }
    
    async def process_student_message(
        self,
        student_id: str,
        message: str,
        profile: StudentLearningProfile,
        context: ConversationContext
    ) -> Dict[str, Any]:
        """Procesar mensaje del estudiante y generar respuesta personalizada"""
        
        logger.info(f"Processing message from student {student_id}: {message[:50]}...")
        
        # 1. Identificar intención del mensaje
        intent = self._identify_intent(message)
        
        # 2. Determinar personalidad del tutor apropiada
        tutor_personality = self._select_tutor_personality(profile, context)
        
        # 3. Generar respuesta contextual
        response = await self._generate_contextual_response(
            message, intent, profile, context, tutor_personality
        )
        
        # 4. Añadir elementos adaptativos
        adaptive_elements = self._add_adaptive_elements(response, profile, context)
        
        # 5. Determinar acciones de seguimiento
        follow_up_actions = self._determine_follow_up_actions(intent, context, profile)
        
        # 6. Actualizar contexto de conversación
        updated_context = self._update_conversation_context(
            context, message, response, intent
        )
        
        return {
            "response_text": response,
            "intent_detected": intent.value,
            "tutor_personality": tutor_personality.value,
            "adaptive_elements": adaptive_elements,
            "follow_up_actions": follow_up_actions,
            "conversation_context": updated_context,
            "response_timestamp": datetime.now(),
            "confidence_score": self._calculate_response_confidence(intent, profile)
        }
    
    def _identify_intent(self, message: str) -> ConversationIntent:
        """Identificar intención del mensaje del estudiante"""
        
        message_lower = message.lower()
        intent_scores = {}
        
        # Calcular score para cada intención basado en patrones
        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    score += 1
            
            # Normalizar por número de patrones
            intent_scores[intent] = score / len(patterns)
        
        # Retornar intención con mayor score
        if intent_scores:
            best_intent = max(intent_scores, key=intent_scores.get)
            if intent_scores[best_intent] > 0:
                return best_intent
        
        # Default: explicación de concepto
        return ConversationIntent.CONCEPT_EXPLANATION
    
    def _select_tutor_personality(
        self,
        profile: StudentLearningProfile,
        context: ConversationContext
    ) -> TutorPersonality:
        """Seleccionar personalidad del tutor según perfil del estudiante"""
        
        # Analizar rendimiento reciente
        recent_performance = context.recent_performance.get("avg_score", 0.7)
        engagement_level = context.recent_performance.get("engagement", 0.7)
        
        # Criterios para selección de personalidad
        if recent_performance < 0.5:
            return TutorPersonality.PATIENT
        elif recent_performance > 0.85:
            return TutorPersonality.CHALLENGING
        elif engagement_level < 0.5:
            return TutorPersonality.ENTHUSIASTIC
        elif "analytical_thinking" in profile.strengths:
            return TutorPersonality.ANALYTICAL
        else:
            return TutorPersonality.ENCOURAGING
    
    async def _generate_contextual_response(
        self,
        message: str,
        intent: ConversationIntent,
        profile: StudentLearningProfile,
        context: ConversationContext,
        personality: TutorPersonality
    ) -> str:
        """Generar respuesta contextual personalizada"""
        
        # Obtener plantillas para el estilo de aprendizaje
        learning_style = profile.learning_style.value
        if learning_style not in self.conversation_templates:
            learning_style = "visual"  # fallback
        
        templates = self.conversation_templates[learning_style]
        personality_config = self.personality_adapters[personality]
        
        # Generar respuesta basada en intención
        if intent == ConversationIntent.CONCEPT_EXPLANATION:
            response = await self._generate_explanation_response(
                message, templates, personality_config, profile, context
            )
        
        elif intent == ConversationIntent.PROBLEM_SOLVING:
            response = await self._generate_problem_solving_response(
                message, templates, personality_config, context
            )
        
        elif intent == ConversationIntent.MOTIVATION:
            response = await self._generate_motivational_response(
                templates, personality_config, profile, context
            )
        
        elif intent == ConversationIntent.STUDY_GUIDANCE:
            response = await self._generate_study_guidance_response(
                templates, personality_config, profile
            )
        
        elif intent == ConversationIntent.PROGRESS_INQUIRY:
            response = await self._generate_progress_response(
                context, personality_config
            )
        
        else:
            # Respuesta genérica
            response = self._generate_generic_response(templates, personality_config)
        
        return self._apply_personality_style(response, personality_config)
    
    async def _generate_explanation_response(
        self,
        message: str,
        templates: Dict[str, List[str]],
        personality_config: Dict[str, Any],
        profile: StudentLearningProfile,
        context: ConversationContext
    ) -> str:
        """Generar explicación adaptada al estilo de aprendizaje"""
        
        # Extraer concepto del mensaje
        concept = self._extract_concept_from_message(message)
        
        # Buscar en base de conocimiento
        if concept in self.knowledge_base:
            knowledge = self.knowledge_base[concept]
            
            # Seleccionar nivel de explicación
            if context.difficulty_level == DifficultyLevel.BEGINNER:
                definition = knowledge["definitions"]["simple"]
            else:
                definition = knowledge["definitions"]["detailed"]
            
            # Añadir analogía según estilo de aprendizaje
            learning_style = profile.learning_style.value
            if learning_style in knowledge.get("analogies", {}):
                analogy = knowledge["analogies"][learning_style]
                definition += f"\n\nPiénsalo así: {analogy}"
            
            # Añadir ejemplo
            if "examples" in knowledge:
                example = random.choice(knowledge["examples"])
                definition += f"\n\nPor ejemplo: {example}"
            
            return definition
        
        else:
            # Respuesta genérica adaptada al estilo
            explanation_template = random.choice(templates.get("explanation", [
                "Te explico este concepto de manera clara..."
            ]))
            
            return f"{explanation_template} {concept}. ¿Te gustaría que profundice en algún aspecto específico?"
    
    async def _generate_problem_solving_response(
        self,
        message: str,
        templates: Dict[str, List[str]],
        personality_config: Dict[str, Any],
        context: ConversationContext
    ) -> str:
        """Generar respuesta para resolución de problemas"""
        
        problem_template = random.choice(templates.get("problem_solving", [
            "Vamos a resolver esto paso a paso..."
        ]))
        
        # Adaptar según nivel de desafío de la personalidad
        challenge_level = personality_config["challenge_level"]
        
        if challenge_level == "gentle":
            guidance = "No te preocupes, vamos despacio. "
        elif challenge_level == "high":
            guidance = "Perfecto, un buen desafío. "
        else:
            guidance = ""
        
        return f"{guidance}{problem_template} ¿Podrías mostrarme exactamente dónde te quedaste?"
    
    async def _generate_motivational_response(
        self,
        templates: Dict[str, List[str]],
        personality_config: Dict[str, Any],
        profile: StudentLearningProfile,
        context: ConversationContext
    ) -> str:
        """Generar respuesta motivacional personalizada"""
        
        encouragement_base = random.choice(templates.get("encouragement", [
            "¡Ánimo! Estás progresando muy bien."
        ]))
        
        # Añadir contexto específico del progreso
        recent_score = context.recent_performance.get("avg_score", 0.7)
        
        if recent_score > 0.6:
            progress_note = "He visto tu progreso y realmente estás mejorando. "
        else:
            progress_note = "Sé que puede parecer difícil ahora, pero cada estudiante aprende a su ritmo. "
        
        motivation_boost = "Recuerda: cada error es una oportunidad de aprender algo nuevo. ¡Sigamos adelante juntos!"
        
        return f"{progress_note}{encouragement_base} {motivation_boost}"
    
    async def _generate_study_guidance_response(
        self,
        templates: Dict[str, List[str]],
        personality_config: Dict[str, Any],
        profile: StudentLearningProfile
    ) -> str:
        """Generar consejos de estudio personalizados"""
        
        # Consejos específicos por estilo de aprendizaje
        style_tips = {
            LearningStyle.VISUAL: [
                "Crea mapas mentales y diagramas",
                "Usa colores para organizar información",
                "Busca videos educativos y gráficos"
            ],
            LearningStyle.AUDITORY: [
                "Explica conceptos en voz alta",
                "Escucha podcasts educativos",
                "Estudia en grupos de discusión"
            ],
            LearningStyle.KINESTHETIC: [
                "Toma descansos frecuentes y muévete",
                "Usa ejemplos prácticos y simulaciones",
                "Experimenta con proyectos hands-on"
            ],
            LearningStyle.READING_WRITING: [
                "Toma notas detalladas",
                "Escribe resúmenes de cada tema",
                "Crea listas y esquemas estructurados"
            ]
        }
        
        tips = style_tips.get(profile.learning_style, style_tips[LearningStyle.VISUAL])
        
        # Considerar attention span
        if profile.attention_span_minutes < 20:
            session_tip = "Divide tu estudio en sesiones de 15-20 minutos con descansos cortos."
        elif profile.attention_span_minutes > 45:
            session_tip = "Puedes manejar sesiones más largas, pero siempre incluye variedad de actividades."
        else:
            session_tip = "Sesiones de 30-40 minutos suelen ser ideales para ti."
        
        return f"Basándome en tu perfil de aprendizaje, te recomiendo:\n\n• {tips[0]}\n• {tips[1]}\n• {tips[2]}\n\n{session_tip}"
    
    async def _generate_progress_response(
        self,
        context: ConversationContext,
        personality_config: Dict[str, Any]
    ) -> str:
        """Generar respuesta sobre progreso del estudiante"""
        
        recent_performance = context.recent_performance
        avg_score = recent_performance.get("avg_score", 0.7)
        engagement = recent_performance.get("engagement", 0.7)
        
        # Clasificar progreso
        if avg_score >= 0.8:
            progress_level = "excelente"
            progress_comment = "¡Estás rindiendo de manera excepcional!"
        elif avg_score >= 0.7:
            progress_level = "muy bueno"
            progress_comment = "Tu progreso es muy sólido."
        elif avg_score >= 0.6:
            progress_level = "bueno"
            progress_comment = "Vas por buen camino, con mejoras constantes."
        else:
            progress_level = "en desarrollo"
            progress_comment = "Estás en proceso de mejora, y eso es perfectamente normal."
        
        engagement_comment = ""
        if engagement >= 0.8:
            engagement_comment = " Tu nivel de participación es fantástico."
        elif engagement < 0.5:
            engagement_comment = " Te recomiendo explorar diferentes tipos de actividades para mantener el interés."
        
        return f"Tu progreso actual es {progress_level}. {progress_comment}{engagement_comment}\n\n¿Te gustaría que analicemos algún área específica en detalle?"
    
    def _generate_generic_response(
        self,
        templates: Dict[str, List[str]],
        personality_config: Dict[str, Any]
    ) -> str:
        """Generar respuesta genérica"""
        
        generic_responses = [
            "Entiendo tu consulta. ¿Podrías darme más detalles para ayudarte mejor?",
            "Interesante pregunta. Vamos a explorar esto juntos.",
            "Perfecto, estoy aquí para apoyarte en lo que necesites."
        ]
        
        return random.choice(generic_responses)
    
    def _apply_personality_style(
        self,
        response: str,
        personality_config: Dict[str, Any]
    ) -> str:
        """Aplicar estilo de personalidad a la respuesta"""
        
        # Ajustar emojis según frecuencia configurada
        emoji_frequency = personality_config["emoji_frequency"]
        
        if emoji_frequency == "very_high" and "🚀" not in response:
            response += " 🚀"
        elif emoji_frequency == "high" and "✨" not in response:
            response += " ✨"
        elif emoji_frequency == "medium" and "👍" not in response:
            response += " 👍"
        
        # Ajustar tono según configuración
        tone = personality_config["tone"]
        if tone == "energetic" and not response.endswith("!"):
            response += "!"
        
        return response
    
    def _extract_concept_from_message(self, message: str) -> str:
        """Extraer concepto principal del mensaje"""
        
        # Patrones para extraer conceptos
        concept_patterns = [
            r"(?i)qué es (\w+)",
            r"(?i)explica (\w+)",
            r"(?i)no entiendo (\w+)",
            r"(?i)ayuda con (\w+)"
        ]
        
        for pattern in concept_patterns:
            match = re.search(pattern, message)
            if match:
                return match.group(1).lower()
        
        # Si no encuentra patrón específico, buscar palabras clave conocidas
        known_concepts = list(self.knowledge_base.keys())
        for concept in known_concepts:
            if concept in message.lower():
                return concept
        
        return "concepto"  # Fallback genérico
    
    def _add_adaptive_elements(
        self,
        response: str,
        profile: StudentLearningProfile,
        context: ConversationContext
    ) -> Dict[str, Any]:
        """Añadir elementos adaptativos a la respuesta"""
        
        adaptive_elements = {
            "suggested_resources": [],
            "next_actions": [],
            "difficulty_adjustment": None,
            "content_recommendations": []
        }
        
        # Sugerir recursos según estilo de aprendizaje
        if profile.learning_style == LearningStyle.VISUAL:
            adaptive_elements["suggested_resources"].append("video_explanation")
            adaptive_elements["suggested_resources"].append("infographic")
        
        elif profile.learning_style == LearningStyle.AUDITORY:
            adaptive_elements["suggested_resources"].append("audio_podcast")
            adaptive_elements["suggested_resources"].append("voice_explanation")
        
        elif profile.learning_style == LearningStyle.KINESTHETIC:
            adaptive_elements["suggested_resources"].append("interactive_simulation")
            adaptive_elements["suggested_resources"].append("hands_on_exercise")
        
        # Ajustar dificultad si es necesario
        recent_score = context.recent_performance.get("avg_score", 0.7)
        if recent_score < 0.5:
            adaptive_elements["difficulty_adjustment"] = "decrease"
        elif recent_score > 0.85:
            adaptive_elements["difficulty_adjustment"] = "increase"
        
        return adaptive_elements
    
    def _determine_follow_up_actions(
        self,
        intent: ConversationIntent,
        context: ConversationContext,
        profile: StudentLearningProfile
    ) -> List[str]:
        """Determinar acciones de seguimiento"""
        
        actions = []
        
        if intent == ConversationIntent.CONCEPT_EXPLANATION:
            actions.extend([
                "offer_practice_exercise",
                "check_understanding",
                "suggest_related_topics"
            ])
        
        elif intent == ConversationIntent.PROBLEM_SOLVING:
            actions.extend([
                "provide_step_by_step_guide",
                "offer_similar_problems",
                "schedule_follow_up"
            ])
        
        elif intent == ConversationIntent.MOTIVATION:
            actions.extend([
                "track_mood_improvement",
                "suggest_achievable_goals",
                "connect_with_study_group"
            ])
        
        # Acciones basadas en rendimiento reciente
        recent_score = context.recent_performance.get("avg_score", 0.7)
        if recent_score < 0.6:
            actions.append("schedule_extra_support")
        
        return actions
    
    def _update_conversation_context(
        self,
        context: ConversationContext,
        student_message: str,
        tutor_response: str,
        intent: ConversationIntent
    ) -> ConversationContext:
        """Actualizar contexto de conversación"""
        
        # Añadir interacción al historial
        context.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "student_message": student_message,
            "tutor_response": tutor_response,
            "intent": intent.value
        })
        
        context.total_interactions += 1
        
        return context
    
    def _calculate_response_confidence(
        self,
        intent: ConversationIntent,
        profile: StudentLearningProfile
    ) -> float:
        """Calcular confianza en la respuesta generada"""
        
        base_confidence = 0.7
        
        # Mayor confianza para intenciones más comunes
        common_intents = [
            ConversationIntent.CONCEPT_EXPLANATION,
            ConversationIntent.PROBLEM_SOLVING,
            ConversationIntent.MOTIVATION
        ]
        
        if intent in common_intents:
            base_confidence += 0.2
        
        # Mayor confianza si el perfil está bien establecido
        if profile.learning_style_confidence > 0.8:
            base_confidence += 0.1
        
        return min(1.0, base_confidence)
    
    async def provide_proactive_support(
        self,
        student_id: str,
        profile: StudentLearningProfile,
        recent_activities: List[LearningActivity]
    ) -> Optional[Dict[str, Any]]:
        """Proporcionar apoyo proactivo basado en patrones detectados"""
        
        if not recent_activities:
            return None
        
        # Detectar patrones que requieren intervención
        help_requests = sum(a.help_requests for a in recent_activities[-5:])
        avg_completion = np.mean([a.completion_percentage for a in recent_activities[-5:]])
        
        proactive_message = None
        
        # Estudiante pidiendo mucha ayuda
        if help_requests > 8:
            proactive_message = {
                "type": "support_offer",
                "message": "He notado que has necesitado ayuda frecuentemente. ¿Te gustaría que revisemos los conceptos fundamentales juntos?",
                "priority": "high"
            }
        
        # Bajo porcentaje de completado
        elif avg_completion < 60:
            proactive_message = {
                "type": "engagement_boost",
                "message": "¿Cómo te sientes con el material actual? Podemos ajustar el enfoque si algo no está funcionando para ti.",
                "priority": "medium"
            }
        
        # Rendimiento decreciente
        elif len(recent_activities) >= 3:
            recent_scores = [a.completion_percentage for a in recent_activities[-3:]]
            if recent_scores[0] > recent_scores[-1] + 15:  # Decline of 15%+
                proactive_message = {
                    "type": "performance_check",
                    "message": "He notado algunos cambios en tu progreso. ¿Hay algo específico que te está resultando más desafiante últimamente?",
                    "priority": "medium"
                }
        
        return proactive_message